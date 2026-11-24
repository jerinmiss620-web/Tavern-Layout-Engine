import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const plan = JSON.parse(read('release-plan.json'));
const source = read('releases/v' + plan.core + '/TLE.js');
assert.match(source, /data-tle-setting="nav-edge-swipe"/);
assert.match(source, /data-tle-setting="compat-nav-text"/);
assert.match(source, /data-tle-setting="compat-nav-text-color"/);
assert.match(source, /data-tle-setting="compat-nav-text-hex"/);
assert.match(source, /HOST_DOC\.addEventListener\('touchstart'/);
assert.match(source, /HOST_DOC\.addEventListener\('touchend'/);
assert.match(source, /nativeGestureCheckbox\(\)\?\.checked !== false/);
assert.doesNotMatch(source, /tle-nav-swipe-grip/, 'Do not add a redundant grip next to hamburger');

const start = source.indexOf('  // Opt-in touch navigation.');
const end = source.indexOf('  let navEdgeSwipeAbort = null;', start);
assert.ok(start >= 0 && end > start, 'native setting integration must be self-contained');
const functions = source.slice(start, end);
assert.doesNotMatch(functions, /preventDefault\(/, 'must never intercept OS gesture');
// Run SillyTavern checkbox event integration independently of OS user-agent checks.
function makeFixture(initialState) {
  const storage = new Map();
  const native = { checked: initialState, changes: 0,
    matches: selector => selector === 'input[type="checkbox"]',
    dispatchEvent: event => {
      assert.equal(event.type, 'change');
      native.changes++;
      native.saved = native.checked; // ST power-user.js change handler and saving.
      return true;
    } };
  const status = { hidden:true, textContent:'' };
  const sandbox = {
    HOST_WIN: {
      navigator:{userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',platform:'Win32',maxTouchPoints:0},
      Event:class {constructor(type,options){this.type=type;this.bubbles=options?.bubbles;}},
      localStorage:{getItem:key=>storage.has(key)?storage.get(key):null,
        setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)}
    },
    HOST_DOC:{ getElementById:id=>id==='gestures-checkbox'?native:null },
    state:{panel:{querySelector:()=>status}},
    NAV_NATIVE_GESTURE_RESTORE_KEY:'tle.navigation.restoreNativeGestures',
    navEdgeSwipeEnabled:false,
    getStoredBool:(key,fallback=false)=>storage.has(key)?storage.get(key)==='true':fallback,
  };
  vm.createContext(sandbox);
  vm.runInContext(functions+'\nthis.sync = syncNativeGesturesForSwipe;',sandbox);
  return {storage,native,status,sandbox,sync:()=>sandbox.sync()};
}
const on=makeFixture(true);
on.sandbox.navEdgeSwipeEnabled=true;
assert.equal(on.sync(),true,'enabling TLE should update native gesture');
assert.equal(on.native.checked,false);
assert.equal(on.native.saved,false);
assert.equal(on.native.changes,1);
assert.equal(on.storage.get('tle.navigation.restoreNativeGestures'),'true');
on.sandbox.navEdgeSwipeEnabled=false;
assert.equal(on.sync(),true,'disabling TLE should restore prior ST gesture');
assert.equal(on.native.checked,true);
assert.equal(on.native.changes,2);
assert.equal(on.storage.has('tle.navigation.restoreNativeGestures'),false);
const off=makeFixture(false);
off.sandbox.navEdgeSwipeEnabled=true;
assert.equal(off.sync(),true);
assert.equal(off.native.changes,0,'already-disabled ST gestures must not be overwritten');
off.sandbox.navEdgeSwipeEnabled=false;
assert.equal(off.sync(),true);
assert.equal(off.native.checked,false,'original false must stay false');
assert.equal(off.native.changes,0);
console.log('Core native gesture auto-sync test: event-driven save, restore and pre-disabled state passed.');
