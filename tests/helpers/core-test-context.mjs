import { execFileSync } from 'node:child_process';

export function isNonMainBranch() {
  const ref = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF || '';
  let branch = ref.replace(/^refs\/heads\//, '');
  if (!branch) {
    try {
      branch = execFileSync('git', ['branch', '--show-current'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      branch = '';
    }
  }
  return Boolean(branch && branch !== 'main');
}

export function normalizeCoreSource(source) {
  let normalized = source;
  for (const marker of [
    '/* TLE_AVATAR_ENGINE_START */',
    '/* TLE_AVATAR_ENGINE_END */',
    '/* TLE_GALLERY_HOME_START */',
    '/* TLE_GALLERY_HOME_END */',
  ]) {
    normalized = normalized.replaceAll(marker + '\n', '');
  }

  // esbuild's ASCII output escapes non-ASCII characters; decode JS Unicode escapes
  // before comparing against the historical, hand-assembled stable source.
  normalized = normalized.replace(
    /(?<!\\)(?:\\\\)*\\u([0-9a-fA-F]{4})/g,
    (_match, hex) => String.fromCharCode(parseInt(hex, 16)),
  );

  // esbuild emits void 0 for the same undefined checks used in the stable bundle.
  normalized = normalized.replace(/([=!]==?)\s*void 0/g, '$1 undefined');

  // Module markers are inserted at these two exact function boundaries.
  normalized = normalized.replace(/\n{2,}(?=function createTLEGalleryHome\()/g, '\n');
  normalized = normalized.replace(/\n{2,}(?=  function destroy\()/g, '\n');
  return normalized;
}
