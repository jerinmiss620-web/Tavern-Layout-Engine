import fs from 'node:fs';
import { build } from 'esbuild';
const file = 'development/organizer/TLE.js';
const bundle = await build({ entryPoints: ['development/organizer/batch/controller.js'], bundle: true, write: false, format: 'iife', globalName: 'TLEBatchLibrary', target: 'es2022', legalComments: 'inline' });
let source = fs.readFileSync(file, 'utf8');
source = source.replace(/  \/\* TLE_CONTENT_BUNDLE_START \*\/[\s\S]*?  \/\* TLE_CONTENT_BUNDLE_END \*\//,
    () => '  /* TLE_CONTENT_BUNDLE_START */\n' + bundle.outputFiles[0].text + '  /* TLE_CONTENT_BUNDLE_END */');
fs.writeFileSync(file, source);
console.log('Organizer content bundle rebuilt from attributed v1.1.0 engine and TLE controller.');
