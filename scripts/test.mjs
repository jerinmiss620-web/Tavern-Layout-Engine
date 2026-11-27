import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const candidate = process.argv.includes('--candidate');
execFileSync(process.execPath, ['--test', ...readdirSync('tests/upstream-batch').filter(p => p.endsWith('.test.js')).map(p => 'tests/upstream-batch/' + p)], { stdio: 'inherit' });
for (const file of readdirSync('tests').filter(p => p.endsWith('.test.mjs'))) {
  execFileSync(process.execPath, ['tests/' + file], { stdio: 'inherit' });
}
execFileSync(process.execPath, ['tests/tle-regression.test.mjs','--current'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/release.mjs','verify', ...(candidate ? ['--candidate'] : [])], { stdio: 'inherit' });
if (!candidate) execFileSync(process.execPath, ['loader/verify-stable-release.mjs'], { stdio: 'inherit' });
