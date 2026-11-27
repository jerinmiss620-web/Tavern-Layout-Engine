import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const candidate = process.argv.includes('--candidate');
const development = process.argv.includes('--development');
if (candidate && development) throw new Error('Choose either --candidate or --development.');
const childEnv = development ? { ...process.env, TLE_TEST_DEVELOPMENT: '1' } : process.env;
const options = { stdio: 'inherit', env: childEnv };
execFileSync(process.execPath, ['--test', ...readdirSync('tests/upstream-batch').filter(p => p.endsWith('.test.js')).map(p => 'tests/upstream-batch/' + p)], options);
for (const file of readdirSync('tests').filter(p => p.endsWith('.test.mjs'))) {
  execFileSync(process.execPath, ['tests/' + file], options);
}
execFileSync(process.execPath, ['tests/tle-regression.test.mjs','--current'], options);
if (!development) {
  execFileSync(process.execPath, ['scripts/release.mjs','verify', ...(candidate ? ['--candidate'] : [])], options);
}
if (!candidate) execFileSync(process.execPath, ['loader/verify-stable-release.mjs'], options);
