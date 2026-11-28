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

  function removeRegion(startMarker, endMarker) {
    const start = normalized.indexOf(startMarker);
    const end = normalized.indexOf(endMarker, start + startMarker.length);
    if (start >= 0 && end > start) {
      normalized = normalized.slice(0, start) + normalized.slice(end + endMarker.length);
    }
  }

  // The module system is an intentional new feature on the integration branch.
  // Remove only its explicit generated bundles and lifecycle wiring when checking
  // that the pre-existing stable implementation remains unchanged.
  removeRegion('  /* TLE_MODULE_KERNEL_START */', '  /* TLE_MODULE_KERNEL_END */');
  removeRegion('  /* TLE_MODULE_LOADER_START */', '  /* TLE_MODULE_LOADER_END */');

  const runtimeStart = normalized.indexOf('  const moduleKernel = TLEModuleKernelBundle.createModuleKernel({');
  const runtimeEnd = normalized.indexOf('\\n  function destroy() {', runtimeStart);
  if (runtimeStart >= 0 && runtimeEnd > runtimeStart) {
    normalized = normalized.slice(0, runtimeStart) + normalized.slice(runtimeEnd);
  }

  normalized = normalized.replace(/^\\s*modules: moduleKernel,\\n\\s*moduleLoader,\\n\\s*moduleApiVersion: moduleKernel\\.apiVersion,\\n/m, '');
  normalized = normalized.replace(/^\\s*try \\{ moduleLoader\\.destroy\\(\\); \\} catch \\(error\\) \\{ console\\.error\\([^\\n]+\\n/m, '');
  normalized = normalized.replace(/^\\s*try \\{ moduleKernel\\.destroy\\(\\); \\} catch \\(error\\) \\{ console\\.error\\([^\\n]+\\n/m, '');
  normalized = normalized.replace(/^\\s*moduleLoader\\.start\\(\\)\\.catch\\([^\\n]+\\n/m, '');

  // The HD Avatar lifecycle moved from direct Core ownership to the Module
  // Kernel fallback. Exclude only the old direct start/stop statements from
  // this legacy-equivalence comparison; the engine implementation is still
  // compared byte-for-byte by the dedicated Avatar tests.
  normalized = normalized.replace(/^\\s*hdAvatarEngine = createTLEHDAvatarEngine\\(SCRIPT_WIN, HOST_WIN, HOST_DOC\\);\\n/m, '');
  normalized = normalized.replace(/^\\s*try \\{ hdAvatarEngine\\?\\.stop\\?\\.\\(\\); \\} catch \\(error\\) \\{ console\\.warn\\([^\\n]+\\n/m, '');

  for (const marker of [
    '/* TLE_AVATAR_ENGINE_START */',
    '/* TLE_AVATAR_ENGINE_END */',
    '/* TLE_GALLERY_HOME_START */',
    '/* TLE_GALLERY_HOME_END */',
  ]) {
    normalized = normalized.replaceAll(marker + '\\n', '');
  }

  // esbuild's ASCII output escapes non-ASCII characters; decode JS Unicode escapes
  // before comparing against the historical, hand-assembled stable source.
  normalized = normalized.replace(
    /(?<!\\\\)(?:\\\\\\\\)*\\\\u([0-9a-fA-F]{4})/g,
    (_match, hex) => String.fromCharCode(parseInt(hex, 16)),
  );

  // esbuild emits void 0 for the same undefined checks used in the stable bundle.
  normalized = normalized.replace(/([=!]==?)\\s*void 0/g, '$1 undefined');

  // Module markers are inserted at these two exact function boundaries.
  normalized = normalized.replace(/\\n{2,}(?=function createTLEGalleryHome\\()/g, '\\n');
  normalized = normalized.replace(/\\n{2,}(?=  function destroy\\()/g, '\\n');
  return normalized;
}
