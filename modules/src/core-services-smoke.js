// Test-only smoke module for the Phase 3.1 Core Services API v2.
// It does not create UI or mutate chat state; it verifies the shared service contract.
export default function createCoreServicesSmokeModule(context) {
  if (context.apiVersion !== 2) {
    throw new Error('Core Services Smoke requires Module Kernel API v2.');
  }
  if (!Object.isFrozen(context.services)) {
    throw new Error('Core services accessor must be immutable.');
  }

  const chatContext = context.services.get('chat-context');
  const resourceCatalog = context.services.get('resource-catalog');
  if (!Object.isFrozen(chatContext) || !Object.isFrozen(resourceCatalog)) {
    throw new Error('Core service objects must be immutable.');
  }

  for (const method of ['getActive', 'getCurrentRole', 'isGenerating', 'executeSlashCommand']) {
    if (typeof chatContext[method] !== 'function') {
      throw new Error('chat-context is missing method: ' + method);
    }
  }
  for (const method of ['list', 'listForManagement', 'applyChoice']) {
    if (typeof resourceCatalog[method] !== 'function') {
      throw new Error('resource-catalog is missing method: ' + method);
    }
  }

  const snapshot = chatContext.getActive();
  if (snapshot !== null) {
    if (!Object.isFrozen(snapshot) || !Array.isArray(snapshot.chat) || !Object.isFrozen(snapshot.chat)) {
      throw new Error('chat-context must return a frozen chat snapshot.');
    }
    if (snapshot.chat.some(message => !Object.isFrozen(message))) {
      throw new Error('chat-context messages must be frozen snapshots.');
    }
  }

  const isGenerating = chatContext.isGenerating();
  if (typeof isGenerating !== 'boolean') {
    throw new Error('chat-context.isGenerating() must return a boolean.');
  }
  const role = chatContext.getCurrentRole();
  if (role !== null && (typeof role !== 'object' || !Object.isFrozen(role))) {
    throw new Error('chat-context.getCurrentRole() must return a frozen role snapshot or null.');
  }

  let abortSignalRequired = false;
  try {
    resourceCatalog.list('character', { mount: false });
  } catch (error) {
    abortSignalRequired = /AbortSignal/.test(String(error?.message || error));
  }
  if (!abortSignalRequired) {
    throw new Error('resource-catalog must reject asynchronous calls without a module AbortSignal.');
  }

  const status = Object.freeze({
    apiVersion: context.apiVersion,
    activeChat: Boolean(snapshot),
    messageCount: snapshot?.chat?.length || 0,
    isGenerating,
    roleAvailable: Boolean(role),
    services: Object.freeze(['chat-context', 'resource-catalog']),
    abortSignalRequired,
  });

  console.info('[TLE Core Services Smoke] PASS', status);
  return {
    api: Object.freeze({ getStatus: () => status }),
    destroy() {
      console.info('[TLE Core Services Smoke] stopped.');
    },
  };
}
