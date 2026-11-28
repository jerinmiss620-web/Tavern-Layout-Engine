import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { buildModuleKernelBundle } from './build-module-kernel.mjs';
import { buildModuleLoaderBundle } from './build-module-loader.mjs';

const CORE_PATH = 'development/organizer/TLE.js';
const read = path => readFileSync(path, 'utf8');
const count = (source, marker) => source.split(marker).length - 1;

function insertBefore(source, anchor, insertion, label) {
  assert.equal(count(source, anchor), 1, label + ': expected exactly one anchor');
  return source.replace(anchor, insertion + anchor);
}

function placeMarkerAfter(source, marker, anchor, label) {
  assert.ok(count(source, marker) <= 1, label + ': marker must not be duplicated');
  if (count(source, marker) === 1) {
    const markerIndex = source.indexOf(marker);
    const before = source.slice(0, markerIndex).replace(/\n+$/, '');
    const after = source.slice(markerIndex + marker.length).replace(/^\n+/, '');
    source = before + '\n' + after;
  }
  assert.equal(count(source, anchor), 1, label + ': expected exactly one function-end anchor');
  const anchorEnd = source.indexOf(anchor) + anchor.length;
  const afterAnchor = source.slice(anchorEnd).replace(/^\n+/, '');
  return source.slice(0, anchorEnd) + '\n' + marker + '\n\n' + afterAnchor;
}
function ensureModuleMarkers(source) {
  const markers = [
    '/* TLE_AVATAR_ENGINE_START */',
    '/* TLE_AVATAR_ENGINE_END */',
    '/* TLE_GALLERY_HOME_START */',
    '/* TLE_GALLERY_HOME_END */',
  ];
  const counts = markers.map(marker => count(source, marker));
  if (counts.every(value => value === 0)) {
    source = insertBefore(
      source,
      '// TLE integrated engine, based on 桃mini「哇！头像变清晰啦！」v4.5.14.',
      '/* TLE_AVATAR_ENGINE_START */\n',
      'Avatar start',
    );
    source = insertBefore(
      source,
      'function createTLEGalleryHome(window, document) {',
      '/* TLE_AVATAR_ENGINE_END */\n/* TLE_GALLERY_HOME_START */\n',
      'Avatar/Gallery boundary',
    );
  } else {
    for (let index = 0; index < markers.length; index++) {
      assert.equal(count(source, markers[index]), 1, 'Module marker must occur exactly once: ' + markers[index]);
    }
  }

  // The Gallery factory ends here. Core.destroy() is later, after module startup.
  // Never use Core.destroy() as the Gallery boundary: that would absorb Kernel/Loader initialization.
  source = placeMarkerAfter(
    source,
    markers[3],
    '    window[GLOBAL_NAME] = api;\n    return api;\n}',
    'Gallery end',
  );
  return source;
}

function replaceRegion(source, startMarker, endMarker, replacement) {
  assert.equal(count(source, startMarker), 1, 'Missing or duplicate start marker: ' + startMarker);
  assert.equal(count(source, endMarker), 1, 'Missing or duplicate end marker: ' + endMarker);
  const start = source.indexOf(startMarker) + startMarker.length;
  const end = source.indexOf(endMarker);
  assert.ok(end > start, 'Invalid module marker order: ' + startMarker);
  return source.slice(0, start) + '\n' + replacement.trimEnd() + '\n' + source.slice(end);
}

const versionIndex = process.argv.indexOf('--version');
const requestedVersion = versionIndex >= 0 ? process.argv[versionIndex + 1] : null;
if (versionIndex >= 0) assert.match(requestedVersion || '', /^\d+\.\d+\.\d+$/, '--version requires X.Y.Z');
function replaceExactly(source, needle, replacement, label) {
  assert.equal(count(source, needle), 1, label + ': expected exactly one version anchor');
  return source.replace(needle, replacement);
}

function applyCoreVersion(source, nextVersion) {
  const header = source.match(/(\/\/ Tavern Layout Engine · Host Diagnostics 2\.0 · v)(\d+\.\d+\.\d+)/);
  assert.ok(header, 'Cannot determine the current Core version');
  const currentVersion = header[2];
  if (currentVersion === nextVersion) return source;

  source = replaceExactly(source, header[0], header[1] + nextVersion, 'Core version header');
  source = replaceExactly(
    source,
    'data-tle-update-summary>v' + currentVersion + ' ·',
    'data-tle-update-summary>v' + nextVersion + ' ·',
    'Update summary version',
  );
  source = replaceExactly(
    source,
    'data-tle-runtime-version>v' + currentVersion + '</strong>',
    'data-tle-runtime-version>v' + nextVersion + '</strong>',
    'Runtime version label',
  );
  source = replaceExactly(
    source,
    "coreVersion: '" + currentVersion + "',",
    "coreVersion: '" + nextVersion + "',",
    'Module Kernel Core version',
  );

  const apiStart = source.indexOf('  const api = {\n    modules: moduleKernel,');
  const apiEnd = source.indexOf('\n  };', apiStart);
  assert.ok(apiStart >= 0 && apiEnd > apiStart, 'Core public API object must be found');
  const api = source.slice(apiStart, apiEnd);
  const updatedApi = replaceExactly(
    api,
    "version: '" + currentVersion + "',",
    "version: '" + nextVersion + "',",
    'Core public API version',
  );
  source = source.slice(0, apiStart) + updatedApi + source.slice(apiEnd);

  source = replaceExactly(
    source,
    'Core v' + currentVersion + ' ·',
    'Core v' + nextVersion + ' ·',
    'Core startup diagnostic version',
  );
  return source;
}

