// 配套侠：角色方案与当前宿主快切控件共享同一套原生切换器。
  const COMPANION_KEY = 'tle.companion.v1';
  const COMPANION_FIELDS = [
    { id: 'profile', name: '连接配置', type: 'api' },
    { id: 'source', name: '接口来源', type: 'api' },
    { id: 'model', name: '模型', type: 'api' },
    { id: 'preset', name: '预设', type: 'preset' },
    { id: 'reasoning', name: '推理格式', type: 'reasoning' },
    { id: 'theme', name: 'UI 主题', type: 'theme' },
  ];
  const companionRuntime = {
    lastRole: '', lastApplied: new Map(), applying: false, timer: 0,
    source: null, type: '', handler: null,
  };
  function companionCurrentRole() {
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      if (!context || context.groupId != null) return null;
      const char = context.characters?.[context.characterId];
      return char?.avatar ? { key: String(char.avatar), name: String(char.name || '未命名角色') } : null;
    } catch { return null; }
  }
  function companionRead() {
    try {
      const raw = JSON.parse(HOST_WIN.localStorage.getItem(COMPANION_KEY) || 'null');
      if (raw?.schema === 1 && Array.isArray(raw.plans)) {
        return {
          schema: 1,
          plans: raw.plans.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string'
            && Array.isArray(p.roles) && p.fields && typeof p.fields === 'object'),
          defaults: raw.defaults && typeof raw.defaults === 'object' ? raw.defaults : {},
          autoApply: raw.autoApply === true,
        };
      }
    } catch (error) { console.warn('[配套侠] 读取方案失败', error); }
    return { schema: 1, plans: [], defaults: {}, autoApply: false };
  }
  function companionSave(data) {
    try {
      HOST_WIN.localStorage.setItem(COMPANION_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      HOST_WIN.toastr?.error?.('方案保存失败：浏览器存储空间不足或被禁用。');
      console.warn('[配套侠] 保存失败', error);
      return false;
    }
  }
  function companionNotice(type, message) {
    if (typeof HOST_WIN.toastr?.[type] === 'function') HOST_WIN.toastr[type](message, '配套侠');
    else console.info('[配套侠]', message);
  }
  function companionId() {
    return 'kit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }
  function companionForRole(role = companionCurrentRole()) {
    return role ? companionRead().plans.filter(p => p.roles.includes(role.key)) : [];
  }
  function companionEntryId(field, item) {
    if (field.id === 'profile') return item.selectId === 'connection_profiles';
    if (field.id === 'source') return item.selectId === 'chat_completion_source';
    if (field.id === 'model') return item.section === '模型';
    return true;
  }
  async function companionCatalogs() {
    const catalogs = {};
    for (const type of ['api', 'preset', 'reasoning', 'theme']) {
      try {
        // Catalogs are read from TLE's own host-aware quick-switch resolvers.
        catalogs[type] = await quickCatalog(type, false, state.abort.signal);
      } catch (error) {
        catalogs[type] = [];
        console.warn('[配套侠] 无法读取 ' + type + ' 列表', error);
      }
    }
    return catalogs;
  }
  function companionSnapshot(catalogs) {
    const fields = {};
    for (const field of COMPANION_FIELDS) {
      const item = (catalogs[field.type] || []).find(e => e.selected && companionEntryId(field, e));
      if (item) fields[field.id] = { selectId: item.selectId, value: item.value, label: item.label };
    }
    return fields;
  }
  function companionPlanDetails(plan) {
    return COMPANION_FIELDS.filter(field => plan.fields[field.id])
      .map(field => field.name + '：' + (plan.fields[field.id].label || plan.fields[field.id].value)).join(' · ');
  }
  function companionTextButton(label, action) {
    return quickButton(label, action, 'menu_button');
  }
  function companionRefreshList() {
    const list = state.chatTools.panel?.querySelector('[data-companion-list]');
    const heading = state.chatTools.panel?.querySelector('[data-companion-role]');
    if (!list) return;
    const role = companionCurrentRole();
    const data = companionRead();
    list.replaceChildren();
    if (heading) heading.textContent = role ? role.name + ' · ' + data.plans.filter(p => p.roles.includes(role.key)).length + ' 套方案' : '当前不是单角色聊天';
    if (!role) {
      list.append(quickNode('p', 'tle-quick-empty', '请先切换到一个角色。群聊暂不关联配套方案。'));
      return;
    }
    const plans = data.plans.filter(p => p.roles.includes(role.key));
    if (!plans.length) {
      list.append(quickNode('p', 'tle-quick-empty', '还没有绑定方案。可将当前配置直接保存为第一套方案。'));
      return;
    }
    for (const plan of plans) {
      const row = quickNode('div', 'tle-companion-plan');
      const summary = quickNode('div', 'tle-companion-copy');
      const title = quickNode('strong', '', plan.name);
      const defaultLabel = data.defaults[role.key] === plan.id ? quickNode('small', '', ' · 默认方案') : null;
      summary.append(title);
      if (defaultLabel) summary.append(defaultLabel);
      summary.append(quickNode('small', '', companionPlanDetails(plan) || '空方案'));
      const controls = quickNode('div', 'tle-companion-actions');
      const apply = companionTextButton('应用', () => { void companionApply(plan.id); });
      apply.disabled = companionRuntime.applying;
      controls.append(apply);
      row.append(summary, controls);
      list.append(row);
    }
  }
  function companionEditorRow(field, catalogs, saved) {
    const line = quickNode('div', 'tle-companion-field');
    const toggle = quickNode('input');
    toggle.type = 'checkbox';
    toggle.checked = Boolean(saved);
    const name = quickNode('span', 'tle-companion-field-label', field.name);
    const select = quickNode('select', 'text_pole');
    select.setAttribute('aria-label', field.name);
    const choices = (catalogs[field.type] || []).filter(item => companionEntryId(field, item) && !item.disabled);
    const known = new Set();
    for (const item of choices) {
      const signature = JSON.stringify([item.selectId, item.value]);
      if (known.has(signature)) continue;
      known.add(signature);
      const option = quickNode('option', '', item.label);
      option.value = signature;
      select.append(option);
    }
    const savedSignature = saved && JSON.stringify([saved.selectId, saved.value]);
    if (savedSignature && !known.has(savedSignature)) {
      const old = quickNode('option', '', '原配置（当前未读取）：' + (saved.label || saved.value));
      old.value = savedSignature;
      select.prepend(old);
    }
    if (savedSignature) select.value = savedSignature;
    else {
      const active = choices.find(item => item.selected);
      if (active) select.value = JSON.stringify([active.selectId, active.value]);
    }
    if (!select.options.length) {
      const missing = quickNode('option', '', '当前无法读取该项，请先打开原生设置');
      missing.value = '';
      select.append(missing);
      toggle.checked = false;
      toggle.disabled = true;
    }
    select.disabled = !toggle.checked;
    toggle.addEventListener('change', () => { select.disabled = !toggle.checked; });
    line.append(toggle, name, select);
    return { line, toggle, select, choices, saved };
  }
  async function companionOpenEditor(planId = '', duplicate = false, replaceCurrent = false) {
    const role = companionCurrentRole();
    if (!role) { companionNotice('warning', '请先进入单角色聊天。'); return; }
    if (companionRuntime.applying) return;
    closeChatTools(false);
    const savedData = companionRead();
    const source = savedData.plans.find(p => p.id === planId && p.roles.includes(role.key));
    if (planId && !source) { companionNotice('warning', '方案已不存在。'); return; }
    const shell = makeQuickPanel(source ? (duplicate ? '复制配套方案' : '编辑配套方案') : '保存当前配套方案', null, 'companion-editor');
    const pending = quickNode('p', 'tle-muted', '读取当前快切项目中…');
    shell.body.append(pending);
    const catalogs = await companionCatalogs();
    if (quickPanel !== shell || state.destroyed) return;
    pending.remove();
    const defaults = savedData.defaults;
    const fields = source && !replaceCurrent ? source.fields : companionSnapshot(catalogs);
    const form = quickNode('div', 'tle-companion-editor');
    const nameLabel = quickNode('label', '', '方案名称');
    const nameInput = quickNode('input', 'text_pole');
    nameInput.maxLength = 64;
    nameInput.value = source ? source.name + (duplicate ? ' · 副本' : '') : '新方案';
    nameLabel.append(nameInput);
    form.append(nameLabel, quickNode('p', 'tle-muted', '未勾选的项目保持原样。壁纸自动跟随主题绑定，不单独保存。'));
    const rows = COMPANION_FIELDS.map(field => {
      const item = companionEditorRow(field, catalogs, fields[field.id]);
      form.append(item.line);
      return { field, ...item };
    });
    const defaultRow = quickNode('label', 'tle-companion-default');
    const defaultToggle = quickNode('input');
    defaultToggle.type = 'checkbox';
    defaultToggle.checked = source && !duplicate ? defaults[role.key] === source.id : false;
    defaultRow.append(defaultToggle, quickNode('span', '', '设为当前角色的默认方案'));
    form.append(defaultRow);
    const actions = quickNode('div', 'tle-companion-actions');
    const saveButton = companionTextButton('保存方案', () => {
      const name = nameInput.value.trim();
      if (!name) { companionNotice('warning', '请填写方案名称。'); return; }
      const nextFields = {};
      for (const row of rows) {
        if (!row.toggle.checked) continue;
        let signature;
        try { signature = JSON.parse(row.select.value); } catch {}
        if (!signature || !signature[0] || signature[1] == null) continue;
        const selected = row.choices.find(item => item.selectId === signature[0] && item.value === signature[1]);
        nextFields[row.field.id] = {
          selectId: signature[0], value: signature[1],
          label: selected?.label || (row.saved?.label || String(signature[1])),
        };
      }
      if (!Object.keys(nextFields).length) { companionNotice('warning', '没有可保存的配置项。'); return; }
      const fresh = companionRead();
      const id = source && !duplicate ? source.id : companionId();
      const old = fresh.plans.find(p => p.id === id);
      const next = { id, name, roles: old?.roles || [role.key], fields: nextFields };
      fresh.plans = old ? fresh.plans.map(p => p.id === id ? next : p) : [...fresh.plans, next];
      if (defaultToggle.checked) fresh.defaults[role.key] = id;
      else if (fresh.defaults[role.key] === id) delete fresh.defaults[role.key];
      if (!companionSave(fresh)) return;
      closeQuickPanel(false);
      companionRefreshList();
      companionNotice('success', '方案已保存：' + name);
    });
    const cancel = companionTextButton('取消', () => closeQuickPanel(false));
    actions.append(saveButton, cancel);
    form.append(actions);
    shell.body.append(form);
  }
  function companionOpenManager() {
    closeChatTools(false);
    const role = companionCurrentRole();
    const shell = makeQuickPanel('配套侠 · 方案管理', null, 'companion-manager');
    const body = quickNode('div', 'tle-companion-manager');
    shell.body.append(body);
    const render = () => {
      if (quickPanel !== shell) return;
      body.replaceChildren();
      const data = companionRead();
      body.append(quickNode('p', 'tle-muted', role ? '当前角色：' + role.name : '请先进入一个角色，才能关联和编辑配套方案。'));
      const autoLabel = quickNode('label', 'tle-companion-default');
      const auto = quickNode('input');
      auto.type = 'checkbox';
      auto.checked = data.autoApply;
      auto.addEventListener('change', () => {
        const fresh = companionRead();
        fresh.autoApply = auto.checked;
        if (!companionSave(fresh)) auto.checked = !auto.checked;
      });
      autoLabel.append(auto, quickNode('span', '', '切换角色时自动应用默认方案（测试功能，默认关闭）'));
      body.append(autoLabel);
      if (!role) return;
      const add = companionTextButton('保存当前配置', () => void companionOpenEditor());
      body.append(add);
      const plans = data.plans.filter(p => p.roles.includes(role.key));
      for (const plan of plans) {
        const card = quickNode('section', 'tle-companion-plan');
        const copy = quickNode('div', 'tle-companion-copy');
        copy.append(quickNode('strong', '', plan.name));
        copy.append(quickNode('small', '', companionPlanDetails(plan)));
        const actions = quickNode('div', 'tle-companion-actions');
        const buttons = [
          ['编辑', () => void companionOpenEditor(plan.id)],
          ['复制', () => void companionOpenEditor(plan.id, true)],
          ['覆盖当前', () => void companionOpenEditor(plan.id, false, true)],
          ['设为默认', () => {
            const fresh = companionRead();
            fresh.defaults[role.key] = plan.id;
            if (companionSave(fresh)) render();
          }],
          ['删除', () => {
            if (!HOST_WIN.confirm('确认删除方案「' + plan.name + '」？不会删除角色或原生配置。')) return;
            const fresh = companionRead();
            fresh.plans = fresh.plans.filter(p => p.id !== plan.id);
            for (const key of Object.keys(fresh.defaults)) if (fresh.defaults[key] === plan.id) delete fresh.defaults[key];
            if (companionSave(fresh)) render();
          }],
        ];
        for (const [label, handler] of buttons) actions.append(companionTextButton(label, handler));
        card.append(copy, actions);
        body.append(card);
      }
      if (!plans.length) body.append(quickNode('p', 'tle-quick-empty', '当前角色没有配套方案。'));
    };
    render();
  }
  async function companionApply(id, automatic = false) {
    if (state.destroyed || companionRuntime.applying || isNativeGenerationVisible()) {
      if (!automatic) companionNotice('warning', '正在生成或切换中，请稍后再应用方案。');
      return;
    }
    const role = companionCurrentRole();
    const plan = companionRead().plans.find(p => p.id === id && role && p.roles.includes(role.key));
    if (!plan) { if (!automatic) companionNotice('warning', '该方案已失效或不属于当前角色。'); return; }
    companionRuntime.applying = true;
    companionRefreshList();
    let finished = 0;
    try {
      for (const field of COMPANION_FIELDS) {
        const target = plan.fields[field.id];
        if (!target) continue;
        if (state.destroyed || companionCurrentRole()?.key !== role.key) throw new Error('角色已切换，停止应用旧方案。');
        const catalog = await quickCatalog(field.type, field.type === 'api' || field.type === 'preset', state.abort.signal);
        const fresh = catalog.find(item => item.selectId === target.selectId && item.value === target.value && companionEntryId(field, item));
        if (!fresh || fresh.disabled) throw new Error(field.name + ' 不存在或当前不可用：' + (target.label || target.value));
        await applyQuickChoice(field.type, fresh, state.abort.signal);
        finished++;
      }
      companionRuntime.lastApplied.set(role.key, id);
      companionNotice('success', '已应用「' + plan.name + '」；绑定壁纸跟随 UI 主题。');
    } catch (error) {
      companionNotice('warning', '方案只完成 ' + finished + ' 项，已停止：' + (error?.message || error));
      console.warn('[配套侠] 应用中断', error);
    } finally {
      companionRuntime.applying = false;
      companionRefreshList();
    }
  }
  function companionOnChatChanged() {
    HOST_WIN.clearTimeout(companionRuntime.timer);
    companionRuntime.timer = HOST_WIN.setTimeout(() => {
      if (state.destroyed) return;
      const role = companionCurrentRole();
      const key = role?.key || '';
      const changed = key !== companionRuntime.lastRole;
      companionRuntime.lastRole = key;
      if (state.chatTools.open && state.chatTools.page === 'plans') companionRefreshList();
      if (!changed || !key || !companionRead().autoApply) return;
      const data = companionRead();
      const plans = data.plans.filter(p => p.roles.includes(key));
      const selected = plans.find(p => p.id === data.defaults[key]) || (plans.length === 1 ? plans[0] : null);
      if (selected) void companionApply(selected.id, true);
    }, 350);
  }
  function companionBindEvents() {
    const context = HOST_WIN.SillyTavern?.getContext?.();
    const source = context?.eventSource;
    const type = (context?.eventTypes || context?.event_types)?.CHAT_CHANGED;
    companionRuntime.lastRole = companionCurrentRole()?.key || '';
    if (!source || typeof source.on !== 'function' || !type) return;
    const handler = () => companionOnChatChanged();
    source.on(type, handler);
    companionRuntime.source = source;
    companionRuntime.type = type;
    companionRuntime.handler = handler;
  }
  function companionCleanup() {
    HOST_WIN.clearTimeout(companionRuntime.timer);
    if (companionRuntime.source && companionRuntime.handler) {
      const remove = companionRuntime.source.removeListener || companionRuntime.source.off;
      if (typeof remove === 'function') remove.call(companionRuntime.source, companionRuntime.type, companionRuntime.handler);
    }
    companionRuntime.source = null;
    companionRuntime.handler = null;
  }
