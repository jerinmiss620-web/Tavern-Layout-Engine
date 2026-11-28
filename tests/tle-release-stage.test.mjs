import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (base, path) => readFileSync(join(base, path), 'utf8');
const plan = JSON.parse(read(root, 'release-plan.json'));
const next = plan.core.split('.').map(Number);
next[2] += 1;
const candidateVersion = next.join('.');
const stableCorePath = 'releases/v' + plan.core + '/TLE.js';
const stablePackagePath = 'releases/v' + plan.core + '/TLE-' + plan.core + '-import.json';
const bootstrapBase = 'loader/bootstrap/TLE-Permanent-Bootstrap-' + plan.bootstrap;
const bootstrapSourcePath = bootstrapBase + '.js';
const bootstrapPackagePath = bootstrapBase + '.json';

assert.ok(existsSync(join(root, 'node_modules/esbuild')),
  'Run npm ci before the release-stage integration test');

const temp = mkdtempSync(join(tmpdir(), 'tle-core-stage-'));
try {
  const required = [
    'scripts/release.mjs',
    'scripts/build-core.mjs',
    'development/organizer/TLE.js',
    'development/organizer/batch',
    'development/avatar-engine/avatar-engine.js',
    'development/gallery-home/gallery-home.js',
    'release-plan.json',
    'latest.json',
    bootstrapSourcePath,
    bootstrapPackagePath,
    stableCorePath,
    stablePackagePath,
  ];
  for (const path of required) {
    const source = join(root, path);
    const destination = join(temp, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
  }
  symlinkSync(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir');
  writeFileSync(join(temp, 'notes.md'), 'Automated Core stage integration test\n');

  const stableCoreBefore = read(temp, stableCorePath);
  const stablePackageBefore = read(temp, stablePackagePath);
  const bootstrapSourceBefore = read(temp, bootstrapSourcePath);
  const bootstrapPackageBefore = read(temp, bootstrapPackagePath);
  const stableManifestBefore = read(temp, 'latest.json');

  const collisionDirectory = join(temp, 'releases/v' + candidateVersion);
  mkdirSync(collisionDirectory, { recursive: true });
  writeFileSync(join(collisionDirectory, 'KEEP.txt'), 'existing directory must remain untouched');
  let collisionError;
  try {
    execFileSync(process.execPath, [
      'scripts/release.mjs', 'stage', 'core', candidateVersion, 'notes.md',
    ], { cwd: temp, encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    collisionError = error;
  }
  assert.ok(collisionError, 'staging must reject an already-existing version directory');
  assert.match(String(collisionError.stderr), /Never reuse or overwrite an existing version directory/);
  assert.equal(read(temp, 'releases/v' + candidateVersion + '/KEEP.txt'),
    'existing directory must remain untouched');
  assert.equal(existsSync(join(collisionDirectory, 'TLE.js')), false);
  rmSync(collisionDirectory, { recursive: true, force: true });

  execFileSync(process.execPath, [
    'scripts/release.mjs', 'stage', 'core', candidateVersion, 'notes.md',
  ], { cwd: temp, encoding: 'utf8', stdio: 'pipe' });

  const stagedPlan = JSON.parse(read(temp, 'release-plan.json'));
  const development = read(temp, 'development/organizer/TLE.js');
  const candidatePath = 'releases/v' + candidateVersion + '/TLE.js';
  const candidatePackagePath = 'releases/v' + candidateVersion + '/TLE-' + candidateVersion + '-import.json';
  const candidate = read(temp, candidatePath);
  const installer = JSON.parse(read(temp, candidatePackagePath));

  assert.equal(stagedPlan.core, candidateVersion, 'release-plan.json must advance to the candidate');
  assert.equal(stagedPlan.loader, plan.loader, 'Core staging must not advance the Loader version');
  assert.equal(stagedPlan.bootstrap, plan.bootstrap, 'Core staging must not advance the Bootstrap version');
  assert.equal(development, candidate, 'development Core and candidate release bytes must match exactly');
  assert.match(development, new RegExp('Host Diagnostics 2\\.0 · v' + candidateVersion));
  assert.ok(development.includes("const VERSION = '" + candidateVersion + "';"),
    'the embedded Gallery version must advance with the Core');
  assert.equal(installer.content, candidate, 'the disabled candidate backup installer must embed the exact Core');
  assert.equal(installer.enabled, false, 'candidate backup installers must remain disabled');
  assert.ok(read(temp, candidatePath.replace(/[^/]+$/, 'CHANGELOG.md')).includes('v' + candidateVersion));
  assert.equal(read(temp, stableCorePath), stableCoreBefore, 'the prior immutable Core source must remain untouched');
  assert.equal(read(temp, stablePackagePath), stablePackageBefore, 'the prior immutable Core backup installer must remain untouched');
  assert.equal(read(temp, bootstrapSourcePath), bootstrapSourceBefore, 'Bootstrap source must remain immutable');
  assert.equal(read(temp, bootstrapPackagePath), bootstrapPackageBefore, 'Bootstrap installer must remain immutable');
  assert.equal(read(temp, 'latest.json'), stableManifestBefore, 'staging must not advance the public stable manifest');

  execFileSync(process.execPath, ['scripts/build-core.mjs', '--check'], {
    cwd: temp, encoding: 'utf8', stdio: 'pipe',
  });
  console.log('TLE Core stage integration passed: unified build, candidate version sync, exact bytes and immutable published artifacts.');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
