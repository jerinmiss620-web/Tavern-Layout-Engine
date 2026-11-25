import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const channel = JSON.parse(readFileSync('channels/test.json', 'utf8'));
const source = readFileSync(channel.release.source_path, 'utf8');

const fieldCss = source.match(/\.tle-search-field\s*\{([^}]*)\}/)?.[1];
assert.ok(fieldCss, 'Shared TLE search-field rule is missing');
assert.match(fieldCss, /height:\s*40px;/, 'Search field height must remain fixed at 40px');
assert.match(fieldCss, /min-height:\s*40px;/, 'Search field min-height must remain fixed at 40px');
assert.doesNotMatch(fieldCss, /(?:^|\n)\s*(?:padding(?:-[\w-]+)?|border(?:-[\w-]+)?|background(?:-[\w-]+)?|color|font(?:-[\w-]+)?)\s*:/i,
  'Search-field visuals must come from the active theme, not TLE overrides');

const inputTags = [...source.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
const staticSearchInputs = inputTags.filter(tag => /\btle-search-field\b|\bdata-chat-tools-recent-search\b/.test(tag));
assert.equal(staticSearchInputs.length, 3, 'Global search, Organizer filter and recent-chat search must share the field class');
for (const tag of staticSearchInputs) {
  assert.match(tag, /type="search"/, 'Every static TLE search input must use type=search');
  assert.doesNotMatch(tag, /\btext_pole\b/, 'TLE search inputs must not opt back into generic text_pole styling');
}
assert.match(source, /quickNode\('input', 'tle-search-field'\)/, 'Quick-switch search must use the shared class');
assert.match(source, /search\.type = 'search'/, 'Quick-switch search must use input[type=search]');
assert.doesNotMatch(source, /class="text_pole[^"]*tle-search-field"|class="tle-search-field[^"]*text_pole"/,
  'No shared TLE search input may retain text_pole');
console.log('TLE shared native-theme search-input checks passed.');
