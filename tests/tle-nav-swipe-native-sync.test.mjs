import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = process.env.TLE_TEST_SOURCE ? readFileSync(process.env.TLE_TEST_SOURCE, 'utf8') : read('releases/v' + JSON.parse(read('release-plan.json')).core + '/TLE.js');
for (const setting of ['nav-edge-swipe', 'compat-nav-text', 'compat-nav-text-color', 'compat-nav-text-hex']) assert.ok(source.includes(`data-tle-setting="${setting}"`));
assert.match(source, /HOST_DOC\.addEventListener\('touchstart'/);
assert.match(source, /HOST_DOC\.addEventListener\('touchend'/);
assert.match(source, /if \(readNativeGestureChecked\(\) === true\) return false/);
assert.doesNotMatch(source, /nativeGestureCheckbox\(\)\?\.checked !== false|if \(!syncNativeGesturesForSwipe\(\)\) return|tle-nav-swipe-grip/);
const start = source.indexOf('  // Opt-in touch navigation.');
const end = source.indexOf('  const drawerLabels =', start);
assert.ok(start >= 0 && end > start);
const functions = source.slice(start, end);
assert.doesNotMatch(functions, /preventDefault\(/, 'must never intercept OS gesture');

function makeFixture(initialState, { mounted = true, contextReady = true } = {}) {
  const storage = new Map();
  const power = { gestures: initialState };
  let saves = 0, observer, timerId = 0;
  const timers = new Map(), listeners = new Map();
  const status = { hidden: true, textContent: '' };
  const native = { tagName: 'INPUT', type: 'checkbox', checked: initialState, changes: 0,
    dispatchEvent(event) {
      assert.equal(event.type, 'change');
      native.changes++;
      listeners.get('change')?.({ target: native });
      power.gestures = native.checked;
      saves++;
      return true;
    } };
  const controller = new AbortController();
  const sandbox = {
    HOST_WIN: {
      navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 0 },
      Event: class { constructor(type, options) { this.type = type; this.bubbles = options?.bubbles; } },
      AbortController, addEventListener() {},
      localStorage: { getItem: key => storage.has(key) ? storage.get(key) : null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
      SillyTavern: { getContext: () => contextReady ? { powerUserSettings: power, saveSettingsDebounced() { saves++; } } : undefined },
      MutationObserver: class { constructor(cb) { this.cb = cb; observer = this; } observe() { this.active = true; } disconnect() { this.active = false; } },
      setTimeout: cb => { const id = ++timerId; timers.set(id, cb); return id; }, clearTimeout: id => timers.delete(id),
    },
    HOST_DOC: { body: { hasAttribute: () => false, classList: { contains: () => false } }, getElementById: id => mounted && id === 'gestures-checkbox' ? native : null, querySelector: selector => mounted && selector === 'input#gestures-checkbox' ? native : null, querySelectorAll: () => [], addEventListener: (type, cb) => listeners.set(type, cb) },
    state: { destroyed: false, active: true, mobileNav: { docked: false, open: false }, chatTools: { open: false }, panel: { dataset: {}, querySelector: () => status }, abort: controller },
    NAV_NATIVE_GESTURE_RESTORE_KEY: 'tle.navigation.restoreNativeGestures', NAV_EDGE_SWIPE_KEY: 'tle.navigation.edgeSwipe', navEdgeSwipeEnabled: false,
    getStoredBool: (key, fallback = false) => storage.has(key) ? storage.get(key) === 'true' : fallback,
    usesHamburger: () => true,
  };
  vm.createContext(sandbox);
  vm.runInContext(functions + '\nthis.sync = syncNativeGesturesForSwipe; this.setEnabled = setNavEdgeSwipeEnabled; this.read = readNativeGestureChecked; this.allowed = navEdgeSwipeAllowed;', sandbox);
  return { storage, native, power, status, listeners, timers, sandbox, get saves() { return saves; }, get observing() { return !!observer?.active; },
    setEnabled: value => sandbox.setEnabled(value), read: () => sandbox.read(), allowed: () => sandbox.allowed(),
    mount() { mounted = true; native.checked = power.gestures; if (observer?.active) observer.cb(); },
    unmount() { mounted = false; if (observer?.active) observer.cb(); },
    ready() { contextReady = true; },
    tick() { const first = timers.entries().next().value; if (first) { timers.delete(first[0]); first[1](); } },
    destroy() { controller.abort(); } };
}
const marker = 'tle.navigation.restoreNativeGestures';
const on = makeFixture(true);
on.setEnabled(true);
assert.equal(on.native.checked, false); assert.equal(on.power.gestures, false); assert.equal(on.saves, 1); assert.equal(on.storage.get(marker), 'true'); assert.equal(on.allowed(), true);
on.setEnabled(false);
assert.equal(on.native.checked, true); assert.equal(on.power.gestures, true); assert.equal(on.saves, 2); assert.equal(on.storage.has(marker), false);
const off = makeFixture(false);
off.setEnabled(true); off.setEnabled(false);
assert.equal(off.native.checked, false); assert.equal(off.saves, 0);
const tt = makeFixture(true, { mounted: false });
tt.setEnabled(true);
assert.equal(tt.power.gestures, false); assert.equal(tt.saves, 1); assert.equal(tt.read(), false); assert.equal(tt.allowed(), true); assert.ok(tt.listeners.has('touchstart'));
tt.mount(); assert.equal(tt.native.checked, false); assert.equal(tt.saves, 1);
tt.unmount(); tt.setEnabled(false); assert.equal(tt.power.gestures, true); assert.equal(tt.saves, 2); assert.equal(tt.storage.has(marker), false);
const delayed = makeFixture(true, { mounted: false, contextReady: false });
delayed.setEnabled(true); assert.equal(delayed.allowed(), true); assert.ok(delayed.listeners.has('touchstart')); assert.equal(delayed.timers.size, 1);
delayed.ready(); delayed.tick(); assert.equal(delayed.power.gestures, false); assert.equal(delayed.timers.size, 0); assert.equal(delayed.allowed(), true);
delayed.mount(); delayed.native.checked = true; delayed.native.dispatchEvent({ type: 'change' }); assert.equal(delayed.allowed(), false);
delayed.native.checked = false; delayed.native.dispatchEvent({ type: 'change' }); assert.equal(delayed.allowed(), true);
delayed.destroy(); assert.equal(delayed.observing, false); assert.equal(delayed.timers.size, 0);
const unavailable = makeFixture(true, { mounted: false, contextReady: false });
unavailable.setEnabled(true); for (let i = 0; i < 25; i++) unavailable.tick();
assert.equal(unavailable.timers.size, 0); assert.equal(unavailable.allowed(), true);
unavailable.mount(); assert.equal(unavailable.native.checked, false); assert.equal(unavailable.allowed(), true);
unavailable.destroy(); assert.equal(unavailable.observing, false);
console.log('Native gesture sync: checkbox, host API, delayed context, delayed mount, restore, manual conflict, retry bound and cleanup passed.');
