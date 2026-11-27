import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRaw = relative => readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(readRaw('channels/test.json'));
const stableManifest = JSON.parse(readRaw('latest.json'));
const legacyFiles = manifest.release.version === '0.3.204' ? {
  'releases/v0.3.204/TLE.js': 'tests/fixtures/legacy/core-v0.3.204.js',
  'loader/TLE-Remote-Loader-Test-0.3.0.js': 'tests/fixtures/legacy/test-loader-v0.3.0.js',
  'loader/TLE-Remote-Loader-Test-0.3.0.json': 'tests/fixtures/legacy/test-loader-v0.3.0.json',
} : {};
const read = relative => readFileSync(path.join(root, legacyFiles[relative] || relative), 'utf8');

assert.equal(manifest.schema_version, 1);
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'test');
assert.equal(manifest.latest_version, manifest.release.version);
assert.ok(manifest.minimum_loader_version);

function verifyPinnedRelease(release, expectedPath, expectedUrlPattern) {
  assert.equal(release.source_path, expectedPath);
  assert.match(release.source_commit, /^[a-f0-9]{40}$/);
  assert.match(release.sha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(release.size_bytes) && release.size_bytes > 0);

  const url = new URL(release.source_url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'raw.githubusercontent.com');
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  assert.equal(url.search, '');
  assert.equal(url.hash, '');

  const match = url.pathname.match(expectedUrlPattern);
  assert.ok(match, 'Untrusted immutable source URL: ' + release.source_url);
  assert.equal(match[1], release.source_commit, 'URL commit and manifest source_commit differ');
  assert.equal(match[2], release.version, 'URL release version and manifest version differ');

  const source = read(expectedPath);
  assert.equal(Buffer.byteLength(source, 'utf8'), release.size_bytes, 'UTF-8 source size mismatch');
  assert.equal(createHash('sha256').update(source, 'utf8').digest('hex'), release.sha256, 'SHA-256 mismatch');
  new vm.Script(source, { filename: expectedPath });
  return source;
}

const tlePath = 'releases/v' + manifest.release.version + '/TLE.js';
const pinnedTle = verifyPinnedRelease(
  manifest.release,
  tlePath,
  /^\/jerinmiss620-web\/Tavern-Layout-Engine\/([a-f0-9]{40})\/releases\/v(\d+\.\d+\.\d+)\/TLE\.js$/
);
assert.ok(pinnedTle.includes(`const api = {\n    version: '${manifest.release.version}',`), 'Runtime instance API version must match the release manifest');

