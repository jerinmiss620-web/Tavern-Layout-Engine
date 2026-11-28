import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const packagePath = new URL("../optional-modules/freesia-override/freesia-override-v1.88.7.json", import.meta.url);
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(pkg.name, "Freesia 覆盖侠 v1.88.7");
assert.equal(pkg.id, "66c0243c-e963-48a3-a960-ed641bbb332e");
assert.doesNotMatch(pkg.content, /1\.88\.6/);
assert.doesNotMatch(pkg.content, /SCROLL_CHAT_TARGETS/);
new vm.Script(pkg.content);

const start = pkg.content.indexOf("  function buildScrollSelections(data) {");
const end = pkg.content.indexOf("  const selectedScrollFrom", start);
assert.ok(start >= 0 && end > start, "scroll selection builder must remain identifiable");
const functionSource = pkg.content.slice(start, end);

const desktopTouchMedia = "@media (hover: hover) and (pointer: fine), (hover: none) and (pointer: coarse)";
const context = {
  SCROLL_DESKTOP_MEDIA: "@media (hover: hover) and (pointer: fine)",
  SCROLL_DESKTOP_TOUCH_MEDIA: desktopTouchMedia,
  SCROLL_GLOBAL_TARGETS: "html, body, body *:not(#chat):not(#chat *)",
  SCROLL_CHAT_TARGET: "html body #sheld#sheld #chat",
  SCROLL_CHAT_WIDTH_BEGIN: "/* § FREESIA CHAT SCROLLBAR WIDTH · BEGIN */",
  SCROLL_CHAT_WIDTH_END: "/* § FREESIA CHAT SCROLLBAR WIDTH · END */",
  SCROLL_CHAT_GUTTER_BEGIN: "/* § FREESIA CHAT SCROLLBAR GUTTER · BEGIN */",
  SCROLL_CHAT_GUTTER_END: "/* § FREESIA CHAT SCROLLBAR GUTTER · END */",
  SCROLL_GLOBAL_WIDTH_BEGIN: "/* § FREESIA GLOBAL SCROLLBAR WIDTH · BEGIN */",
  SCROLL_GLOBAL_WIDTH_END: "/* § FREESIA GLOBAL SCROLLBAR WIDTH · END */",
  SCROLL_GLOBAL_GUTTER_BEGIN: "/* § FREESIA GLOBAL SCROLLBAR GUTTER · BEGIN */",
  SCROLL_GLOBAL_GUTTER_END: "/* § FREESIA GLOBAL SCROLLBAR GUTTER · END */",
  normalizeScroll: input => ({
    chatWidth: String(input.chatWidth ?? "keep"),
    chatGutter: String(input.chatGutter ?? "keep"),
    globalWidth: String(input.globalWidth ?? "keep"),
    globalGutter: String(input.globalGutter ?? "keep"),
  }),
};

const buildScrollSelections = vm.runInNewContext(`${functionSource}\nbuildScrollSelections`, context);
const selections = buildScrollSelections({
  chatWidth: "6",
  chatGutter: "both",
  globalWidth: "7",
  globalGutter: "both",
});
const css = Object.fromEntries(selections.map(item => [item.id, item.build(item.value)]));

assert.ok(css["scroll-chat-width"].includes(desktopTouchMedia), "chat scrollbar width must match desktop and touch devices");
assert.ok(css["scroll-chat-width"].includes("html body #sheld#sheld #chat::-webkit-scrollbar"));
assert.doesNotMatch(css["scroll-chat-width"], /#chat\s+\*/);

assert.ok(css["scroll-chat-gutter"].includes(desktopTouchMedia), "chat gutter must match desktop and touch devices");
assert.ok(css["scroll-chat-gutter"].includes("html body #sheld#sheld #chat { scrollbar-gutter: stable both-edges !important; }"));
assert.doesNotMatch(css["scroll-chat-gutter"], /#chat\s+\*/);

assert.ok(css["scroll-global-width"].includes("@media (hover: hover) and (pointer: fine)"));
assert.ok(css["scroll-global-gutter"].includes(desktopTouchMedia), "global gutter must match desktop and touch devices");
assert.ok(!css["scroll-global-width"].includes("pointer: coarse"), "global scrollbar behavior must remain unchanged");
assert.ok(css["scroll-global-gutter"].includes("scrollbar-gutter: stable both-edges !important;"));
assert.doesNotMatch(css["scroll-global-gutter"], /#chat\\s+\\*/);

console.log("Freesia Override scrollbar scope and device tests passed.");
