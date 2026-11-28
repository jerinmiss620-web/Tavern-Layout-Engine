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

function ensureModuleMarkers(source) {
  const avatarGalleryMarkers = [
    '/* TLE_AVATAR_ENGINE_START */',
    '/* TLE_AVATAR_ENGINE_END */',
    '/* TLE_GALLERY_HOME_START */',
    '/* TLE_GALLERY_HOME_END */',
  ];
  const avatarGalleryCounts = avatarGalleryMarkers.map(marker => count(source, marker));
  if (avatarGalleryCounts.every(value => value === 0)) {
    source = insertBefore(
      source,
      '// TLE integrated engine, based on 桃mini「哇！头像变清晰啦！」v4.5.14.',
      '/* TLE_AVATAR_ENGINE_START */\\n',
      'Avatar start',
    );
    source = insertBefore(
      source,
      'function createTLEGalleryHome(window, document) {',
      '/* TLE_AVATAR_ENGINE_END */\\n/* TLE_GALLERY_HOME_START */\\n',
      'Avatar/Gallery boundary',
    );
    source = insertBefore(
      source,
      '  function destroy() {',
      '/* TLE_GALLERY_HOME_END */\\n',
      'Gallery end',
    );
  } else {
    for (const marker of avatarGalleryMarkers) {
      assert.equal(count(source, marker), 1, 'Module marker must occur exactly once: ' + marker);
    }
  }

  const moduleMarkers = [
    '  /* TLE_MODULE_KERNEL_START */',
    '  /* TLE_MODULE_KERNEL_END */',
    '  /* TLE_MODULE_LOADER_START */',
    '  /* TLE_MODULE_LOADER_END */',
  ];
  const moduleCounts = moduleMarkers.map(marker => count(source, marker));
  if (moduleCounts.every(value => value === 0)) {
    const placeholders = [
      '  /* TLE_MODULE_KERNEL_START */',
      '  /* TLE_MODULE_KERNEL_END */',
      '  /* TLE_MODULE_LOADER_START */',
      '  /* TLE_MODULE_LOADER_END */',
    ].join('\\n') + '\\n';
    source = insertBefore(
      source,
      '/* TLE_AVATAR_ENGINE_START */',
      placeholders,
      'Module Kernel/Loader markers',
    );
  } else {
    for (const marker of moduleMarkers) {
      assert.equal(count(source, marker), 1, 'Module marker must occur exactly once: ' + marker);
    }
  }
  return source;
}

function moduleBundleBody(bundle, startMarker, endMarker, label) {
  assert.ok(bundle.startsWith(startMarker + '\n'), label + ': invalid bundle start marker');
  assert.ok(bundle.endsWith('\n' + endMarker), label + ': invalid bundle end marker');
  return bundle.slice(startMarker.length + 1, bundle.length - endMarker.length - 1);
}

function replaceRegion(source, startMarker, endMarker, replacement) {
  assert.equal(count(source, startMarker), 1, 'Missing or duplicate start marker: ' + startMarker);
  assert.equal(count(source, endMarker), 1, 'Missing or duplicate end marker: ' + endMarker);
  const start = source.indexOf(startMarker) + startMarker.length;
  const end = source.indexOf(endMarker);
  assert.ok(end > start, 'Invalid module marker order: ' + startMarker);
  return source.slice(0, start) + '\n' + replacement.trimEnd() + '\n' + source.slice(end);
}

const checkOnly = process.argv.includes('--check');
const outputIndex = process.argv.indexOf('--output');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : CORE_PATH;
assert.ok(outputPath, '--output requires a destination path');
assert.ok(!(checkOnly && outputIndex >= 0), '--check and --output cannot be combined');
let source = read(CORE_PATH);
source = ensureModuleMarkers(source);

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

const kernelSource = read('development/core/module-kernel.js');
source = replaceRegion(
  source,
  '  /* TLE_MODULE_KERNEL_START */',
  '  /* TLE_MODULE_KERNEL_END */',
  moduleBundleBody(
    buildModuleKernelBundle(kernelSource),
    '  /* TLE_MODULE_KERNEL_START */',
    '  /* TLE_MODULE_KERNEL_END */',
    'Module Kernel',
  ),
);

const moduleLoaderSource = read('development/core/module-loader.js');
source = replaceRegion(
  source,
  '  /* TLE_MODULE_LOADER_START */',
  '  /* TLE_MODULE_LOADER_END */',
  moduleBundleBody(
    buildModuleLoaderBundle(moduleLoaderSource),
    '  /* TLE_MODULE_LOADER_START */',
    '  /* TLE_MODULE_LOADER_END */',
    'Module Loader',
  ),
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
  console.log('TLE Core build check passed: Organizer Batch, Module Kernel, Module Loader, HD Avatar Engine and Gallery Home are synchronized.');
} else if (outputIndex >= 0) {
  writeFileSync(outputPath, source);
  console.log('Generated assembled TLE Core at ' + outputPath + '.');
} else {
  const previous = read(CORE_PATH);
  if (source !== previous) writeFileSync(CORE_PATH, source);
  console.log(source === previous
    ? 'TLE Core is already synchronized; no file changes were necessary.'
    : 'TLE Core rebuilt from Organizer Batch, Module Kernel, Module Loader, HD Avatar Engine and Gallery Home.');
}
