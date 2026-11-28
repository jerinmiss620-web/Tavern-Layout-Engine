import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const repo = 'jerinmiss620-web/Tavern-Layout-Engine';
const raw = `https://raw.githubusercontent.com/${repo}/`;
const read = p => readFileSync(p, 'utf8');
const json = p => JSON.parse(read(p));
const write = (p, value) => writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const plan = json('release-plan.json');
const versionRE = /^\d+\.\d+\.\d+$/;
for (const version of Object.values(plan)) assert.match(version, versionRE);
const compare = (a,b) => { const A=a.split('.').map(Number), B=b.split('.').map(Number); for(let i=0;i<3;i++) if(A[i]!==B[i]) return A[i]-B[i]; return 0; };
const sourcePath = (kind, version = plan[kind]) => kind === 'core' ? `releases/v${version}/TLE.js` : `loader/runtime/v${version}/TLE-Remote-Loader.js`;
const manifestPath = kind => kind === 'core' ? 'latest.json' : 'loader/latest.json';
const bootstrapPath = `loader/bootstrap/TLE-Permanent-Bootstrap-${plan.bootstrap}`;
const info = name => `**简介：** ${name}，TLE 一次安装自动更新系统。

**使用方式：** 在酒馆助手中仅导入并启用 Bootstrap，由它自动加载 Loader 和 Core；版本与更新位于 TLE 原有默认收起的折叠区域。

**注意事项：** 首次迁移禁用旧独立 Loader 和 Core 并保留备份；首次安装需联网；自动更新默认开启，可关闭；源码必须通过 Commit、路径、SHA-256 和字节数校验。

**作者：** 小松鼠 & ChatGPT（小松7）。`;
function prepare() {
  for (const kind of ['core', 'bootstrap']) {
    const path = kind === 'core' ? `releases/v${plan.core}/TLE-${plan.core}-import.json` : bootstrapPath + '.json';
    const source = read(kind === 'core' ? sourcePath('core') : bootstrapPath + '.js');
    const name = kind === 'core' ? `TLE ${plan.core}（独立备份；常规安装请用 Bootstrap）` : `TLE Permanent Bootstrap ${plan.bootstrap}`;
    const publishedCore = json('latest.json').latest_version;
    const template = json(kind === 'core' ? `releases/v${publishedCore}/TLE-${publishedCore}-import.json` : 'loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.json');
    const output = { ...template, name, enabled: false, info: info(name), content: source };
    // Existing fixed bootstrap packages are never rewritten on a Core/Loader release.
    if (existsSync(path)) {
      const existing = json(path);
      if (existing.content === source) continue;
      assert.equal(kind, 'core', 'Bootstrap is immutable: use a new protocol version for a necessary Bootstrap fix');
    }
    write(path, output);
  }
}
function release(kind, commit) {
  const source_path = sourcePath(kind), source = read(source_path), version = plan[kind];
  return { version, source_path, source_commit: commit, source_url: raw + commit + '/' + source_path,
    changelog_path: source_path.replace(/[^/]+$/, 'CHANGELOG.md'),
    sha256: createHash('sha256').update(source).digest('hex'), size_bytes: Buffer.byteLength(source) };
}
function pin(commit) {
  assert.match(commit || '', /^[a-f0-9]{40}$/);
  for (const kind of ['core','loader']) {
    const previous = json(manifestPath(kind));
    assert.ok(compare(plan[kind], previous.latest_version) >= 0, 'Cannot publish a lower version');
    let item;
    if (plan[kind] === previous.latest_version) {
      item = previous.release;
      assert.equal(release(kind, item.source_commit).sha256, item.sha256, 'Published releases are immutable; increment the version');
    } else {
      const committed = execFileSync('git', ['show', `${commit}:${sourcePath(kind)}`]);
      assert.equal(committed.toString('utf8'), read(sourcePath(kind)), 'Commit does not contain exact release bytes');
      item = release(kind, commit);
    }
    write(manifestPath(kind), { schema_version: 1, project: 'Tavern Layout Engine',
      channel: kind === 'core' ? 'stable' : 'stable-loader', latest_version: plan[kind],
      ...(kind === 'core' ? { minimum_loader_version: '0.3.4' } : { minimum_bootstrap_version: '1.0.0' }),
      release: item,
      notes: 'Verified full-source runtime simulation; real ST/TT device validation remains outstanding. See VALIDATION.md.' });
  }
}
async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
  assert.ok(response.ok, `${url}: HTTP ${response.status}`);
  return response.text();
}
async function verify({ remote = false, candidate = false } = {}) {
  for (const kind of ['core','loader']) {
    const manifest = json(manifestPath(kind));
    if (!candidate) {
      assert.equal(manifest.schema_version, 1);
      assert.equal(manifest.project, 'Tavern Layout Engine');
      assert.equal(manifest.channel, kind === 'core' ? 'stable' : 'stable-loader');
      assert.equal(manifest.latest_version, plan[kind]);
      assert.equal(manifest.release.version, manifest.latest_version);
      assert.ok(compare(kind === 'core' ? plan.loader : plan.bootstrap,
        kind === 'core' ? manifest.minimum_loader_version : manifest.minimum_bootstrap_version) >= 0);
    }
    const item = candidate ? release(kind, 'a'.repeat(40)) : manifest.release;
    if (kind === 'core' && plan.core !== json('latest.json').latest_version) {
      const stableVersion = json('latest.json').latest_version;
      const expectedSource = read('development/organizer/TLE.js').replaceAll(stableVersion, plan.core);
      assert.equal(read(sourcePath('core')), expectedSource,
        'Staged Core must be generated from the authoritative development source. Rebuild and stage again.');
    }
    assert.equal(item.version, plan[kind], 'Release plan and manifest differ: the update pointer was not advanced');
    assert.equal(item.source_path, sourcePath(kind));
    assert.match(item.source_commit, /^[a-f0-9]{40}$/);
    assert.equal(item.source_url, raw + item.source_commit + '/' + item.source_path);
    const actual = release(kind, item.source_commit);
    assert.deepEqual(item, actual, 'Source bytes, hash, version or changelog differ');
    new vm.Script(read(item.source_path), { filename: item.source_path });
    assert.ok(read(item.source_path).includes(kind === 'core' ? `version: '${item.version}'` : `const LOADER_VERSION = '${item.version}'`));
    assert.ok(read(item.changelog_path).includes('v' + item.version));
    const parent = kind === 'core' ? 'releases' : 'loader/runtime';
    for (const name of readdirSync(parent)) {
      const v = name.replace(/^v/, '');
      // TEST-only historical Core folders do not require promotion.
      if (!versionRE.test(v)) continue;
      const isRelease = kind === 'loader' || existsSync(`${parent}/${name}/TLE-${v}-import.json`);
      if (isRelease) assert.ok(compare(v, plan[kind]) <= 0, `Unpublished release ${v}: update release-plan.json and the manifest together`);
      const entries = readdirSync(`${parent}/${name}`).sort();
      if (compare(v, plan[kind]) < 0) {
        assert.deepEqual(entries, ['CHANGELOG.md'], `Historical ${kind} ${v} must retain only CHANGELOG.md`);
      } else if (v === plan[kind]) {
        const expected = kind === 'core'
          ? ['CHANGELOG.md', `TLE-${v}-import.json`, 'TLE.js']
          : ['CHANGELOG.md', 'TLE-Remote-Loader.js'];
        assert.deepEqual(entries, expected.sort(), `Current ${kind} ${v} contains unexpected or missing release artifacts`);
      }
    }
    if (remote) {
      const remoteManifest = JSON.parse(await fetchText(raw + 'main/' + manifestPath(kind) + '?_tle=' + Date.now()));
      assert.deepEqual(remoteManifest, json(manifestPath(kind)), 'Remote manifest differs');
      assert.equal(await fetchText(item.source_url), read(item.source_path), 'Pinned remote source differs byte-for-byte');
      console.log(`Remote ${kind} v${item.version}: ${item.size_bytes} bytes, SHA-256 ${item.sha256}, commit ${item.source_commit}`);
    }
  }
  for (const [path, source] of [[bootstrapPath + '.json', bootstrapPath + '.js'], [`releases/v${plan.core}/TLE-${plan.core}-import.json`, sourcePath('core')]]) {
    const pack = json(path);
    assert.equal(pack.content, read(source)); assert.equal(pack.enabled, false); assert.equal(pack.type, 'script');
    for (const text of ['简介','使用方式','注意事项','作者','小松鼠 & ChatGPT（小松7）']) assert.ok(pack.info.includes(text));
    assert.doesNotMatch(pack.info, /\\n/, 'info 必须使用实际换行，不得包含字面量反斜杠 n');
    new vm.Script(pack.content);
    if (remote) assert.deepEqual(JSON.parse(await fetchText(raw + 'main/' + path + '?_tle=' + Date.now())), pack);
  }
  console.log('Release plan, both manifests, immutable sources, installers and changelogs verified.');
}

