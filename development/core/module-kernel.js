export function createModuleKernel(options = {}) {
  const KERNEL_VERSION = '1.0.0';
  const API_VERSION = 1;
  const coreVersion = String(options.coreVersion || '0.0.0');
  const AbortControllerCtor = options.AbortController || (typeof AbortController === 'function' ? AbortController : null);
  const storage = options.storage || null;
  const onError = typeof options.onError === 'function' ? options.onError : () => {};
  const modules = new Map();
  const listeners = new Map();
  const memoryStorage = new Map();
  let destroyed = false;
  let listenerSequence = 0;
  let operationQueue = Promise.resolve();

  const idPattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
  const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
  const permissionPattern = /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*){0,2}$/;
  const settingKeyPattern = /^[A-Za-z0-9._-]{1,128}$/;
  const eventPattern = /^[a-z][a-z0-9:._-]{0,127}$/;

  function makeError(message, cause) {
    const error = new Error('[TLE Module Kernel] ' + message);
    if (cause !== undefined) error.cause = cause;
    return error;
  }

  function report(error, details = {}) {
    try { onError(error instanceof Error ? error : new Error(String(error)), details); } catch {}
  }

  function errorText(error) {
    return String(error && (error.message || error) || 'Unknown error').slice(0, 1200);
  }

  function assertAlive() {
    if (destroyed) throw makeError('Kernel 已销毁，不能再执行此操作。');
  }

  function normalizeDefinition(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw makeError('模块定义必须是对象。');
    const id = String(input.id || '').trim();
    const name = String(input.name || id).trim();
    const version = String(input.version || '').trim();
    const apiVersion = input.apiVersion === undefined ? API_VERSION : Number(input.apiVersion);
    const parentId = input.parentId == null || input.parentId === '' ? null : String(input.parentId).trim();
    if (input.dependencies !== undefined && !Array.isArray(input.dependencies)) throw makeError('模块 ' + id + ' 的 dependencies 必须是数组。');
    if (input.permissions !== undefined && !Array.isArray(input.permissions)) throw makeError('模块 ' + id + ' 的 permissions 必须是数组。');
    const dependencies = Array.isArray(input.dependencies) ? input.dependencies.map(value => String(value).trim()) : [];
    const permissions = Array.isArray(input.permissions) ? input.permissions.map(value => String(value).trim()) : [];
    const settingsSchemaVersion = input.settingsSchemaVersion === undefined ? 1 : Number(input.settingsSchemaVersion);

    if (!idPattern.test(id)) throw makeError('无效模块 ID：' + id);
    if (!name || name.length > 100) throw makeError('模块名称必须为 1–100 个字符：' + id);
    if (!versionPattern.test(version)) throw makeError('模块 ' + id + ' 的版本号不是有效 SemVer：' + version);
    if (!Number.isInteger(apiVersion) || apiVersion < 1 || apiVersion > API_VERSION) {
      throw makeError('模块 ' + id + ' 使用不受支持的 Core API 版本：' + apiVersion);
    }
    if (parentId && (!idPattern.test(parentId) || parentId === id)) throw makeError('模块 ' + id + ' 的 parentId 无效。');
    if (dependencies.some(value => !idPattern.test(value) || value === id)) throw makeError('模块 ' + id + ' 的 dependencies 包含无效 ID。');
    if (new Set(dependencies).size !== dependencies.length) throw makeError('模块 ' + id + ' 的 dependencies 不得重复。');
    if (permissions.some(value => !permissionPattern.test(value))) throw makeError('模块 ' + id + ' 声明了无效权限。');
    if (new Set(permissions).size !== permissions.length) throw makeError('模块 ' + id + ' 的 permissions 不得重复。');
    if (!Number.isInteger(settingsSchemaVersion) || settingsSchemaVersion < 1) {
      throw makeError('模块 ' + id + ' 的 settingsSchemaVersion 必须是正整数。');
    }
    if (typeof input.init !== 'function') throw makeError('模块 ' + id + ' 缺少 init(context) 函数。');
    if (input.destroy !== undefined && typeof input.destroy !== 'function') throw makeError('模块 ' + id + ' 的 destroy 必须是函数。');

    return {
      id,
      name,
      version,
      apiVersion,
      parentId,
      dependencies,
      permissions,
      settingsSchemaVersion,
      enabledByDefault: input.enabledByDefault === true,
      init: input.init,
      destroy: typeof input.destroy === 'function' ? input.destroy : null,
    };
  }

  function assertReferences(definition, replacingId = null) {
    if (definition.parentId && definition.parentId !== replacingId && !modules.has(definition.parentId)) {
      throw makeError('模块 ' + definition.id + ' 的父模块尚未注册：' + definition.parentId);
    }
    for (const dependency of definition.dependencies) {
      if (dependency === replacingId) throw makeError('模块 ' + definition.id + ' 不得依赖自身。');
      if (!modules.has(dependency)) throw makeError('模块 ' + definition.id + ' 的依赖尚未注册：' + dependency);
    }
  }

  function createRecord(definition) {
    return {
      definition,
      status: 'registered',
      error: null,
      startedAt: null,
      controller: null,
      instance: null,
      publicApi: null,
      cleanup: null,
      subscriptions: new Set(),
      stopRequested: false,
      initCleanupDone: false,
      context: null,
    };
  }

  function requireRecord(id) {
    const record = modules.get(String(id));
    if (!record) throw makeError('未注册模块：' + id);
    return record;
  }

  function snapshot(record) {
    const definition = record.definition;
    return Object.freeze({
      id: definition.id,
      name: definition.name,
      version: definition.version,
      apiVersion: definition.apiVersion,
      parentId: definition.parentId,
      dependencies: Object.freeze([...definition.dependencies]),
      permissions: Object.freeze([...definition.permissions]),
      settingsSchemaVersion: definition.settingsSchemaVersion,
      enabledByDefault: definition.enabledByDefault,
      status: record.status,
      error: record.error,
      startedAt: record.startedAt,
    });
  }

  function emitEvent(name, payload, sourceModuleId = null) {
    const set = listeners.get(name);
    if (!set || !set.size) return 0;
    let delivered = 0;
    for (const listener of [...set]) {
      if (!listener.active) continue;
      try {
        listener.handler(payload, Object.freeze({ event: name, sourceModuleId }));
        delivered++;
      } catch (error) {
        report(error, { type: 'event-listener', event: name, id: listener.ownerId || 'core' });
      }
    }
    return delivered;
  }

  function subscribe(ownerRecord, name, handler) {
    assertAlive();
    if (!eventPattern.test(name)) throw makeError('无效事件名称：' + name);
    if (typeof handler !== 'function') throw makeError('事件处理器必须是函数。');
    if (ownerRecord) {
      requirePermission(ownerRecord, 'events:subscribe');
      if (ownerRecord.status !== 'starting' && ownerRecord.status !== 'active') {
        throw makeError('模块 ' + ownerRecord.definition.id + ' 当前不能订阅事件。');
      }
    }
    const listener = {
      id: ++listenerSequence,
      ownerId: ownerRecord ? ownerRecord.definition.id : null,
      handler,
      active: true,
    };
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(listener);
    const unsubscribe = () => {
      if (!listener.active) return false;
      listener.active = false;
      listeners.get(name)?.delete(listener);
      if (!listeners.get(name)?.size) listeners.delete(name);
      ownerRecord?.subscriptions.delete(unsubscribe);
      return true;
    };
    ownerRecord?.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  function requirePermission(record, permission) {
    if (!record.definition.permissions.includes(permission)) {
      throw makeError('模块 ' + record.definition.id + ' 未声明所需权限：' + permission);
    }
  }

  function createSettings(record) {
    const prefix = 'tle.module.' + record.definition.id + '.settings.v' + record.definition.settingsSchemaVersion + '.';
    function fullKey(key) {
      const normalized = String(key || '');
      if (!settingKeyPattern.test(normalized)) throw makeError('无效模块设置键：' + normalized);
      return prefix + normalized;
    }
    function read(key) {
      const storageKey = fullKey(key);
      try {
        if (storage && typeof storage.getItem === 'function') {
          const stored = storage.getItem(storageKey);
          if (stored !== null && stored !== undefined) return stored;
        }
      } catch (error) {
        report(error, { type: 'settings-read', id: record.definition.id });
      }
      return memoryStorage.has(storageKey) ? memoryStorage.get(storageKey) : null;
    }
    function write(key, value) {
      const storageKey = fullKey(key);
      try {
        if (storage && typeof storage.setItem === 'function') {
          storage.setItem(storageKey, value);
          return true;
        }
      } catch (error) {
        report(error, { type: 'settings-write', id: record.definition.id });
      }
      memoryStorage.set(storageKey, value);
      return true;
    }
    return Object.freeze({
      get(key, fallback = null) {
        requirePermission(record, 'settings:read');
        const raw = read(key);
        if (raw === null) return fallback;
        try { return JSON.parse(raw); }
        catch (error) {
          report(error, { type: 'settings-parse', id: record.definition.id, key: String(key) });
          return fallback;
        }
      },
      set(key, value) {
        requirePermission(record, 'settings:write');
        let serialized;
        try { serialized = JSON.stringify(value); }
        catch (error) { throw makeError('模块设置无法序列化：' + key, error); }
        if (serialized === undefined) throw makeError('模块设置不能保存 undefined：' + key);
        return write(key, serialized);
      },
      remove(key) {
        requirePermission(record, 'settings:write');
        const storageKey = fullKey(key);
        try {
          if (storage && typeof storage.removeItem === 'function') storage.removeItem(storageKey);
        } catch (error) {
          report(error, { type: 'settings-remove', id: record.definition.id });
        }
        memoryStorage.delete(storageKey);
        return true;
      },
      clear() {
        requirePermission(record, 'settings:write');
        const keys = [];
        try {
          if (storage && typeof storage.length === 'number' && typeof storage.key === 'function') {
            for (let index = 0; index < storage.length; index++) {
              const key = storage.key(index);
              if (key && key.startsWith(prefix)) keys.push(key);
            }
          }
        } catch (error) {
          report(error, { type: 'settings-clear', id: record.definition.id });
        }
        for (const key of keys) {
          try { storage.removeItem(key); } catch {}
        }
        for (const key of [...memoryStorage.keys()]) if (key.startsWith(prefix)) memoryStorage.delete(key);
        return true;
      },
    });
  }

  function createContext(record) {
    const allowedTargets = new Set(record.definition.dependencies);
    if (record.definition.parentId) allowedTargets.add(record.definition.parentId);
    return Object.freeze({
      id: record.definition.id,
      name: record.definition.name,
      version: record.definition.version,
      coreVersion,
      apiVersion: API_VERSION,
      signal: record.controller.signal,
      permissions: Object.freeze([...record.definition.permissions]),
      hasPermission(permission) {
        return record.definition.permissions.includes(permission);
      },
      requirePermission(permission) {
        return requirePermission(record, permission);
      },
      settings: createSettings(record),
      events: Object.freeze({
        on(name, handler) {
          return subscribe(record, String(name), handler);
        },
        emit(name, payload) {
          requirePermission(record, 'events:emit');
          if (record.status !== 'starting' && record.status !== 'active') {
            throw makeError('模块 ' + record.definition.id + ' 当前不能发布事件。');
          }
          return emitEvent(String(name), payload, record.definition.id);
        },
      }),
      modules: Object.freeze({
        getAPI(targetId) {
          const id = String(targetId || '');
          if (!allowedTargets.has(id)) {
            throw makeError('模块 ' + record.definition.id + ' 未声明对模块 ' + id + ' 的依赖。');
          }
          const target = requireRecord(id);
          if (target.status !== 'active') throw makeError('依赖模块尚未运行：' + id);
          return target.publicApi;
        },
        getStatus(targetId) {
          if (!allowedTargets.has(String(targetId || ''))) throw makeError('未声明模块依赖。');
          return snapshot(requireRecord(targetId));
        },
      }),
    });
  }

  function resolveOrder(id) {
    const order = [];
    const visited = new Set();
    const visiting = new Set();
    function visit(currentId) {
      if (visited.has(currentId)) return;
      if (visiting.has(currentId)) throw makeError('检测到模块依赖环：' + currentId);
      const record = requireRecord(currentId);
      visiting.add(currentId);
      if (record.definition.parentId) visit(record.definition.parentId);
      for (const dependency of record.definition.dependencies) visit(dependency);
      visiting.delete(currentId);
      visited.add(currentId);
      order.push(currentId);
    }
    visit(String(id));
    return order;
  }

  function orderedSubset(ids) {
    const subset = ids instanceof Set ? ids : new Set(ids);
    const result = [];
    const visited = new Set();
    const visiting = new Set();
    function visit(id) {
      if (!subset.has(id) || visited.has(id)) return;
      if (visiting.has(id)) throw makeError('检测到模块依赖环：' + id);
      const record = modules.get(id);
      if (!record) return;
      visiting.add(id);
      if (record.definition.parentId) visit(record.definition.parentId);
      for (const dependency of record.definition.dependencies) visit(dependency);
      visiting.delete(id);
      visited.add(id);
      result.push(id);
    }
    for (const id of subset) visit(id);
    return result;
  }

  function collectCascade(id) {
    requireRecord(id);
    const affected = new Set([String(id)]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const record of modules.values()) {
        const definition = record.definition;
        if (affected.has(definition.id)) continue;
        if ((definition.parentId && affected.has(definition.parentId)) ||
            definition.dependencies.some(dependency => affected.has(dependency))) {
          affected.add(definition.id);
          changed = true;
        }
      }
    }
    return affected;
  }

  function invokeSync(callback, receiver, args, details) {
    if (typeof callback !== 'function') return;
    try {
      const result = callback.apply(receiver, args);
      if (result && typeof result.then === 'function') {
        result.catch(error => report(error, details));
        report(makeError('模块 destroy/cleanup 必须同步完成，不能返回 Promise。'), details);
      }
    } catch (error) {
      report(error, details);
    }
  }

  function clearSubscriptions(record) {
    for (const unsubscribe of [...record.subscriptions]) {
      try { unsubscribe(); } catch {}
    }
    record.subscriptions.clear();
  }

  function cleanupReturnedValue(record, result, details) {
    const cleanup = typeof result === 'function'
      ? result
      : (result && typeof result.destroy === 'function' ? result.destroy : null);
    if (cleanup) invokeSync(cleanup, result, [], details);
    if (record.definition.destroy && record.definition.destroy !== cleanup) {
      invokeSync(record.definition.destroy, result, [record.context], details);
    }
  }

  function stopRecordSync(record, reason = 'stop') {
    const previousStatus = record.status;
    if (previousStatus === 'starting') {
      record.stopRequested = true;
      try { record.controller?.abort(); } catch {}
      clearSubscriptions(record);
      record.status = 'stopping';
      return;
    }
    if (previousStatus !== 'active' && previousStatus !== 'failed') {
      record.status = destroyed ? 'destroyed' : 'registered';
      return;
    }
    record.status = 'stopping';
    emitEvent('module:stopping', snapshot(record), record.definition.id);
    try { record.controller?.abort(); } catch {}
    clearSubscriptions(record);
    const details = { type: 'module-cleanup', id: record.definition.id, reason };
    invokeSync(record.cleanup, record.instance, [record.context], details);
    if (record.definition.destroy && record.definition.destroy !== record.cleanup && !record.initCleanupDone) {
      invokeSync(record.definition.destroy, record.instance, [record.context], details);
    }
    record.instance = null;
    record.publicApi = null;
    record.cleanup = null;
    record.context = null;
    record.controller = null;
    record.startedAt = null;
    record.stopRequested = false;
    record.initCleanupDone = false;
    record.status = destroyed ? 'destroyed' : 'registered';
    emitEvent('module:stopped', snapshot(record), record.definition.id);
  }

  async function startInternal(id) {
    assertAlive();
    const order = resolveOrder(id);
    const startedHere = [];
    try {
      for (const currentId of order) {
        assertAlive();
        const record = requireRecord(currentId);
        if (record.status === 'active') continue;
        if (record.status === 'starting' || record.status === 'stopping') {
          throw makeError('模块正处于生命周期转换中：' + currentId);
        }
        if (!AbortControllerCtor) throw makeError('当前宿主不支持 AbortController，无法安全启动模块。');
        record.status = 'starting';
        record.error = null;
        record.stopRequested = false;
        record.initCleanupDone = false;
        record.controller = new AbortControllerCtor();
        record.context = createContext(record);
        emitEvent('module:starting', snapshot(record), currentId);
        let result;
        try {
          result = await record.definition.init(record.context);
        } catch (error) {
          const cancelled = destroyed || record.controller.signal.aborted || record.stopRequested;
          clearSubscriptions(record);
          try { record.controller?.abort(); } catch {}
          if (record.definition.destroy) {
            invokeSync(record.definition.destroy, null, [record.context, error], {
              type: 'module-init-rollback', id: currentId,
            });
          }
          record.initCleanupDone = true;
          record.status = destroyed ? 'destroyed' : 'failed';
          record.error = errorText(error);
          record.controller = null;
          record.context = null;
          if (!cancelled) {
            report(error, { type: 'module-init', id: currentId });
            emitEvent('module:failed', snapshot(record), currentId);
          }
          throw error;
        }
        if (destroyed || record.controller.signal.aborted || record.stopRequested) {
          cleanupReturnedValue(record, result, { type: 'module-init-cancel', id: currentId });
          clearSubscriptions(record);
          record.initCleanupDone = true;
          record.instance = null;
          record.publicApi = null;
          record.cleanup = null;
          record.context = null;
          record.controller = null;
          record.status = destroyed ? 'destroyed' : 'registered';
          throw makeError('模块初始化已取消：' + currentId);
        }
        record.instance = result && typeof result === 'object' ? result : null;
        record.cleanup = typeof result === 'function'
          ? result
          : (result && typeof result.destroy === 'function' ? result.destroy : null);
        record.publicApi = result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'api')
          ? result.api
          : (result && typeof result === 'object' ? result : result);
        record.status = 'active';
        record.startedAt = new Date().toISOString();
        startedHere.push(record);
        emitEvent('module:started', snapshot(record), currentId);
      }
      return requireRecord(id).publicApi;
    } catch (error) {
      for (const record of startedHere.reverse()) stopRecordSync(record, 'start-rollback');
      throw error;
    }
  }

  function stopInternal(id) {
    const affected = collectCascade(id);
    const order = orderedSubset(affected).reverse();
    for (const currentId of order) stopRecordSync(requireRecord(currentId), 'cascade-stop');
    return order.map(currentId => snapshot(requireRecord(currentId)));
  }

  function enqueue(task) {
    const pending = operationQueue.then(task, task);
    operationQueue = pending.catch(() => undefined);
    return pending;
  }

  function register(input) {
    assertAlive();
    const definition = normalizeDefinition(input);
    if (modules.has(definition.id)) throw makeError('模块 ID 已注册：' + definition.id);
    assertReferences(definition);
    const record = createRecord(definition);
    modules.set(definition.id, record);
    emitEvent('module:registered', snapshot(record), definition.id);
    return snapshot(record);
  }

  function get(id) {
    const record = modules.get(String(id));
    return record ? snapshot(record) : null;
  }

  function getAPI(id) {
    const record = modules.get(String(id));
    if (!record || record.status !== 'active') return null;
    return record.publicApi;
  }

  function list() {
    return [...modules.values()].map(snapshot);
  }

  function has(id) {
    return modules.has(String(id));
  }

  function start(id) {
    return enqueue(() => startInternal(String(id)));
  }

  function stop(id) {
    return enqueue(() => {
      if (destroyed) return [];
      return stopInternal(String(id));
    });
  }

  function unregister(id, options = {}) {
    return enqueue(() => {
      assertAlive();
      const affected = collectCascade(String(id));
      if (affected.size > 1 && options.cascade !== true) {
        throw makeError('模块仍被子模块或依赖模块引用；如需级联卸载，请显式设置 cascade: true。');
      }
      const order = orderedSubset(affected).reverse();
      for (const currentId of order) {
        const record = requireRecord(currentId);
        stopRecordSync(record, 'unregister');
        modules.delete(currentId);
        emitEvent('module:unregistered', { id: currentId }, currentId);
      }
      return true;
    });
  }

  function replace(input) {
    return enqueue(async () => {
      assertAlive();
      const definition = normalizeDefinition(input);
      const oldRecord = requireRecord(definition.id);
      assertReferences(definition, definition.id);
      const affected = collectCascade(definition.id);
      const activeIds = orderedSubset(affected).filter(id => requireRecord(id).status === 'active');
      stopInternal(definition.id);
      modules.set(definition.id, createRecord(definition));
      try {
        for (const id of activeIds) await startInternal(id);
        emitEvent('module:replaced', snapshot(requireRecord(definition.id)), definition.id);
        return snapshot(requireRecord(definition.id));
      } catch (updateError) {
        try { stopInternal(definition.id); } catch (cleanupError) {
          report(cleanupError, { type: 'module-replace-cleanup', id: definition.id });
        }
        modules.set(definition.id, oldRecord);
        let rollbackError = null;
        try {
          for (const id of activeIds) await startInternal(id);
        } catch (error) {
          rollbackError = error;
          report(error, { type: 'module-replace-rollback', id: definition.id });
        }
        if (rollbackError) {
          throw makeError('模块更新失败，旧模块已恢复注册，但重新启动失败。更新错误：' +
            errorText(updateError) + '；回滚错误：' + errorText(rollbackError), updateError);
        }
        throw makeError('模块更新失败，已恢复旧版本 ' + oldRecord.definition.version + '。' +
          errorText(updateError), updateError);
      }
    });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    const ids = new Set(modules.keys());
    const order = orderedSubset(ids).reverse();
    for (const id of order) stopRecordSync(requireRecord(id), 'kernel-destroy');
    for (const record of modules.values()) {
      if (record.status === 'starting' || record.status === 'stopping') {
        try { record.controller?.abort(); } catch {}
        record.status = 'destroyed';
      }
    }
    listeners.clear();
    return true;
  }

  const api = Object.freeze({
    version: KERNEL_VERSION,
    apiVersion: API_VERSION,
    coreVersion,
    register,
    start,
    stop,
    unregister,
    replace,
    get,
    getAPI,
    list,
    has,
    destroy,
    get destroyed() { return destroyed; },
    events: Object.freeze({
      on(name, handler) { return subscribe(null, String(name), handler); },
      emit(name, payload) {
        const eventName = String(name);
        if (!eventPattern.test(eventName)) throw makeError('无效事件名称：' + eventName);
        assertAlive();
        return emitEvent(eventName, payload, 'core');
      },
    }),
  });

  return api;
}
