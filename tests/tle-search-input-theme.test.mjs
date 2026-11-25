import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const channel = JSON.parse(readFileSync('channels/test.json', 'utf8'));
const source = readFileSync(channel.release.source_path, 'utf8');

const fieldCss = source.match(/input\.tle-search-field\[type="search"\]\s*\{([^}]*)\}/)?.[1];
assert.equal(fieldCss, undefined, 'Search inputs inherit native sizing and appearance; do not force height, margin or box sizing');
const organizer=source.slice(source.indexOf('  function createOrganizerPanel()'),source.indexOf('  function createRailControls()'));
assert.doesNotMatch(organizer, /<button[^>]*tle-search-clear/, 'Organizer uses the native search-cancel control inside the input');

const inputTags = [...source.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
const staticSearchInputs = inputTags.filter(tag => /\btle-search-field\b|\bdata-chat-tools-recent-search\b/.test(tag));
assert.equal(staticSearchInputs.length, 3, 'Global search, Organizer filter and recent-chat search must share the field class');
for (const tag of staticSearchInputs) {
  assert.match(tag, /type="search"/, 'Every static TLE search input must use type=search');
  assert.match(tag, /\btext_pole\b/, 'Search fields must use the host input class rather than browser-default unthemed inputs');
}
assert.match(source, /quickNode\('input', 'tle-search-field text_pole'\)/, 'Quick-switch search must use the shared and native classes');
assert.match(source, /search\.type = 'search'/, 'Quick-switch search must use input[type=search]');
console.log('TLE shared native-theme search-input checks passed.');
