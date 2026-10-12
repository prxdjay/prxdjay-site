import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";

// Offline release checks only. Browser interaction, live providers, and the
// deployed response headers still need their own smoke test.
const root = new URL("../", import.meta.url);
const bytes = (path) => readFileSync(new URL(path, root));
const text = (path) => bytes(path).toString("utf8");
const html = text("index.html");
const css = text("assets/css/artist.css");
const js = text("assets/js/artist.js");
const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map(([tag]) => tag);
const attr = (tag, name) => tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`, "i"))?.[1];
const values = (name) => tags.map((tag) => attr(tag, name)).filter(Boolean);
const gitHash = (path) => {
  const content = bytes(path);
  return createHash("sha1")
    .update(`blob ${content.length}\0`)
    .update(content)
    .digest("hex");
};
const album = "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw";
const identityPath = "assets/identity/prxd-jay-artist-photo.jpg";
const identityUrl = `https://prxdjay.com/${identityPath}`;

// Fingerprints of revision 3 assets, including the requested hero grain. An intentional replacement
// requires reviewing the new asset before updating its fingerprint here.
const approvedAssets = {
  "assets/artist/clip-posters/findyou.jpg": "af248554df5738f3ed20abc29a122ec9a0f8f357",
  "assets/artist/clip-posters/sponsored.jpg": "0c0ebae17143c2e7540311154dea7e1e6d11bdda",
  "assets/artist/clip-posters/wrist.jpg": "efa42a5f3659c4b5b1a88f1deea822f914b0d6b0",
  "assets/artist/clips/findyou.webm": "6d819f871a37dfafc33cc0b7e6a10219502fb9f2",
  "assets/artist/clips/sponsored.webm": "9d17fc537383eb0c419716cfcac8148f769a4673",
  "assets/artist/clips/toomany.webm": "d3b2889a01a2221082709c58a74269c64a4b2247",
  "assets/artist/clips/wrist.webm": "fc36fabe9d53a3c206fa0c3c4077911ad25b710e",
  "assets/artist/fonts/archivo.woff2": "e2448d0561ffdb0b0974d063a7cdbb712f41ad49",
  "assets/artist/fonts/martian.woff2": "397689377e7d2ddbf65580bc598942bfb222f091",
  "assets/artist/photos/concrete-graded-crop.jpg": "5bd2a4971e4cabcff1cf7ed6920935ab03feb4ae",
  "assets/artist/photos/concrete-hero.jpg": "305718289c11d846b79656772ae87629dc7e0812",
  "assets/artist/photos/fence_grain-6.3pct.jpg": "277671a4d5d9dc279754c3079ccde95c6ebe7f62",
  "assets/artist/photos/prxdigy-vxl1-cover.jpg": "6301c64126933e909d90d16cf417be950e16bd4f",
};
const originalMp4s = {
  "assets/img/clips/findyou.mp4": "523c8969b4f2bb9e3c4548aba18cada5880c88f8",
  "assets/img/clips/sponsored.mp4": "37b759ccc51970467842114c34908bd4a331f121",
  "assets/img/clips/toomany.mp4": "3b61a6b9216d2e575f102786df4cb2d8f875a0f7",
  "assets/img/clips/wrist.mp4": "ef905d431723d2300922f259b75127dfaf8b8e8f",
};

test("approved local images, fonts, and WebM clips retain their exact bytes", () => {
  for (const [path, expected] of Object.entries(approvedAssets)) {
    assert.equal(gitHash(path), expected, `Approved asset changed: ${path}`);
    const content = bytes(path);
    if (path.endsWith(".jpg")) assert.equal(content.subarray(0, 3).toString("hex"), "ffd8ff", path);
    if (path.endsWith(".woff2")) assert.equal(content.subarray(0, 4).toString(), "wOF2", path);
    if (path.endsWith(".webm")) assert.equal(content.subarray(0, 4).toString("hex"), "1a45dfa3", path);
  }
});

test("all four original MP4s keep their Git blob hashes", () => {
  for (const [path, expected] of Object.entries(originalMp4s)) {
    assert.equal(gitHash(path), expected, `Original clip changed: ${path}`);
    assert.equal(bytes(path).subarray(4, 8).toString(), "ftyp", path);
  }
});

