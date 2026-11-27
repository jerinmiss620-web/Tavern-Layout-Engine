import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const source = readFileSync('development/organizer/TLE.js', 'utf8');
const iconRule = source.match(/body\[data-tle-nav\]\[data-tle-compat-nav-repair\]\s+#top-settings-holder#top-settings-holder\s*>\s*\.drawer\s*>\s*\.drawer-toggle\s+\.drawer-icon\s*\{[\s\S]*?\n\s*\}/)?.[0];
assert.ok(iconRule, 'navigation compatibility rule must match direct and wrapped icons');
assert.doesNotMatch(iconRule, /:not\(\.closedIcon\)/);
assert.match(iconRule, /display: flex !important;/);
assert.match(iconRule, /visibility: visible !important;/);
assert.match(iconRule, /opacity: var\(--tle-nav-icon-opacity, 0\.7\) !important;/);

const innerRule = source.match(/body\[data-tle-nav\]\[data-tle-compat-nav-repair\]\s+#top-settings-holder#top-settings-holder\s*>\s*\.drawer\s*>\s*\.drawer-toggle\s+\.drawer-icon\s*>\s*\*,\s*body\[data-tle-nav\]\[data-tle-compat-nav-repair\]\s+#top-settings-holder#top-settings-holder\s*>\s*\.drawer\s*>\s*\.drawer-toggle\s+\.drawer-icon::before\s*\{[\s\S]*?\n\s*\}/)?.[0];
assert.ok(innerRule, 'inner glyphs and before-image sprites must be recoverable');
assert.match(innerRule, /display: inline-block !important;/);
assert.match(innerRule, /visibility: visible !important;/);
assert.match(innerRule, /opacity: 1 !important;/);
assert.match(source, /style\.id = ID\.style;\s*HOST_DOC\.head\.appendChild\(style\);/);
assert.match(source, /body\.style\.setProperty\('--tle-nav-icon-opacity', String\(navIconOpacity\)\)/);
assert.match(source, /if \(event\.target\?\.id === 'tle-nav-icon-opacity'\) setNavIconOpacity\(event\.target\.value\)/);

const dom = new JSDOM(`<!doctype html><html><head>
<style>
#top-settings-holder .drawer-toggle .drawer-icon.closedIcon,
#top-settings-holder .drawer-toggle .drawer-icon.openIcon {
  display: none !important; opacity: 0 !important; visibility: hidden !important;
}
#top-settings-holder .drawer-toggle .drawer-icon > span {
  display: none !important; opacity: 0 !important; visibility: hidden !important;
}
</style></head>
<body data-tle-nav="icons" data-tle-compat-nav-repair style="--tle-nav-icon-opacity: 0.45">
<div id="top-settings-holder">
  <div class="drawer"><div class="drawer-toggle"><span class="theme-wrapper"><i class="drawer-icon closedIcon"><span class="glyph"></span></i></span></div></div>
  <div class="drawer"><div class="drawer-toggle"><i class="drawer-icon openIcon"></i></div></div>
</div>
</body></html>`);
const document = dom.window.document;
const style = document.createElement('style');
style.id = 'tle-core-style';
style.textContent = iconRule + '\n' + innerRule;
document.head.appendChild(style);
const closedIcon = document.querySelector('.drawer-icon.closedIcon');
const openIcon = document.querySelector('.drawer-icon.openIcon');
const glyph = document.querySelector('.drawer-icon .glyph');
const selector = iconRule.slice(0, iconRule.indexOf('{')).trim();
assert.ok(closedIcon.matches(selector));
assert.ok(openIcon.matches(selector));
assert.equal(dom.window.getComputedStyle(closedIcon).display, 'flex');
assert.equal(dom.window.getComputedStyle(closedIcon).visibility, 'visible');
assert.equal(dom.window.getComputedStyle(openIcon).display, 'flex');
assert.equal(dom.window.getComputedStyle(openIcon).visibility, 'visible');
assert.equal(dom.window.getComputedStyle(glyph).display, 'inline-block');
assert.equal(dom.window.getComputedStyle(glyph).visibility, 'visible');
assert.equal(dom.window.getComputedStyle(glyph).opacity, '1');
assert.equal(document.body.style.getPropertyValue('--tle-nav-icon-opacity'), '0.45');
const parsed = [...style.sheet.cssRules].find(rule => rule.selectorText?.includes('.drawer-icon') && !rule.selectorText?.includes('::before'));
assert.ok(parsed);
assert.equal(parsed.style.getPropertyValue('opacity'), 'var(--tle-nav-icon-opacity, 0.7)');
assert.equal(style.parentElement, document.head);
console.log('TLE navigation compatibility: closed/open states, wrapped icons, hidden glyph recovery, opacity and head injection passed.');
