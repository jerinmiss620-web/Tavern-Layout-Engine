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

const fallbackAnalysis = api.hiddenFloorGuardAnalyze([fallbackRecord], fallbackWithInsertion);
assert.equal(fallbackAnalysis.stillHidden.length, 1);
assert.equal(fallbackAnalysis.stillHidden[0].index, 2,
  'date/name/sender/content and adjacent hashes provide a fallback when gen_id is absent');

const conflictingGeneration = {
  ...protectedRecord,
  genId: 'gen-original',
};
const regeneratedCandidate = {
  ...originalFingerprint,
  index: 7,
  genId: 'gen-regenerated',
  is_system: false,
};
assert.equal(api.hiddenFloorGuardMatchFingerprint(conflictingGeneration, [regeneratedCandidate]), null,
  'a different stable generation ID must never fall back to a similar-looking message');

const conflictingDateCandidate = {
  ...fallbackFingerprint,
  index: 6,
  sendDate: 'different-date',
  is_system: false,
};
assert.equal(api.hiddenFloorGuardMatchFingerprint(fallbackRecord, [conflictingDateCandidate]), null,
  'a conflicting timestamp must not be overridden by matching text/name/sender');

const editedFallbackCandidate = {
  ...fallbackFingerprint,
  index: 7,
  genId: '',
  contentHash: api.hiddenFloorGuardHash('edited body'),
  is_system: false,
};
const editedFallbackMatch = api.hiddenFloorGuardMatchFingerprint(fallbackRecord, [editedFallbackCandidate]);
assert.equal(editedFallbackMatch?.index, 7,
  'a unique timestamp/sender/name plus unchanged adjacent context can identify an edited message');
assert.equal(editedFallbackMatch?.confidence, 'high');

const competingDateCandidates = [
  {
    ...fallbackFingerprint,
    index: 4,
    genId: '',
    nextHash: fallbackFingerprint.nextHash,
  },
  {
    ...fallbackFingerprint,
    index: 8,
    genId: '',
    contentHash: api.hiddenFloorGuardHash('different body'),
    prevHash: fallbackFingerprint.prevHash,
    nextHash: fallbackFingerprint.nextHash,
  },
];
assert.equal(api.hiddenFloorGuardMatchFingerprint(fallbackRecord, competingDateCandidates), null,
  'messages sharing timestamp/name/sender remain ambiguous when context can identify more than one candidate');

const targetBeforeUnhide = [
  message('before-0', 0, false),
  message('before-1', 1, true),
  message('before-2', 2, true),
  message('before-3', 3, false),
];
const targetFingerprints = api.hiddenFloorGuardCreateFingerprints(targetBeforeUnhide)
  .filter(item => item.index >= 1 && item.index <= 2 && api.hiddenFloorGuardIsHidden(targetBeforeUnhide[item.index]));
const afterUnhideInsertion = [
  message('inserted-during-action', 9, false),
  ...targetBeforeUnhide.map(item => ({ ...item, is_system: false })),
];
const afterUnhideCandidates = api.hiddenFloorGuardCreateFingerprints(afterUnhideInsertion);
const targetGenIds = new Set(targetFingerprints.map(item => item.genId).filter(Boolean));
const targetAfterIndices = targetFingerprints.map(item =>
  api.hiddenFloorGuardMatchFingerprint(item, afterUnhideCandidates, new Set(), targetGenIds)?.index);
assert.deepEqual(targetAfterIndices, [2, 3],
  'pre-action message identities must be re-located after an insertion instead of reusing old floor numbers');

const exactRecord = { ...originalFingerprint, recordId: 'exact-record' };
const fallbackRecordWithSameIdentity = { ...originalFingerprint, genId: '', recordId: 'fallback-record' };
const exactPriority = api.hiddenFloorGuardAnalyze(
  [fallbackRecordWithSameIdentity, exactRecord],
  [{ ...originalChat[1], is_system: true }],
);
assert.equal(exactPriority.stillHidden.length, 1);
assert.equal(exactPriority.stillHidden[0].record.recordId, 'exact-record',
  'a fallback record must not consume a candidate reserved for a stable generation ID');
assert.equal(exactPriority.missing[0].recordId, 'fallback-record');

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
assert.ok(source.includes("hiddenFloorGuardCommitNativeAction(actionId, hiddenGuardTargets, snapshot.chatKey)"));
assert.ok(source.includes("filter(item => actionId !== 'unhide' || hiddenFloorGuardIsHidden(snapshot.chat[item.index]))"));
const nativeActionCommit = section(
  source,
  '  async function hiddenFloorGuardCommitNativeAction(',
  '  async function hiddenFloorGuardRestorePending(',
);
assert.ok(nativeActionCommit.includes('targetFingerprints'));
assert.ok(nativeActionCommit.includes('targetIndices.has(match.index)'));
assert.ok(!nativeActionCommit.includes('range.start') && !nativeActionCommit.includes('range.end'),
  'native hide/unhide backup synchronization must not reuse the pre-action floor range');
const runActionSection = section(source, '  async function runChatAction(', '  function updateInfoStation(');
assert.ok(runActionSection.includes('const hiddenGuardTargets = protectHiddenChange && actionRange'));
assert.ok(runActionSection.includes('hiddenFloorGuardCreateFingerprints(snapshot.chat)'));
assert.ok(source.includes("executeTLESlashCommand('/hide ' + range.start + '-' + range.end"));

const verification = section(
  source,
  '  async function hiddenFloorGuardVerify(',
  '  function hiddenFloorGuardScheduleVerify(',
);
assert.ok(!verification.includes('executeTLESlashCommand'));
assert.ok(!verification.includes('/hide '),
  'verification may detect and report lost hidden state, but must never re-hide automatically');

console.log('TLE Hidden Floor Guard tests passed: identity-first matching, generation-ID conflicts, shifted-floor actions, ambiguous-match refusal, native recovery ranges and no automatic re-hide.');
