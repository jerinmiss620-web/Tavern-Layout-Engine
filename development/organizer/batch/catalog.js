// Adapter identities join the Organizer catalog; no independent UI catalog is stored.
export function describeResource(resource, owner, scope, catalogs = {}) {
    const path = resource.relative || resource.label || resource.id;
    const basename = path.split('/').at(-1);
    let module, key, value, label;
    if (scope === 'persona') {
        module = 'persona'; key = value = owner; label = owner;
    } else if (resource.adapter === 'character') {
        module = 'character'; key = value = resource.avatar || basename; label = value;
    } else if (resource.adapter === 'world') {
        module = 'worldInfo'; value = resource.name || basename.replace(/\.json$/i, '');
        key = JSON.stringify(['world_info', value]); label = value;
    } else if (resource.adapter === 'preset') {
        module = path.startsWith('reasoning/') ? 'reasoning' : 'preset';
        value = basename.replace(/\.json$/i, ''); label = value;
        key = JSON.stringify([module === 'reasoning' ? 'reasoning_select' : 'settings_preset_openai', value]);
    } else { module = resource.adapter === 'chat' ? 'chat' : 'content'; key = value = owner || resource.id; label = path; }
    // Never equate preset names across API providers. The existing preset tab is OpenAI only.
    if (module === 'preset' && !path.startsWith('OpenAI Settings/')) { module = 'content'; key = resource.id; }
    const entry = (catalogs[module] || []).find(entry => entry.key === key);
    return { module, key, value, label, ...entry, contentKey: JSON.stringify([module, key]), resource };
}

export function resolveScope(inventory, scope, currentModule, entries, selected, paths = {}) {
    const supported = inventory.supportedScopes || Object.keys(inventory.scopes);
    const base = { scopes: supported, mode: scope === 'all' ? 'global' : 'local', fileIds: [], ownerIds: [], customPaths: {} };
    if (scope === 'all') {
        for (const r of inventory.resources) {
            if (r.adapter === 'text') base.fileIds.push(r.id);
            if (r.adapter === 'custom-json' && Object.hasOwn(paths, r.relative)) {
                base.fileIds.push(r.id); base.customPaths[r.id] = paths[r.relative];
            }
        }
        return base;
    }
    const chosen = scope === 'selected' ? entries.filter(e => selected.has(e.key)) : entries;
    if (!chosen.length) throw Error(scope === 'selected' ? '请先在名称模式选择资源。' : '当前筛选范围没有资源。');
    const keys = new Set(chosen.map(e => e.key));
    const moduleScopes = { character: ['character', 'greetings', 'world', 'regex'], worldInfo: ['world'], persona: ['persona'], preset: ['presets', 'prompts', 'regex'], reasoning: ['presets'] };
    base.scopes = (moduleScopes[currentModule] || []).filter(s => supported.includes(s));
    if (!base.scopes.length) throw Error('当前平台适配器不支持此分类的内容处理；原资源管理仍可使用。');
    if (currentModule === 'persona') base.ownerIds = inventory.owners.filter(o => o.type === 'persona' && keys.has(o.id)).map(o => o.id);
    else for (const r of inventory.resources) {
        const descriptor = describeResource(r, r.id, '', {});
        if (descriptor.module === currentModule && keys.has(descriptor.key)) base.fileIds.push(r.id);
    }
    if (!base.fileIds.length && !base.ownerIds.length) throw Error('所选资源未匹配当前平台的可处理数据，请刷新名称列表。');
    return base;
}
