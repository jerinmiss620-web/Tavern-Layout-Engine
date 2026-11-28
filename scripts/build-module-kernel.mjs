import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildModuleKernelBundle(moduleSource) {
  const markerStart = '  /* TLE_MODULE_KERNEL_START */';
  const markerEnd = '  /* TLE_MODULE_KERNEL_END */';
  const exportLine = 'export function createModuleKernel(';
  if (moduleSource.split(exportLine).length !== 2) {
    throw new Error('module-kernel.js must export createModuleKernel exactly once');
  }
  const body = moduleSource.replace(exportLine, 'function createModuleKernel(');
  const indented = body.split('\n').map(line => '  ' + line).join('\n');
  return markerStart + '\n'
    + '  const TLEModuleKernelBundle = (() => {\n'
    + indented + '\n'
    + '    return { createModuleKernel };\n'
    + '  })();\n'
    + markerEnd;
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const corePath = path.resolve('development/organizer/TLE.js');
  const modulePath = path.resolve('development/core/module-kernel.js');
  const core = readFileSync(corePath, 'utf8');
  const moduleSource = readFileSync(modulePath, 'utf8');
  const startMarker = '  /* TLE_MODULE_KERNEL_START */';
  const endMarker = '  /* TLE_MODULE_KERNEL_END */';
  const start = core.indexOf(startMarker);
  const end = core.indexOf(endMarker, start);
  if (start < 0 || end < 0 || core.indexOf(startMarker, start + 1) >= 0 ||
      core.indexOf(endMarker, end + 1) >= 0 || end < start) {
    throw new Error('Core must contain exactly one ordered module-kernel marker pair');
  }
  const bundle = buildModuleKernelBundle(moduleSource);
  const next = core.slice(0, start) + bundle + core.slice(end + endMarker.length);
  if (next === core) {
    console.log('TLE Module Kernel bundle is already up to date.');
  } else {
    writeFileSync(corePath, next);
    console.log('TLE Module Kernel embedded into the single-file Core source.');
  }
}
