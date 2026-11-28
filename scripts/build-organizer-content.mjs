// Backward-compatible alias. Use npm run build:core for all Core components.
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/build-core.mjs', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