const plan = JSON.parse(read('release-plan.json'));
const tle = process.argv.includes('--current') ? read('releases/v' + plan.core + '/TLE.js') : pinnedTle;
if (manifest.release.version === '0.3.246') {
  const organizerSource = read('development/organizer/TLE.js');
  assert.equal(organizerSource, pinnedTle, 'Development Organizer source and pinned test Core must match byte-for-byte');
  assert.match(organizerSource, /this\.modeToggle = n\("input", "checkbox"\);/,
    'The checkbox uses the host native checkbox class');
  assert.match(organizerSource, /const categoryHeading = quickNode\('strong', 'tle-organizer-pane-title standoutHeader', '资源类型'\);/,
    'Resource type heading inherits standoutHeader');
  assert.match(organizerSource, /const groupHeading = quickNode\('strong', 'tle-organizer-pane-title standoutHeader', '分组目录'\);/,
    'Group heading inherits standoutHeader');
  assert.match(organizerSource, /const resourceHeader = quickNode\('div', 'tle-content-heading standoutHeader flex-container alignItemsCenter justifySpaceBetween'\);/,
    'Resource heading and checkbox share standoutHeader');
  assert.match(organizerSource, /workspace\.append\(categoryPane, groupPane, resourcePane\);/,
    'Organizer panes are laid out without divider elements');
  assert.doesNotMatch(organizerSource, /tle-organizer-divider|1px minmax\(168px/,
    'No Organizer divider DOM or grid tracks remain');
  assert.match(organizerSource, /this\.target = n\("label", "checkbox_label"\);/,
    'The checkbox label must use SillyTavern native checkbox_label markup');
  assert.match(organizerSource, /this\.modeToggle = n\("input", "checkbox"\);/,
    'Organizer mode must use one native checkbox');
  assert.match(organizerSource, /this\.modeToggle\.type = "checkbox";/,
    'The native mode control must be a checkbox');
  assert.match(organizerSource, /this\.modeToggle\.checked = this\.active;/,
    'Checkbox state must follow the selected functional module');
  assert.match(organizerSource, /this\.modeToggle\.checked \? "content" : "name"/,
    'Checking the control enters content search; unchecking returns to resource management');
  assert.doesNotMatch(organizerSource, /modeButtons|tle-content-mode-switch|tle-content-mode-button/,
    'No dual-button selector or private mode styling hooks may remain');
}
const loaderRelease = manifest.loader_release;
assert.ok(loaderRelease);
const loader = verifyPinnedRelease(
  loaderRelease,
  'loader/TLE-Remote-Loader-Test-0.3.0.js',
  /^\/jerinmiss620-web\/Tavern-Layout-Engine\/([a-f0-9]{40})\/loader\/TLE-Remote-Loader-Test-(\d+\.\d+\.\d+)\.js$/
);
assert.equal(loaderRelease.version, '0.3.0');
assert.match(loader, /const LOADER_VERSION = '0\.3\.0'/);
if (manifest.release.version === '0.3.222') {
  assert.match(loader, /feature\/organizer-nav-worldbooks-20261125\/channels\/test\.json/);
  assert.match(loader, /TLE_Organizer_Branch_Test_Cache/);
  assert.match(loader, /tle\.loader\.organizerBranchTest\.lastKnownGood\.v1/);
}

const installer = JSON.parse(read(loaderRelease.installer_path));
assert.equal(installer.type, 'script');
assert.equal(installer.id, manifest.release.version === '0.3.204' ? '8f994fad-ea17-49f8-93af-ebe8ba4f6c67' : 'e1a1d9fa-8f4b-4c2a-9c45-6c8d3a2f7b10');
assert.equal(installer.enabled, manifest.release.version === '0.3.204');
assert.equal(installer.content, loader, 'Tavern Helper installer content is out of sync with Loader source');

assert.match(tle, /if \(action === 'open-debugger'\) openMobileDebugger\(\);/);
assert.match(tle, /function handleDiagnosticButtonClick\(event\)/);
assert.match(tle, /HOST_WIN\.addEventListener\('click', handleDiagnosticButtonClick, \{/);
assert.match(tle, /event\.stopImmediatePropagation\(\)/);
assert.match(tle, /button\.removeAttribute\('popover'\)/);
assert.match(tle, /HOST_DOC\.documentElement\.appendChild\(button\)/);
assert.match(tle, /data-tle-positioning="fixed-document-root-fallback"/);
assert.match(tle, /function watchDiagnosticButton\(\)/);
assert.match(tle, /diagnosticButtonObserver/);
assert.match(tle, /buttonDisplayPriority/);
assert.match(tle, /buttonReceivesHit/);
assert.match(tle, /top: calc\(env\(safe-area-inset-top, 0px\) \+ 52px\) !important;/);
assert.doesNotMatch(tle, /inset:\s*auto 12px calc\(env\(safe-area-inset-bottom/);
assert.doesNotMatch(tle, /if \(target\.closest\('#' \+ ID\.diagnosticButton\)\)/);

assert.match(tle, /const CHAT_ACTIONS = \[\s*\{\s*id: 'jump'[\s\S]*?\},\s*\{\s*id: 'range'/);
assert.match(tle, /buttons: \[\{ id: 'hide', label: '隐藏' \}, \{ id: 'unhide', label: '恢复' \}\]/);
assert.match(tle, /data-chat-action-clear/);
assert.ok(tle.includes("makeChatActionInput(action, 'start')"));
assert.ok(tle.includes("makeChatActionInput(action, 'end')"));
assert.ok(tle.includes('两框均输入数字；只隐藏或恢复 1 层时'));
assert.ok(tle.includes('const endRaw = endInput?.value.trim()'));
assert.doesNotMatch(tle, /请输入有效范围，例如 90-90/);
assert.match(tle, /data-tle-setting="compat-nav-repair"/);
assert.doesNotMatch(tle, /width: fit-content !important;/);
assert.ok(tle.includes('flex: 0 0 min(44px, var(--tle-row-height)) !important;'));
assert.match(tle, /data-chat-quick-action="new"/);
assert.match(tle, /option_start_new_chat/);
assert.match(tle, /option_close_chat/);
assert.match(tle, /option_select_chat/);
assert.ok(tle.includes('querySelectorAll(`#options [id="${id}"]`)'));
assert.match(tle, /quickActionsEnabled: chatQuickActionsEnabled/);
assert.match(tle, /navigationRepairEnabled: compatibilityNavigationRepair/);
assert.doesNotMatch(tle, /margin-inline: 15px !important;/);
assert.ok(tle.includes('text-align: left !important;'));
assert.ok(tle.includes('body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle > .drawer-icon {') || tle.includes('body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle .drawer-icon {'));
if (process.argv.includes('--current')) {
  const navIconRule = tle.match(/body\[data-tle-nav\]\[data-tle-compat-nav-repair\] #top-settings-holder#top-settings-holder > \.drawer > \.drawer-toggle \.drawer-icon \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(navIconRule, /display: flex !important;/);
  assert.match(navIconRule, /align-items: center !important;/);
  assert.match(navIconRule, /justify-content: center !important;/);
  assert.match(navIconRule, /visibility: visible !important;/);
  assert.match(navIconRule, /opacity: var\(--tle-nav-icon-opacity, 0\.7\) !important;/);
  assert.doesNotMatch(navIconRule, /display: block/);
  assert.doesNotMatch(navIconRule, /closedIcon/);
  assert.doesNotMatch(tle, /drawer-icon:not\(\.closedIcon\)/);
  const featureBranch = /^refs\/heads\/feature\//.test(process.env.GITHUB_REF || '') ||
    /^feature\//.test(process.env.GITHUB_HEAD_REF || '') ||
    process.env.TLE_ALLOW_DEV_SOURCE_DIVERGENCE === '1';
  if (!featureBranch) {
    assert.equal(read('development/organizer/TLE.js'), read('releases/v' + plan.core + '/TLE.js'),
      'Development Core and current immutable release source must match byte-for-byte on stable branches');
  } else {
    assert.equal(read('releases/v' + plan.core + '/TLE.js'), read(stableManifest.release.source_path),
      'feature work must leave the current stable immutable release artifact untouched');
  }
}assert.ok(tle.includes('opacity: var(--tle-nav-icon-opacity, 0.7) !important;'));
assert.doesNotMatch(tle, /body\[data-tle-nav\] #top-settings-holder#top-settings-holder > \.drawer > \.drawer-toggle > \.drawer-icon \{\s*opacity:/);
assert.ok(tle.includes("const wrap = state.panel?.querySelector('[data-tle-compat-nav-opacity]')"));
assert.ok(tle.includes("body.style.removeProperty('--tle-nav-icon-opacity')"));
assert.ok(tle.includes("body.style.setProperty('--tle-nav-icon-opacity', String(navIconOpacity))"));
assert.ok(tle.includes("button.style.setProperty('top'"));
assert.ok(tle.includes("button.style.setProperty('right'"));
assert.ok(tle.includes("button.style.setProperty('bottom', 'auto', 'important')"));
assert.match(tle, /function findNavigationControlForEvent\(event\)/);
assert.match(tle, /function getNavigationEventDetails\(button, event\)/);
assert.match(tle, /targetArea/);
assert.match(tle, /iconReceivesHit/);
assert.match(tle, /labelReceivesHit/);
assert.match(tle, /iconCenterButtonReceivesHit/);
assert.match(tle, /iconPseudoElements/);
assert.match(tle, /navigationInteractionProbe\.activeClickEvent === event/);
assert.match(tle, /function recordNavigationPointerDown\(event\)/);
assert.match(tle, /function recordNavigationClickCapture\(event\)/);
assert.match(tle, /function recordNavigationClickDocumentBubble\(event\)/);
assert.match(tle, /function recordNavigationClickWindowBubble\(event\)/);
assert.match(tle, /nativeControls: navigationControlDiagnostics/);
assert.match(tle, /drawerOpenAfterDispatch/);
assert.match(tle, /buttonReceivesHit: Boolean\(topNode/);
assert.match(tle, /buttonPresentInHitStack: hitNodes\.some/);

console.log('TLE test-channel regression checks passed: TLE v' + manifest.release.version + ', Loader v' + loaderRelease.version + '.');
