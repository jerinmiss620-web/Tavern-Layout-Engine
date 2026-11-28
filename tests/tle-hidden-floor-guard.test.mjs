import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../development/organizer/TLE.js', import.meta.url), 'utf8');

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

const pureHelpers = section(
  source,
  '  function hiddenFloorGuardIsHidden(',
  '  function hiddenFloorGuardCreateRecord(',
);
const sandbox = {};
vm.runInNewContext(pureHelpers + '\nglobalThis.hiddenGuardApi = { hiddenFloorGuardIsHidden, hiddenFloorGuardHash, hiddenFloorGuardCreateFingerprints, hiddenFloorGuardMatchFingerprint, hiddenFloorGuardAnalyze, hiddenFloorGuardGroupRanges };', sandbox);
const api = sandbox.hiddenGuardApi;

const message = (id, index, hidden = false) => ({
  extra: { gen_id: id },
  send_date: '2026-11-28T10:00:' + String(index).padStart(2, '0'),
  name: index % 2 ? '角色' : '用户',
  is_user: index % 2 === 0,
  mes: 'message body ' + id,
  is_system: hidden,
});

const originalChat = [
  message('gen-0', 0, false),
  message('gen-1', 1, true),
  message('gen-2', 2, false),
];
const originalFingerprint = api.hiddenFloorGuardCreateFingerprints(originalChat)[1];
const protectedRecord = { ...originalFingerprint, recordId: 'record-gen-1' };

const insertedChat = [message('new-before', 9, false), ...originalChat];
const insertedAnalysis = api.hiddenFloorGuardAnalyze([protectedRecord], insertedChat);
assert.equal(insertedAnalysis.stillHidden.length, 1);
assert.equal(insertedAnalysis.stillHidden[0].index, 2,
  'message identity matching must survive insertion before a protected hidden message');
assert.equal(insertedAnalysis.lost.length, 0);

const unhiddenChat = insertedChat.map(item =>
  item.extra.gen_id === 'gen-1' ? { ...item, is_system: false } : item);
const unhiddenAnalysis = api.hiddenFloorGuardAnalyze([protectedRecord], unhiddenChat);
assert.equal(unhiddenAnalysis.lost.length, 1);
assert.equal(unhiddenAnalysis.lost[0].index, 2);
assert.equal(unhiddenAnalysis.lost[0].confidence, 'high',
  'a stable generation ID is sufficient for a safe recovery candidate');

const editedChat = originalChat.map(item =>
  item.extra.gen_id === 'gen-1' ? { ...item, mes: 'edited body', is_system: false } : item);
const editedAnalysis = api.hiddenFloorGuardAnalyze([protectedRecord], editedChat);
assert.equal(editedAnalysis.lost.length, 1);
assert.equal(editedAnalysis.lost[0].confidence, 'high',
  'a stable generation ID still identifies a message after its content changes');

const fallbackChat = [
  { send_date: 'd0', name: '用户', is_user: true, mes: 'before', is_system: false },
  { send_date: 'd1', name: '角色', is_user: false, mes: 'protected body', is_system: true },
  { send_date: 'd2', name: '角色', is_user: false, mes: 'after', is_system: false },
];
const fallbackFingerprint = api.hiddenFloorGuardCreateFingerprints(fallbackChat)[1];
const fallbackRecord = { ...fallbackFingerprint, recordId: 'record-fallback' };
const fallbackWithInsertion = [
  { send_date: 'new', name: '用户', is_user: true, mes: 'inserted', is_system: false },
  ...fallbackChat,
];
const fallbackAnalysis = api.hiddenFloorGuardAnalyze([fallbackRecord], fallbackWithInsertion);
assert.equal(fallbackAnalysis.stillHidden.length, 1);
assert.equal(fallbackAnalysis.stillHidden[0].index, 2,
  'date/name/sender/content and adjacent hashes provide a fallback when gen_id is absent');

const ambiguous = { ...fallbackFingerprint, genId: '', sendDate: '', prevHash: '', nextHash: '' };
const ambiguousCandidates = [
  { ...ambiguous, index: 4 },
  { ...ambiguous, index: 8 },
];
assert.equal(api.hiddenFloorGuardMatchFingerprint(ambiguous, ambiguousCandidates), null,
  'ambiguous duplicate messages must never be auto-matched for recovery');

assert.deepEqual(
  JSON.parse(JSON.stringify(api.hiddenFloorGuardGroupRanges([7, 2, 4, 3, 9, 9]))),
  [{ start: 2, end: 4 }, { start: 7, end: 7 }, { start: 9, end: 9 }],
  'non-contiguous recovery floors must become separate native command ranges',
);

assert.ok(source.includes("indexedDB.open(HIDDEN_FLOOR_GUARD_DB, 1)"));
assert.ok(source.includes("new HOST_WIN.MutationObserver(records => {"));
assert.ok(source.includes("attributeFilter: ['is_system']"));
assert.ok(source.includes('data-hidden-guard-action="restore"'));
assert.ok(source.includes('data-hidden-guard-action="accept"'));
assert.ok(source.includes("hiddenFloorGuardCommitNativeAction(actionId, actionRange, snapshot.chatKey)"));
assert.ok(source.includes("executeTLESlashCommand('/hide ' + range.start + '-' + range.end"));

const verification = section(
  source,
  '  async function hiddenFloorGuardVerify(',
  '  function hiddenFloorGuardScheduleVerify(',
);
assert.ok(!verification.includes('executeTLESlashCommand'));
assert.ok(!verification.includes('/hide '),
  'verification may detect and report lost hidden state, but must never re-hide automatically');

console.log('TLE Hidden Floor Guard tests passed: per-chat fingerprints, shifted-floor matching, ambiguous-match refusal, native recovery ranges and no automatic re-hide.');