const checkOnly = process.argv.includes('--check');
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : CORE_PATH;
assert.ok(outputPath, '--output requires a destination path');
assert.ok(!(checkOnly && outputIndex >= 0), '--check and --output cannot be combined');
assert.ok(!(checkOnly && requestedVersion), '--check and --version cannot be combined');
let source = read(CORE_PATH);
source = ensureModuleMarkers(source);
if (requestedVersion) source = applyCoreVersion(source, requestedVersion);

const moduleMarkers = [
  '  /* TLE_MODULE_KERNEL_START */',
  '  /* TLE_MODULE_KERNEL_END */',
  '  /* TLE_MODULE_LOADER_START */',
  '  /* TLE_MODULE_LOADER_END */',
];
for (const marker of moduleMarkers) assert.equal(count(source, marker), 1, 'Core module marker must occur exactly once: ' + marker);
function generatedBody(bundle, startMarker, endMarker) {
  assert.ok(bundle.startsWith(startMarker + '\n'), 'Generated module bundle has an invalid start marker');
  const end = bundle.lastIndexOf('\n' + endMarker);
  assert.ok(end > startMarker.length, 'Generated module bundle has an invalid end marker');
  return bundle.slice(startMarker.length + 1, end).trimEnd();
}
const kernelBundle = buildModuleKernelBundle(read('development/core/module-kernel.js'));
source = replaceRegion(source, moduleMarkers[0], moduleMarkers[1], generatedBody(kernelBundle, moduleMarkers[0], moduleMarkers[1]));
const loaderBundle = buildModuleLoaderBundle(read('development/core/module-loader.js'));
source = replaceRegion(source, moduleMarkers[2], moduleMarkers[3], generatedBody(loaderBundle, moduleMarkers[2], moduleMarkers[3]));
const batch = await build({
  entryPoints: ['development/organizer/batch/controller.js'],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'TLEBatchLibrary',
  target: 'es2022',
  legalComments: 'inline',
});
source = replaceRegion(
  source,
  '  /* TLE_CONTENT_BUNDLE_START */',
  '  /* TLE_CONTENT_BUNDLE_END */',
  batch.outputFiles[0].text,
);

const avatar = read('development/avatar-engine/avatar-engine.js');
assert.match(avatar, /^\/\/ TLE integrated engine,/);
assert.match(avatar, /function createTLEHDAvatarEngine\(/);
source = replaceRegion(
  source,
  '/* TLE_AVATAR_ENGINE_START */',
  '/* TLE_AVATAR_ENGINE_END */',
  avatar,
);

const coreVersion = source.match(/\/\/ Tavern Layout Engine · Host Diagnostics 2\.0 · v(\d+\.\d+\.\d+)/)?.[1];
assert.ok(coreVersion, 'Cannot determine the development Core version from its header');

let gallery = read('development/gallery-home/gallery-home.js');
assert.match(gallery, /^function createTLEGalleryHome\(/);
const galleryVersions = [...gallery.matchAll(/const VERSION = '(\d+\.\d+\.\d+)';/g)];
assert.equal(galleryVersions.length, 1, 'Gallery source must declare exactly one component VERSION');
gallery = gallery.replace(
  galleryVersions[0][0],
  "const VERSION = '" + coreVersion + "';",
);
source = replaceRegion(
  source,
  '/* TLE_GALLERY_HOME_START */',
  '/* TLE_GALLERY_HOME_END */',
  gallery,
);

if (checkOnly) {
  assert.equal(source, read(outputPath),
    'Core source is not assembled from its authoritative modules. Run npm run build:core.');
  console.log('TLE Core build check passed: Module Kernel, Module Loader, Organizer Batch, HD Avatar Engine and Gallery Home are synchronized.');
} else if (outputIndex >= 0) {
  writeFileSync(outputPath, source);
  console.log('Generated assembled TLE Core at ' + outputPath + '.');
} else {
  const previous = read(CORE_PATH);
  if (source !== previous) writeFileSync(CORE_PATH, source);
  console.log(source === previous
    ? 'TLE Core is already synchronized; no file changes were necessary.'
    : 'TLE Core rebuilt from Module Kernel, Module Loader, Organizer Batch, HD Avatar Engine and Gallery Home.');
}