test("every directly referenced local image, script, and stylesheet exists", () => {
  const refs = [...values("src"), ...tags.filter((tag) => attr(tag, "rel") === "stylesheet").map((tag) => attr(tag, "href"))];
  for (const ref of refs.filter((ref) => ref?.startsWith("/"))) {
    const path = ref.slice(1).split(/[?#]/)[0];
    assert.ok(existsSync(new URL(path, root)), `Missing local asset: ${path}`);
  }
  for (const [, ref] of css.matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)) {
    assert.ok(existsSync(new URL(ref.slice(1).split(/[?#]/)[0], root)), `Missing CSS asset: ${ref}`);
  }
});

test("production is indexable and contains no approval placeholder copy", () => {
  assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/prxdjay\.com\/">/);
  assert.match(html, /<title>PRXD\.JAY \(Prodigy\) \| Official Music &amp; Videos<\/title>/);
  assert.doesNotMatch(html, /noindex|nofollow|approval mockup|awaiting sign-off|not live|not linked here|\[EMBEDDED ASSET|\[BASE64 DATA\]/i);
  assert.doesNotMatch(text("robots.txt"), /^Disallow:\s*\/\s*$/mi);
});

test("public artist page and active code contain no removed social or beat-store URLs", () => {
  assert.doesNotMatch(`${html}\n${css}\n${js}`, /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|traktrain\.com)(?:[/:?#]|\b)/i);
  // Twitter card metadata remains useful for shares; removed account handles do not.
  assert.doesNotMatch(html, /name="twitter:(?:site|creator)"/);
  assert.ok(!values("src").some((url) => /\/assets\/js\/(?:app|era\.config)\.js/.test(url)), "Dormant legacy UI must not execute on the new page");
});

test("all fragment navigation and accessible label targets exist and IDs are unique", () => {
  const ids = values("id");
  assert.equal(new Set(ids).size, ids.length, "Duplicate element IDs");
  for (const href of values("href").filter((url) => url.startsWith("#"))) {
    assert.ok(ids.includes(href.slice(1)), `Broken fragment ${href}`);
  }
  for (const id of values("data-jump")) assert.ok(ids.includes(id), `Missing navigation target ${id}`);
  for (const name of ["aria-labelledby", "aria-describedby", "aria-controls"]) {
    for (const value of values(name)) {
      for (const id of value.split(/\s+/)) assert.ok(ids.includes(id), `Missing ${name} target ${id}`);
    }
  }
  assert.ok(values("href").includes("/privacy.html"));
  assert.ok(values("href").includes("/terms.html"));
});

test("legal documents and dormant subscription implementation stay unchanged", () => {
  const preserved = {
    "privacy.html": "3c4a4a26e7a869aa56b834a37ccb08b98448144e",
    "terms.html": "5495bd93f403b6c4ebe9a544c4be64ca85881d1a",
    "functions/api/subscribe.js": "a92f19020de95f7fd8ccb5988f047d5000ac9711",
    "assets/js/app.js": "2a33ab4f1ad3f220d0bf7a27ad0772e3c66b4b1b",
    "assets/js/era.config.js": "caf5735242c692c54fef09b141df6c603e6aab6a",
  };
  for (const [path, expected] of Object.entries(preserved)) assert.equal(gitHash(path), expected, path);
  assert.doesNotMatch(html, /<form\b/i, "Do not introduce a signup form in the visual launch");
  for (const path of ["assets/css/base.css", "assets/css/theme.css"]) assert.ok(bytes(path).length > 0, path);
});

test("artist identity schema retains its stable public photograph URL", () => {
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(json, "Missing structured data");
  const graph = JSON.parse(json)["@graph"];
  const person = graph.find((item) => item["@type"] === "Person");
  assert.equal(person.name, "PRXD.JAY");
  assert.equal(person.image, identityUrl);
  assert.equal(graph.find((item) => item["@type"] === "MusicAlbum").url, album);
});

test("retained identity portrait bytes are unchanged when present in the checkout", {
  // The launch staging directory contains changed files plus selected old files;
  // a full Git checkout includes this existing, unchanged portrait.
  skip: existsSync(new URL(identityPath, root)) ? false : "Retained remote portrait is absent from the partial launch staging directory",
}, () => {
  assert.equal(gitHash(identityPath), "4b05684da072ad4cd788703d1e23f5d989f8cd4e");
});

test("music, artist, contact, and social destinations retain verified identifiers", () => {
  const hrefs = new Set(values("href"));
  for (const href of [
    album,
    "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip",
    "https://music.apple.com/us/artist/prxd-jay/1418723888",
    "https://www.youtube.com/@PrxdJayNY",
    "https://instagram.com/prxd.jay",
    "https://www.tiktok.com/@prxd.jay",
    "mailto:prxd.jay@gmail.com",
  ]) assert.ok(hrefs.has(href), `Missing official destination: ${href}`);
  for (const tag of tags.filter((tag) => /\bjs-play\b/.test(attr(tag, "class") || ""))) {
    assert.equal(attr(tag, "href"), album, "Every play link must retain a functional Spotify fallback");
  }
});

test("video card IDs match their direct links and known official videos", () => {
  const expected = new Set(["tE0BXfeUcWo", "zkoz1tAjeEA", "Se1q1ejP65g", "rACq2a4tj2c", "j02TnPuogJU"]);
  const found = new Set();
  for (const tag of tags.filter((tag) => /\bjs-video\b/.test(attr(tag, "class") || ""))) {
    const id = attr(tag, "data-id");
    assert.ok(expected.has(id), `Unexpected video: ${id}`);
    assert.equal(attr(tag, "href"), `https://www.youtube.com/watch?v=${id}`);
    assert.ok(attr(tag, "data-title"));
    found.add(id);
  }
  assert.deepEqual(found, expected);
  assert.match(js, /id:\s*"toomany",\s*title:\s*"TOO MANY",\s*video:\s*"e7SS51HBa5c"/);
});

test("players are click-created, named, and configured without autoplay", () => {
  assert.doesNotMatch(html, /<iframe\b|<audio\b/i);
  assert.match(js, /https:\/\/open\.spotify\.com\/embed\/album\/7reVqpxCzqE0df6fGIobVw\?utm_source=generator&theme=0/);
  assert.match(js, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
  assert.doesNotMatch(js, /[?&]autoplay=1/);
  assert.match(js, /f\.title = "Spotify player: PRXDIGY VXL\.1"/);
  assert.match(js, /f\.title = "YouTube video: "/);
  assert.match(js, /modal\.addEventListener\("close",\s*\(\) => \{ frame\.replaceChildren\(\)/);
  for (const tag of tags.filter((tag) => /^<video\b/i.test(tag))) {
    assert.match(tag, /\bmuted\b/);
    assert.match(tag, /\bplaysinline\b/);
    assert.match(tag, /aria-hidden="true"/);
  }
});

test("reel playback uses original local MP4 paths and approved WebM alternatives", () => {
  assert.match(js, /FMT === "mp4" \? "\/assets\/img\/clips\/" : "\/assets\/artist\/clips\/"/);
  assert.doesNotMatch(`${html}\n${css}\n${js}`, /data:[^;]+;base64,|URL\.createObjectURL|id="clip-[^"]+"/);
  assert.ok(Buffer.byteLength(html) < 50_000, "Do not restore the multi-megabyte embedded mockup");
});

test("reel interruption and player keyboard-access fixes remain in the source", () => {
  assert.match(js, /else\s*\{\s*vids\.forEach\(v => v\.pause\(\)\);\s*\}/);
  assert.match(js, /front = 1 - front;\s*fading = false;\s*sync\(\);/);
  assert.match(js, /\$\("#dockClose"\)\.focus\(\{ preventScroll: true \}\)/);
  assert.match(js, /dockTrigger\.focus\(\{ preventScroll: true \}\)/);
  assert.match(js, /let reduced = mqReduce\.matches/);
  assert.match(js, /userPaused = reduced/);
  assert.match(js, /if \(reduced \|\| !FMT\) return/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:reduce\)/);
});

test("active JavaScript and every inline executable script parse successfully", () => {
  assert.doesNotThrow(() => new vm.Script(js, { filename: fileURLToPath(new URL("assets/js/artist.js", root)) }));
  for (const [, attributes, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=|application\/ld\+json/.test(attributes)) continue;
    assert.doesNotThrow(() => new vm.Script(content, { filename: "index.html inline script" }));
  }
});