const [command = 'verify', arg, version, notesPath] = process.argv.slice(2);
if (command === 'prepare') prepare();
else if (command === 'pin') pin(arg);
else if (command === 'verify') await verify({ remote: process.argv.includes('--remote'), candidate: process.argv.includes('--candidate') });
else if (command === 'stage') {
  assert.ok(['core','loader'].includes(arg), 'Usage: stage core|loader X.Y.Z notes.md');
  assert.match(version || '', versionRE); assert.ok(compare(version, plan[arg]) > 0);
  const target = sourcePath(arg, version);
  const targetDirectory = target.slice(0, target.lastIndexOf('/'));
  assert.ok(!existsSync(targetDirectory), 'Never reuse or overwrite an existing version directory');
  const notes = read(notesPath); assert.ok(notes.trim());
  if (arg === 'core') execFileSync(process.execPath, ['scripts/build-core.mjs', '--version', version], { stdio: 'inherit' });
  const authoritativeSourcePath = arg === 'core' ? 'development/organizer/TLE.js' : sourcePath(arg);
  const source = arg === 'core'
    ? read(authoritativeSourcePath)
    : read(authoritativeSourcePath).replaceAll(plan[arg], version);
  mkdirSync(targetDirectory, { recursive: true });
  writeFileSync(target, source);
  if (arg === 'core') writeFileSync('development/organizer/TLE.js', source);
  writeFileSync(target.replace(/[^/]+$/, 'CHANGELOG.md'), `# v${version}\n\n${notes}\n`);
  plan[arg] = version; write('release-plan.json', plan); prepare();
  console.log(`Staged ${arg} v${version}. Generated sources are immutable; review them, run npm test, then publish from a dedicated main checkout.`);
} else if (command === 'publish') {
  assert.equal(git('branch','--show-current'), 'main', 'Publish from a dedicated main checkout');
  assert.equal(git('remote','get-url','origin').replace(/\.git$/, ''), `https://github.com/${repo}`);
  git('fetch','origin','main');
  assert.equal(git('rev-parse','HEAD'), git('rev-parse','origin/main'), 'Start at current main; do not publish over concurrent work');
  for (const line of git('diff','--name-status','origin/main').split('\n')) {
    const [status, path = ''] = line.split('\t');
    if (/^(releases\/v\d|loader\/runtime\/v\d|loader\/bootstrap\/TLE-Permanent-)/.test(path) && /\.(js|json)$/.test(path)) {
      assert.equal(status, 'A', `Published artifact cannot be changed: ${path}`);
    }
  }
  prepare(); await verify({ candidate: true });
  execFileSync(process.execPath, ['scripts/test.mjs','--candidate'], { stdio: 'inherit' });
  git('add','--all'); git('commit','-m', `release: immutable Core ${plan.core} and Loader ${plan.loader} artifacts`);
  const commit = git('rev-parse','HEAD');
  pin(commit);
  execFileSync(process.execPath, ['scripts/test.mjs'], { stdio: 'inherit' });
  git('add','latest.json','loader/latest.json'); git('commit','-m', 'release: atomically advance verified update manifests');
  // Both commits become visible in one fast-forward, never with a stale pointer.
  git('push','origin','HEAD:main');
  await verify({ remote: true });
  execFileSync(process.execPath, ['tests/tle-update-chain.test.mjs','--remote'], { stdio: 'inherit' });
} else throw Error('Unknown release command: ' + command);
