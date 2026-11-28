import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
export function isNonMainBranch() {
  const ref = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF || '';
  let branch = ref.replace(/^refs\/heads\//, '');
  if (!branch) {
    try { branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { branch = ''; }
  }
  return Boolean(branch && branch !== 'main');
}
function count(source, value) { return source.split(value).length - 1; }
function replaceOnce(source, before, after, label) {
  assert.equal(count(source, before), 1, label + ': expected exactly one module integration block');
  return source.replace(before, after);
}
function removeRegion(source, startMarker, endMarker) {
  assert.equal(count(source, startMarker), 1, 'Expected one module start marker: ' + startMarker);
  assert.equal(count(source, endMarker), 1, 'Expected one module end marker: ' + endMarker);
  const start = source.indexOf(startMarker), end = source.indexOf(endMarker, start);
  assert.ok(end > start, 'Invalid module marker order: ' + startMarker);
  return source.slice(0, start) + source.slice(end + endMarker.length);
}
export function normalizeCoreSource(source) {
  let normalized = source;
  const hasModules = normalized.includes('TLE_MODULE_KERNEL_START') || normalized.includes('TLE_MODULE_LOADER_START');
  if (hasModules) {
    normalized = removeRegion(normalized, '  /* TLE_MODULE_KERNEL_START */', '  /* TLE_MODULE_KERNEL_END */');
    normalized = removeRegion(normalized, '  /* TLE_MODULE_LOADER_START */', '  /* TLE_MODULE_LOADER_END */');
    const servicesStart = '  const coreModuleServices = Object.freeze({';
    const servicesEnd = '  const moduleKernel = TLEModuleKernelBundle.createModuleKernel({';
    const servicesStartIndex = normalized.indexOf(servicesStart);
    const servicesEndIndex = normalized.indexOf(servicesEnd, servicesStartIndex);
    assert.ok(servicesStartIndex >= 0 && servicesEndIndex > servicesStartIndex,
      'Cannot isolate the Core shared services registry');
    assert.equal(count(normalized, servicesStart), 1);
    assert.equal(count(normalized, servicesEnd), 1);
    normalized = normalized.slice(0, servicesStartIndex) + normalized.slice(servicesEndIndex);
    for (const marker of [
      '/* TLE_AVATAR_ENGINE_START */\n','/* TLE_AVATAR_ENGINE_END */\n',
      '/* TLE_GALLERY_HOME_START */\n','/* TLE_GALLERY_HOME_END */\n',
    ]) normalized = normalized.replaceAll(marker, '');
    const setupStart = '  const moduleKernel = TLEModuleKernelBundle.createModuleKernel({';
    const setupEnd = '  function destroy() {\n    if (state.destroyed) return;';
    const start = normalized.indexOf(setupStart), end = normalized.indexOf(setupEnd, start);
    assert.ok(start >= 0 && end > start, 'Cannot isolate the Module Kernel/Loader Core integration block');
    assert.equal(count(normalized, setupStart), 1);
    assert.equal(count(normalized, setupEnd), 1);
    normalized = normalized.slice(0, start) + normalized.slice(end);
    const moduleDestroy =
      "    try { moduleLoader.destroy(); } catch (error) { console.error('[TLE Module Loader] 卸载模块加载器失败。', error); }\n" +
      "    try { moduleKernel.destroy(); } catch (error) { console.error('[TLE Module Kernel] 卸载模块失败。', error); }\n" +
      "    try { galleryHome?.stop(); } catch (error) { console.warn('[TLE Gallery] 卸载画廊失败', error); }\n" +
      "    galleryHome = null;\n    hdAvatarEngine = null;";
    const stableDestroy =
      "    try { galleryHome?.stop(); } catch (error) { console.warn('[TLE Gallery] 卸载画廊失败', error); }\n" +
      "    galleryHome = null;\n" +
      "    try { hdAvatarEngine?.stop?.(); } catch (error) { console.warn('[TLE HD Avatar] 卸载高清头像引擎失败', error); }\n" +
      "    hdAvatarEngine = null;";
    normalized = replaceOnce(normalized, moduleDestroy, stableDestroy, 'Core destroy');
    normalized = replaceOnce(normalized, '    modules: moduleKernel,\n    moduleLoader,\n    moduleApiVersion: moduleKernel.apiVersion,\n', '', 'Core public API');
    normalized = replaceOnce(normalized, "  moduleLoader.start().catch(error => console.error('[TLE Module Loader] 启动失败。', error));\n", '', 'Module Loader startup');
    normalized = replaceOnce(normalized,
      '  galleryHome = createTLEGalleryHome(HOST_WIN, HOST_DOC);',
      '  hdAvatarEngine = createTLEHDAvatarEngine(SCRIPT_WIN, HOST_WIN, HOST_DOC);\n  galleryHome = createTLEGalleryHome(HOST_WIN, HOST_DOC);',
      'HD Avatar fallback');
  }
  normalized = normalized.replace(/\/\* TLE_AVATAR_ENGINE_START \*\/\n?/g, '');
  normalized = normalized.replace(/\/\* TLE_AVATAR_ENGINE_END \*\/\n?/g, '');
  normalized = normalized.replace(/\/\* TLE_GALLERY_HOME_START \*\/\n?/g, '');
  normalized = normalized.replace(/\/\* TLE_GALLERY_HOME_END \*\/\n?/g, '');
  // Removing the Avatar/Gallery build markers collapses one source-only blank line.
  // Normalize this exact formatting boundary; executable code remains compared byte-for-byte.
  normalized = normalized.replace(
    '  return api;\n}\nfunction createTLEGalleryHome(window, document) {',
    '  return api;\n}\n\nfunction createTLEGalleryHome(window, document) {',
  );
  normalized = normalized.replace(/(?<!\\)(?:\\\\)*\\u([0-9a-fA-F]{4})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
  normalized = normalized.replace(/(Host Diagnostics 2\\.0 · v)\\d+\\.\\d+\\.\\d+/g, '$1<version>');
  normalized = normalized.replace(/(data-tle-update-summary>v)\\d+\\.\\d+\\.\\d+/g, '$1<version>');
  normalized = normalized.replace(/(data-tle-runtime-version>v)\\d+\\.\\d+\\.\\d+/g, '$1<version>');
  normalized = normalized.replace(/Core v\\d+\\.\\d+\\.\\d+ · Host Diagnostics 2\\.0/g, 'Core v<version> · Host Diagnostics 2.0');
  normalized = normalized.replace(/version: '\\d+\\.\\d+\\.\\d+'/g, "version: '<version>'");
  normalized = normalized.replace(/([=!]==?)\\s*void 0/g, '$1 undefined');
  normalized = normalized.replace(/\n{2,}/g, '\n\n');
  return normalized;
}
