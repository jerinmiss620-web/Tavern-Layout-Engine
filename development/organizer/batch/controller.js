import { validateRules, previewSegments } from './batch-engine.js';
import { createBatchClient } from './batch-runtime.js';
import { BatchConfigStore } from './storage.js';
import { describeResource, resolveScope } from './catalog.js';

// Owns content operations only. The host supplies its one search input, list,
// resource-row factory, filters and resource-selection state.
export class OrganizerContent {
    constructor(host) {
        this.h = host; this.mode = 'name'; this.scope = 'all'; this.nameQuery = host.search.value;
        this.rules = [{ find: '', replace: '' }]; this.excluded = new Set(); this.rows = []; this.groups = [];
        this.revision = 0; this.busy = false; this.loaded = false; this.combinations = {};
        this.store = host.store || new BatchConfigStore({ indexedDB: host.window.indexedDB, legacy: () => host.window.localStorage });
        this.node = (tag, cls = '', text = '') => host.node(tag, cls, text);
        this.button = (text, action) => { const button = host.button(text, () => void this.run(action)); button.classList.add('menu_button_icon'); return button; };
        this.mount();
        host.signal?.addEventListener('abort', () => { this.disposed = true; this.revision++; if (this.jobId) void this.api('cancel', { id: this.jobId }).catch(() => {}); }, { once: true });
    }
    get active() { return this.mode === 'content'; }
    context() { return this.h.context(); }
    async api(name, body = {}) {
        this.clientPromise ||= (this.h.createClient ? this.h.createClient() : createBatchClient({ context: () => this.context() }, this.h.window)).catch(error => { this.clientPromise = null; throw error; });
        this.client = await this.clientPromise;
        return this.client.call(name, body);
    }
    message(text) { this.messageText = text; if (this.active && !this.disposed) this.h.status.textContent = text; }
    async run(action) {
        if (this.busy || this.disposed) return;
        try { await action(); } catch (error) { this.message(error.message); }
    }
    mount() {
        const n = this.node;
        this.searchRow = n('div', 'tle-content-search-row flex-container');
        this.target = n('label', 'checkbox_label');
        this.modeToggle = n('input', 'checkbox'); this.modeToggle.type = 'checkbox'; this.modeToggle.checked = this.active;
        this.modeToggle.setAttribute('aria-label', '查找和替换');
        this.modeToggle.addEventListener('change', () => { void this.run(() => this.setMode(this.modeToggle.checked ? 'content' : 'name')); });
        this.target.append(this.modeToggle, n('span', '', '查找和替换'));
        this.replace = n('input', 'text_pole flex1'); this.replace.type = 'text'; this.replace.size = 1; this.replace.placeholder = '留空删除匹配文本'; this.replace.setAttribute('aria-label', '替换为'); this.replace.hidden = true;
        this.replace.addEventListener('input', () => { this.rules[0].replace = this.replace.value; this.invalidate(); void this.persist().catch(() => {}); });
        this.findRow = n('div', 'flex-container flexnowrap alignItemsCenter flexGrow flexBasis200px');
        this.h.searchWrap.classList.add('flex1');
        this.replaceRow = n('div', 'flex-container flexnowrap alignItemsCenter flexGrow flexBasis200px'); this.replaceRow.hidden = true;
        this.controls = n('div', 'tle-content-controls flex-container flexFlowColumn'); this.controls.hidden = true;
        const actions = n('div', 'flex-container flexnowrap alignItemsCenter');
        this.scopeSelect = n('select', 'text_pole flex1'); this.scopeSelect.setAttribute('aria-label', '内容搜索范围');
        for (const [value, label] of [['all', '全部支持资源'], ['filtered', '当前筛选范围'], ['selected', '已选资源']]) { const o = n('option', '', label); o.value = value; this.scopeSelect.append(o); }
        this.scopeSelect.addEventListener('change', () => { this.scope = this.scopeSelect.value; this.invalidate(); });
        this.findButton = this.button('查找', () => this.scan()); this.findButton.hidden = true;
        this.previewButton = this.button('预览替换', () => this.preview()); this.previewButton.disabled = true;
        this.findRow.append(this.h.searchWrap, this.findButton);
        const replaceLabel = n('label', 'flex-container flexnowrap alignItemsCenter flex1'); replaceLabel.append(n('span', '', '替换为'), this.replace);
        this.replaceRow.append(replaceLabel, this.previewButton);
        if (this.h.heading) this.h.heading.append(this.target);
        else this.searchRow.append(this.target);
        this.searchRow.append(this.findRow, this.replaceRow);
        this.cancelButton = this.h.button('取消扫描', () => { this.cancelled = true; if (this.jobId) void this.api('cancel', { id: this.jobId }).catch(e => this.message(e.message)); }); this.cancelButton.hidden = true;
        actions.append(this.scopeSelect, this.cancelButton,
            this.button('备份与恢复', () => this.backups()));
        this.ruleDetails = n('details', 'tle-content-rule-details');
        this.ruleDetails.append(n('summary', '', '规则组合与高级选项'));
        this.addRuleButton = this.button('添加规则', () => { if (this.rules.length >= 200) throw Error('最多 200 条规则。'); this.rules.push({ find: '', replace: '' }); this.invalidate(); this.renderRules(); });
        this.ruleRows = n('div', 'tle-content-rule-list');
        this.comboCreateRow = n('div', 'tle-content-rule-toolbar flex-container flexWrap alignItemsCenter');
        this.comboName = n('input', 'text_pole flex1'); this.comboName.placeholder = '规则组合名称'; this.comboName.setAttribute('aria-label', '规则组合名称');
        this.saveComboButton = this.button('保存组合', async () => {
            validateRules(this.rules, { searchOnly: true }); const name = this.comboName.value.trim();
            if (!name || ['__proto__', 'prototype', 'constructor'].includes(name)) throw Error('请输入有效的规则组合名称。');
            this.combinations[name] = structuredClone(this.rules); await this.persist(); this.renderCombinations(); this.message('规则组合已保存。');
        });
        this.comboCreateRow.append(this.addRuleButton, this.comboName, this.saveComboButton);
        this.comboManageRow = n('div', 'tle-content-rule-toolbar flex-container flexWrap alignItemsCenter');
        this.comboSelect = n('select', 'text_pole flex1'); this.comboSelect.setAttribute('aria-label', '规则组合');
        this.loadComboButton = this.button('载入组合', async () => {
            const rules = this.combinations[this.comboSelect.value]; if (!rules) throw Error('请选择组合。');
            validateRules(rules, { searchOnly: true }); this.rules = structuredClone(rules); this.syncInputs(); this.invalidate(); await this.persist();
        });
        this.deleteComboButton = this.button('删除组合', async () => { delete this.combinations[this.comboSelect.value]; await this.persist(); this.renderCombinations(); });
        this.comboManageRow.append(this.comboSelect, this.loadComboButton, this.deleteComboButton);
        this.paths = n('textarea', 'text_pole tle-content-rule-paths'); this.paths.rows = 2;
        this.paths.placeholder = '{"user/files/文件.json":[["content"]]}'; this.paths.setAttribute('aria-label', '指定 JSON/YAML 文件允许修改的字段路径');
        this.paths.addEventListener('input', () => { this.invalidate(); void this.persist().catch(() => {}); });
        this.ruleHelp = n('small', 'tle-content-rule-help', 'JSON/YAML 仅扫描明确指定路径；未知字段不会递归修改。普通文本规则区分大小写，重叠优先长匹配，同长度按规则顺序。');
        this.ruleDetails.append(this.comboCreateRow, this.ruleRows, this.comboManageRow, this.ruleHelp, this.paths);
        this.selectionTools = n('div', 'flex-container flexWrap');
        this.selectionTools.append(this.button('全选当前结果', () => this.selectAll(true)), this.button('取消全选', () => this.selectAll(false)));
        this.confirm = n('div', 'tle-quick-transfer-confirm'); this.confirm.hidden = true;
        this.confirmText = n('p'); this.applyButton = this.button('确认替换', () => this.apply());
        const confirmActions = n('div', 'flex-container');
        confirmActions.append(this.applyButton, this.button('返回选择', () => { this.previewed = false; this.confirm.hidden = true; this.renderList(); }));
        this.confirm.append(this.confirmText, confirmActions);
        this.capabilities = n('div');
        this.binding = n('div'); this.binding.hidden = true;
        this.ruleDetails.append(this.capabilities);
        this.controls.append(actions, this.ruleDetails, this.binding, this.selectionTools, this.confirm);
        this.renderCombinations(); this.syncScope();
    }
    async setMode(mode) {
        if (this.busy) return;
        if (this.active) this.rules[0].find = this.h.search.value; else this.nameQuery = this.h.search.value;
        this.mode = mode === 'content' ? 'content' : 'name';
        this.modeToggle.checked = this.active;
        this.controls.hidden = this.replace.hidden = this.replaceRow.hidden = this.findButton.hidden = !this.active;
        this.h.setContentMode(this.active);
        this.h.search.value = this.active ? this.rules[0].find : this.nameQuery;
        this.h.search.placeholder = this.active ? '查找内容（普通文本）…' : this.h.namePlaceholder;
        this.h.search.setAttribute('aria-label', this.active ? '查找内容' : this.h.namePlaceholder);
        this.h.render();
        if (this.active && !this.loaded) {
            this.lock(true);
            try { await this.loadConfig(); if (this.active) { this.syncInputs(); this.h.render(); } }
            finally { this.lock(false); }
        }
    }
    onInput() { if (!this.active) { this.nameQuery = this.h.search.value; return; } this.rules[0].find = this.h.search.value; this.invalidate(); void this.persist().catch(() => {}); }
    async loadConfig() {
        const account = this.context().accountStorage;
        if (!account) throw Error('酒馆账号接口未就绪，无法读取规则组合。');
        let namespace = account.getItem('global-batch-replace-browser-key');
        if (!namespace) { namespace = this.h.window.crypto.randomUUID(); account.setItem('global-batch-replace-browser-key', namespace); }
        this.key = `gbr:${namespace}:batch-config`;
        const saved = await this.store.get(this.key) || {};
        if (saved.rules?.length) {
            if (saved.rules.some(r => r.find)) validateRules(saved.rules.filter(r => r.find), { searchOnly: true });
            this.rules = saved.rules;
        }
        this.combinations = saved.combinations || {}; this.savedConfig = saved;
        this.paths.value = saved.organizerPaths || ''; this.loaded = true; this.renderCombinations();
    }
    async persist() {
        if (!this.loaded) return;
        try {
            // Preserve independent extension preferences and existing combinations.
            const saved = await this.store.get(this.key) || this.savedConfig || {};
            await this.store.set(this.key, { ...saved, rules: this.rules, combinations: this.combinations, organizerPaths: this.paths.value });
        } catch (error) { this.message('规则保存失败：' + error.message); throw error; }
    }
    renderCombinations() {
        this.comboSelect.replaceChildren();
        for (const name of ['', ...Object.keys(this.combinations)]) { const o = this.node('option', '', name || '选择规则组合'); o.value = name; this.comboSelect.append(o); }
    }
    syncInputs() { this.h.search.value = this.rules[0].find; this.replace.value = this.rules[0].replace; this.renderRules(); }
    renderRules() {
        this.ruleRows.replaceChildren();
        this.rules.slice(1).forEach((rule, i) => {
            const row = this.node('div', 'tle-content-rule flex-container flexWrap alignItemsCenter');
            const find = this.node('input', 'text_pole flex1'), replace = this.node('input', 'text_pole flex1');
            find.type = replace.type = 'text'; find.value = rule.find; replace.value = rule.replace;
            find.setAttribute('aria-label', `规则 ${i + 2} 查找内容`); replace.setAttribute('aria-label', `规则 ${i + 2} 替换内容`);
            find.addEventListener('input', () => { rule.find = find.value; this.invalidate(); void this.persist().catch(() => {}); });
            replace.addEventListener('input', () => { rule.replace = replace.value; this.invalidate(); void this.persist().catch(() => {}); });
            row.append(find, replace, this.button('删除规则', async () => { this.rules.splice(i + 1, 1); this.invalidate(); this.renderRules(); await this.persist(); })); this.ruleRows.append(row);
        });
    }
    syncScope() {
        const selected = this.h.scopeState().selected;
        this.scopeSelect.querySelector('[value="selected"]').disabled = !selected.size;
        if (this.scope === 'selected' && !selected.size) { this.scope = 'all'; this.scopeSelect.value = 'all'; this.invalidate(); }
    }
    contextChanged() { this.syncScope(); if (this.scope !== 'all') this.invalidate(); }
    invalidate() {
        this.revision++; this.previewed = false; this.confirm.hidden = true; this.previewButton.disabled = true;
        this.snapshot = null; this.rows = []; this.groups = []; this.excluded.clear(); this.backupView = null;
        if (this.active) { this.message('输入或范围已变化，请重新查找。'); this.h.render(); }
    }
    lock(value) {
        this.busy = value; this.h.lock(value);
        for (const el of [...this.target.querySelectorAll('input'), ...this.searchRow.querySelectorAll('input,select,button'), ...this.controls.querySelectorAll('input,select,textarea,button')]) {
            if (value) { el.dataset.contentDisabled = String(el.disabled); el.disabled = true; }
            else { el.disabled = el.dataset.contentDisabled === 'true'; delete el.dataset.contentDisabled; }
        }
        this.cancelButton.hidden = !value || this.writing || !this.loaded; this.cancelButton.disabled = false;
        if (!value) { this.previewButton.disabled = !this.snapshot || !this.rows.some(r => !this.excluded.has(r.id)); this.syncScope(); }
    }
    async inventory() {
        const inventory = await this.api('inventory'); this.inventoryData = inventory;
        this.capabilities.textContent = this.client.host === 'tt'
            ? 'TT 原生适配：身份、聊天、角色设定、开场白、世界书。预设、提示词、正则和指定文件暂不支持。'
            : 'PC 服务端适配 · 修改前备份，提交前后校验。请先保存原编辑器，执行期间暂停其他窗口编辑。';
        this.binding.replaceChildren(); this.binding.hidden = !inventory.datasetBinding;
        if (inventory.datasetBinding) {
            const b = inventory.datasetBinding;
            this.binding.append(this.node('p', '', `资料集待登记：当前 ${b.currentRoot}；原目录 ${b.previousRoot}。旧备份将保留并隔离恢复。`),
                this.button('确认登记当前资料集', async () => { await this.api('register-dataset', { confirm: true, previousId: b.previousId, root: b.currentRoot }); this.invalidate(); await this.inventory(); this.message('资料集已登记，请重新查找。'); }));
            throw Error('请先核对目录并确认登记当前资料集。');
        }
        return inventory;
    }
    async collect(searchOnly, options, rules) {
        const { id } = await this.api('scan', { ...options, rules, searchOnly }); this.jobId = id;
        if (this.cancelled) await this.api('cancel', { id });
        let snapshot;
        do {
            snapshot = await this.api('status', { id });
            this.message(`已扫描 ${snapshot.scanned}/${snapshot.total} 份数据，${snapshot.matches} 处匹配。`);
            if (snapshot.status === 'scanning') await new Promise(resolve => this.h.window.setTimeout(resolve, 100));
        } while (snapshot.status === 'scanning' && !this.disposed);
        if (this.disposed || snapshot.status !== 'ready') throw Error(snapshot.error || '扫描已取消，未修改资料。');
        // Upstream v1.1.0 keeps file hashes inside the server job, not in status.
        // Missing optional hashes must never prevent a read-only search.
        const rows = [];
        for (const file of snapshot.files) {
            for (let offset = 0; offset < file.count;) {
                if (this.cancelled || this.disposed) throw Error('已取消，未修改资料。');
                const page = await this.api('preview', { id, fileId: file.id, offset });
                if (!page.rows.length) throw Error('匹配分页不完整，请重新查找。');
                rows.push(...page.rows.map(row => ({ ...row, fileId: file.id }))); offset += page.rows.length;
            }
        }
        return { snapshot, rows, id };
    }
    async scan() {
        if (!this.active) return;
        const { rules } = validateRules(this.rules, { searchOnly: true });
        this.invalidate(); this.cancelled = false; this.lock(true);
        try {
            const inventory = await this.inventory(); const current = this.h.scopeState();
            const paths = JSON.parse(this.paths.value || '{}');
            this.options = resolveScope(inventory, this.scope, current.module, this.scope === 'selected' ? current.entries : current.filtered, current.selected, paths);
            const result = await this.collect(true, this.options, rules);
            this.snapshot = result.snapshot; this.rows = result.rows; this.jobId = result.id; this.scanRules = structuredClone(rules);
            this.groupResults(); await this.persist(); this.message(this.summary()); this.h.render();
        } finally { this.lock(false); }
    }
    groupResults() {
        const resources = new Map(this.inventoryData.resources.map(r => [r.id, r])); const groups = new Map();
        const current = this.h.scopeState(), catalogs = { [current.module]: current.entries };
        for (const row of this.rows) {
            const resource = resources.get(row.fileId); if (!resource) throw Error('扫描资源描述缺失，请刷新。');
            const d = describeResource(resource, row.owner, row.scope, catalogs);
            if (d.module === 'persona' && !(catalogs.persona || []).some(e => e.key === d.key)) d.label = this.inventoryData.owners.find(o => o.type === 'persona' && o.id === row.owner)?.label || row.label;
            if (!groups.has(d.contentKey)) groups.set(d.contentKey, { ...d, rows: [] });
            groups.get(d.contentKey).rows.push(row);
        }
        this.groups = [...groups.values()];
    }
    summary() {
        const selected = this.rows.filter(r => !this.excluded.has(r.id));
        const count = this.groups.filter(g => g.rows.some(r => !this.excluded.has(r.id))).length;
        return `${this.groups.length} 个资源 · ${this.rows.length} 处匹配 · 已选 ${count} 个资源、${selected.length} 处 · 排除 ${this.rows.length - selected.length} 处`;
    }
    selectAll(selected) { this.excluded = new Set(selected ? [] : this.rows.map(r => r.id)); this.selectionChanged(); }
    selectRows(rows, selected) { rows.forEach(r => selected ? this.excluded.delete(r.id) : this.excluded.add(r.id)); this.selectionChanged(); }
    resultSections() {
        const titles = { character: '角色卡', chats: '聊天记录', world: '世界书', persona: '用户身份', presets: '预设', prompts: '提示词', regex: '正则', other: '其他文件' };
        const sections = new Map(Object.entries(titles).map(([key, title]) => [key, { key, title, groups: [], rows: [] }]));
        for (const group of this.groups) {
            const parts = new Map();
            for (const row of group.rows) {
                const type = row.scope === 'greetings' ? 'character' : Object.hasOwn(titles, row.scope) ? row.scope : 'other';
                if (!parts.has(type)) parts.set(type, []);
                parts.get(type).push(row);
            }
            for (const [type, rows] of parts) { const section = sections.get(type); section.groups.push({ ...group, rows }); section.rows.push(...rows); }
        }
        return [...sections.values()].filter(section => section.rows.length);
    }
    selectionChanged() { this.previewed = false; this.confirm.hidden = true; this.message(this.summary()); this.previewButton.disabled = !this.rows.some(r => !this.excluded.has(r.id)); this.renderList(); }
    async preview() {
        if (!this.snapshot || !this.rows.some(r => !this.excluded.has(r.id))) throw Error('请先查找并选择匹配项。');
        const original = this.snapshot; this.cancelled = false; this.lock(true);
        try {
            // A separate writable job is created only by the explicit preview action.
            const next = await this.collect(false, this.options, this.scanRules);
            const previous = new Map(original.files.map(f => [f.id, f.beforeHash]));
            if (next.snapshot.files.some(f => !previous.has(f.id) || (previous.get(f.id) && f.beforeHash && previous.get(f.id) !== f.beforeHash))) {
                this.invalidate(); throw Error('资料在查找后发生变化，请重新查找和选择；未写入资料。');
            }
            const nextIds = new Set(next.rows.map(r => r.id));
            const foundIds = new Set(this.rows.map(r => r.id));
            if (next.rows.some(r => !foundIds.has(r.id))) { this.invalidate(); throw Error('预览出现新的匹配，请移除前后相同的重叠规则后重新查找和选择。'); }
            const expected = this.rows.filter(r => this.scanRules[r.rule].find !== this.scanRules[r.rule].replace);
            if (expected.some(r => !nextIds.has(r.id))) { this.invalidate(); throw Error('匹配在查找后发生变化，请重新查找。'); }
            // Compare the upstream preview contract as well as IDs: its IDs encode
            // location, not the surrounding text. The writable job still performs
            // upstream's full-file hash checks before backup, commit and reread.
            const oldRows = new Map(this.rows.map(r => [r.id, r]));
            if (next.rows.some(r => {
                const old = oldRows.get(r.id);
                return old.fileId !== r.fileId || old.field !== r.field || old.start !== r.start || old.context.text !== r.context.text || old.context.leading !== r.context.leading || old.context.trailing !== r.context.trailing;
            })) { this.invalidate(); throw Error('匹配内容在查找后发生变化，请重新查找；未写入资料。'); }
            this.snapshot = next.snapshot; this.rows = next.rows; this.jobId = next.id;
            this.excluded = new Set([...this.excluded].filter(id => nextIds.has(id))); this.groupResults();
            const chosen = this.rows.filter(r => !this.excluded.has(r.id)); if (!chosen.length) throw Error('所选匹配没有实际变化。');
            this.previewed = true; this.previewRevision = this.revision;
            const deletion = chosen.every(r => this.scanRules[r.rule].replace === '');
            const resourceCount = this.groups.filter(g => g.rows.some(r => !this.excluded.has(r.id))).length;
            this.confirmText.textContent = deletion ? `即将删除 ${chosen.length} 处匹配文本，涉及 ${resourceCount} 个资源。` : `即将替换 ${chosen.length} 处匹配文本，涉及 ${resourceCount} 个资源。`;
            this.confirmText.textContent += ` 已排除 ${this.rows.length - chosen.length} 处。确认后先备份并校验，结束后重新载入酒馆以刷新原生缓存。`;
            this.applyButton.textContent = deletion ? '确认删除匹配文本' : '确认替换'; this.confirm.hidden = false;
            this.message(this.summary()); this.renderList();
        } finally { this.lock(false); }
    }
    async apply() {
        if (!this.previewed || this.previewRevision !== this.revision || this.confirm.hidden) throw Error('必须先预览当前选择，再确认执行。');
        if (this.context().isGenerating || this.context().streamingProcessor) throw Error('请先等待回复生成结束。');
        this.writing = true; this.lock(true);
        try {
            const result = await this.api('apply', { id: this.jobId, excludedMatches: [...this.excluded], excludedFiles: [] });
            await this.afterWrite(`成功 ${result.matches} 处，${result.files} 份数据；失败 0。备份编号：${result.id}。`);
        } catch (error) {
            const count = this.groups.filter(g => g.rows.some(r => !this.excluded.has(r.id))).length;
            await this.afterWrite(`已确认成功 0 个资源，失败或中止 ${count} 个资源：${error.message}。恢复状态及需人工检查项见备份逐项记录。`);
        } finally { this.writing = false; /* Reload is required before any other operation. */ }
    }
    async afterWrite(message) {
        this.previewed = false; this.confirm.hidden = true; this.snapshot = null;
        this.h.saveResume(message); this.message(message + ' 正在刷新酒馆与整理侠资源。');
        try { await this.persist(); } finally { this.h.reload(); }
    }
    renderList() {
        if (!this.active || this.disposed) return;
        this.selectionTools.hidden = !this.snapshot || !!this.backupView;
        if (this.backupView) { this.h.list.replaceChildren(this.backupView); return; }
        const list = this.h.list, scroll = list.scrollTop;
        const open = new Set([...list.querySelectorAll('[data-content-key][open]')].map(d => d.dataset.contentKey));
        const closedSections = new Set([...list.querySelectorAll('[data-content-section]:not([open])')].map(d => d.dataset.contentSection));
        list.replaceChildren();
        for (const section of this.resultSections()) {
            const sectionNode = this.node('details'); sectionNode.dataset.contentSection = section.key; sectionNode.open = !closedSections.has(section.key);
            const sectionSummary = this.node('summary');
            const sectionCheck = this.node('input'); sectionCheck.type = 'checkbox';
            const sectionSelected = section.rows.filter(r => !this.excluded.has(r.id)).length;
            sectionCheck.checked = sectionSelected === section.rows.length; sectionCheck.indeterminate = sectionSelected > 0 && sectionSelected < section.rows.length;
            sectionCheck.setAttribute('aria-label', `选择${section.title}全部匹配`);
            sectionCheck.addEventListener('click', e => e.stopPropagation());
            sectionCheck.addEventListener('change', () => this.selectRows(section.rows, sectionCheck.checked));
            const sectionLabel = this.node('span', 'inline-flex alignItemsCenter');
            sectionLabel.append(sectionCheck, this.node('strong', '', ` ${section.title} · ${section.groups.length} 个资源 · 已选 ${sectionSelected}/${section.rows.length} 处`));
            sectionSummary.append(sectionLabel);
            const sectionTools = this.node('div', 'flex-container');
            sectionTools.append(this.button('全选本组', () => this.selectRows(section.rows, true)), this.button('取消本组', () => this.selectRows(section.rows, false)));
            sectionNode.append(sectionSummary, sectionTools); list.append(sectionNode);
        for (const group of section.groups) {
            const contentKey = JSON.stringify([section.key, group.contentKey]);
            const details = this.node('details'); details.dataset.contentKey = contentKey; details.open = this.previewed || open.has(contentKey);
            const chosen = group.rows.filter(r => !this.excluded.has(r.id));
            const summary = this.h.resourceRow(group, { checked: chosen.length === group.rows.length, indeterminate: chosen.length > 0 && chosen.length < group.rows.length,
                detail: `${group.rows.length} 处匹配 · ${[...new Set(group.rows.map(r => r.field))].join('、')}`,
                onSelect: checked => { group.rows.forEach(r => checked ? this.excluded.delete(r.id) : this.excluded.add(r.id)); this.selectionChanged(); } });
            details.append(summary);
            const matches = this.node('div', 'tle-content-matches'); details.append(matches);
            let shown = 0;
            const append = () => {
                matches.querySelector('[data-more]')?.remove();
                for (const row of group.rows.slice(shown, shown + 100)) {
                    const item = this.node('div', 'tle-content-match'); const label = this.node('label', 'checkbox_label');
                    const check = this.node('input', 'tle-quick-item-check'); check.type = 'checkbox'; check.checked = !this.excluded.has(row.id); check.disabled = this.busy;
                    check.addEventListener('change', () => { check.checked ? this.excluded.delete(row.id) : this.excluded.add(row.id); this.selectionChanged(); });
                    label.append(check, this.node('span', '', `${row.label} · ${row.field} · 位置 ${row.start + 1} · 规则 ${row.rule + 1}`)); item.append(label);
                    const p = previewSegments(row.context, row.id, this.scanRules, this.excluded);
                    item.append(this.node('div', 'tle-content-text', '原文：' + p.prefix + p.before + p.suffix));
                    if (this.previewed) item.append(this.node('div', 'tle-content-text', '改后：' + p.afterPrefix + p.after + p.afterSuffix));
                    matches.append(item);
                }
                shown += 100;
                if (shown < group.rows.length) { const more = this.button('加载后续匹配', append); more.dataset.more = ''; matches.append(more); }
            };
            details.addEventListener('toggle', () => { if (details.open && !shown) append(); });
            if (details.open) append();
            sectionNode.append(details);
        }
        }
        if (!this.groups.length) list.append(this.node('p', 'tle-quick-empty', this.snapshot ? '没有命中。' : '输入查找内容后点击「查找」。'));
        if (this.snapshot?.skipped?.length) {
            const skipped = this.node('details'); skipped.append(this.node('summary', '', `跳过 ${this.snapshot.skipped.length} 项（查看原因）`));
            for (const s of this.snapshot.skipped) skipped.append(this.node('p', '', `${s.path}：${s.error}`)); list.append(skipped);
        }
        for (const warning of this.snapshot?.warnings || []) list.append(this.node('small', '', warning));
        list.scrollTop = scroll; this.message(this.messageText || '请查找内容。');
    }
    async backups() {
        await this.inventory(); this.previewed = false; this.confirm.hidden = true;
        const backups = await this.api('backups'), area = this.node('div'); this.backupView = area;
        area.append(this.button('返回内容结果', () => { this.backupView = null; this.renderList(); }));
        const input = this.node('input'); input.type = 'file'; input.accept = '.zip,application/zip'; input.hidden = true;
        input.addEventListener('change', () => void this.run(async () => {
            const file = input.files?.[0]; if (!file) return;
            this.lock(true);
            try { const result = await this.client.importBackup(file); this.message(`备份 ${result.id} 已校验并导入，未恢复资料。`); await this.backups(); }
            finally { input.value = ''; this.lock(false); }
        }));
        const extended = this.client.host === 'tt' || this.inventoryData.capabilities?.selectedRestore === true;
        if (this.client.host === 'tt' || this.inventoryData.capabilities?.zipImport === true) area.append(input, this.button('导入备份 ZIP', () => input.click()));
        else area.append(this.node('small', '', '原版服务端支持查找、替换、备份导出与整份恢复；ZIP 导入及按文件恢复需配套插件。'));
        const states = { complete: '已完成', restored: '已恢复', aborted: '执行中止', 'partially-restored': '部分恢复', conflict: '冲突', committed: '已修改', unchanged: '未改变', pending: '待提交', 'needs-attention': '需检查', foreign: '其他资料集，仅下载', unreadable: '清单无法读取' };
        for (const backup of backups) {
            const details = this.node('details'); details.append(this.node('summary', '', `${backup.created || backup.id} · ${states[backup.status] || backup.status}`));
            const chosen = new Set((backup.files || []).map(f => f.path));
            const confirmation = this.node('div'); confirmation.hidden = true;
            for (const f of backup.files || []) {
                const label = this.node('label', 'checkbox_label'), check = this.node('input'); check.type = 'checkbox'; check.checked = true;
                check.disabled = !extended;
                check.addEventListener('change', () => { check.checked ? chosen.add(f.path) : chosen.delete(f.path); confirmation.hidden = true; });
                label.append(check, this.node('span', '', `${f.path} · ${states[f.state] || f.state}${f.error ? ' · ' + f.error : ''}`)); details.append(label);
            }
            if (backup.error) details.append(this.node('p', '', backup.error));
            if (backup.status !== 'unreadable') details.append(this.button('导出完整 ZIP', async () => {
                const blob = await this.client.download(backup.id); await this.h.download(blob, `global-batch-replace-backup-${backup.id}.zip`, this.client.host);
                this.message('备份 ZIP 已导出。');
            }));
            if (!['unreadable', 'foreign'].includes(backup.status)) {
                const restore = async preserveConflicts => {
                    if (!chosen.size) throw Error('请选择要恢复的资源。');
                    if (this.context().isGenerating || this.context().streamingProcessor) throw Error('请等待回复生成结束。');
                    this.writing = true; this.lock(true);
                    try {
                        const result = await this.api('restore', { id: backup.id, ...(extended ? { paths: [...chosen] } : {}), preserveConflicts });
                        if (result.needsConfirmation) {
                            confirmation.replaceChildren(this.node('p', '', `以下项目存在冲突：${result.conflicts.join('、')}。尚未恢复。`), this.button('保留冲突，仅恢复其余所选资源', () => restore(true)));
                        } else await this.afterWrite(`已恢复 ${result.restored} 份数据，保留 ${result.conflicts.length} 个冲突。`);
                    } catch (e) { await this.afterWrite('恢复未完成：' + e.message); }
                    finally { this.writing = false; if (this.snapshot || !this.h.reloading()) this.lock(false); }
                };
                details.append(this.button(extended ? '恢复所选资源…' : '恢复整份备份…', () => {
                    if (!chosen.size) throw Error('请选择要恢复的资源。');
                    confirmation.replaceChildren(this.node('p', '', `确认检查并恢复所选 ${chosen.size} 份数据？`), this.button('确认检查并恢复', () => restore(false))); confirmation.hidden = false;
                }), confirmation);
            }
            area.append(details);
        }
        if (!backups.length) area.append(this.node('p', '', '尚无内容处理备份。'));
        this.renderList();
    }
}
