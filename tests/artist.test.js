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
const designMotionJs = text("assets/js/design-motion.js");
const gsapJs = text("assets/vendor/gsap/gsap.min.js");
const scrollTriggerJs = text("assets/vendor/gsap/ScrollTrigger.min.js");
const signupJs = text("assets/js/signup.js");
const signupConfig = text("assets/js/signup-config.js");
const packageJson = JSON.parse(text("package.json"));
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
const ndaPreviewPath = "assets/releases/nda-first-half-preview.mp3";

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
  "assets/identity/prxdigy-x-original.png": "ff9dddee13bc55b49c08f8c7978c35db07ae5b68",
  "assets/releases/nda-cover-original.png": "0bedaec32dfa49ffa680240fdd0b731f5d76049c",
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
  assert.doesNotMatch(`${html}\n${css}\n${js}\n${signupJs}`, /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com|traktrain\.com)(?:[/:?#]|\b)/i);
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

test("legacy artist framework stays dormant while signup uses the verified Google endpoint", () => {
  assert.ok(!values("src").some((url) => /\/assets\/js\/(?:app|era\.config)\.js/.test(url)));
  assert.match(html, /<section class="updates sec" id="updates"[^>]* hidden>/);
  assert.equal(
    signupConfig.trim().match(/window\.PRXD_SIGNUP_ENDPOINT = "([^"]*)";/)?.[1],
    "https://script.google.com/macros/s/AKfycbx9bFln1He_pQo1q8bq9QGlor2pUlNIv1jmQsOj4t1jUM-nXnaV_B2F2PQgpOIB3Q39vQ/exec",
  );
  for (const path of ["assets/css/base.css", "assets/css/theme.css"]) assert.ok(bytes(path).length > 0, path);
});

test("NDA teaser uses the approved complete cover, confirmed date, and email-gated preview", () => {
  const teaser = html.match(/<section class="nda-release sec" id="nda"[\s\S]*?<\/section>/)?.[0];
  assert.ok(teaser, "Missing NDA release section");
  assert.match(teaser, /<h2[^>]*>NDA<\/h2>/);
  assert.match(teaser, /<time datetime="2026-10-23">Friday, October 23, 2026<\/time>/);
  assert.match(teaser, /src="\/assets\/releases\/nda-cover-original\.png"[^>]*width="1263" height="1263"/);
  const presave = teaser.match(/<a class="nda-release__link"[^>]*>/)?.[0];
  assert.ok(presave, "NDA cover must be the pre-save link");
  assert.match(presave, /href="https:\/\/distrokid\.com\/hyperfollow\/prxdjay\/nda\?ref=release"/);
  assert.match(presave, /target="_blank" rel="noopener"/);
  assert.match(presave, /aria-label="Pre-save NDA by PRXD\. Jay on DistroKid \(opens in a new tab\)"/);
  assert.match(teaser, /Tap or click the cover to pre-save\. No email required\./);
  assert.match(teaser, /Join the email list to hear the first half of NDA before October 23\./);
  assert.match(teaser, /id="ndaPreviewJoin"[^>]*>Join &amp; unlock preview<\/button>/);
  assert.match(teaser, /id="ndaPreviewPlayer" hidden/);
  const previewAudio = teaser.match(/<audio\b[^>]*id="ndaPreviewAudio"[^>]*>/)?.[0];
  assert.ok(previewAudio, "Missing gated NDA preview player");
  assert.match(previewAudio, /\bcontrols\b/);
  assert.match(previewAudio, /preload="none"/);
  assert.doesNotMatch(previewAudio, /\bsrc=|\bautoplay\b/);
  assert.equal((teaser.match(/distrokid\.com\/hyperfollow\/prxdjay\/nda/g) || []).length, 1);
  assert.doesNotMatch(teaser.match(/<div class="nda-preview"[\s\S]*?<\/div>\s*<\/div>/)?.[0] || "", /distrokid|pre-?save/i);
  assert.doesNotMatch(teaser, /October 26|October 27|early access|listen|stream/i);
  assert.match(css, /\.nda-release__frame img\{[^}]*object-fit:contain/);
});

test("space atmosphere is lightweight, pointer-responsive, and motion-safe", () => {
  assert.match(html, /<div class="atmosphere" id="atmosphere" aria-hidden="true">/);
  assert.equal((html.match(/class="atmosphere__(?:stars|cloud)/g) || []).length, 4);
  assert.doesNotMatch(html, /<canvas\b|three\.min\.js|world\.js/i);
  assert.match(css, /\.atmosphere\{[^}]*position:fixed[^}]*pointer-events:none[^}]*contain:strict/);
  assert.match(css, /\.atmosphere__stars--far\{[^}]*radial-gradient/);
  assert.match(css, /\.atmosphere__stars--near,.atmosphere__cloud--red\{display:none\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?\.atmosphere__stars,.atmosphere__cloud\{transform:none!important;will-change:auto\}/);
  assert.match(js, /matchMedia\("\(pointer: fine\)"\)/);
  assert.match(js, /addEventListener\("pointermove"[\s\S]*?event\.pointerType === "touch"/);
  assert.match(js, /requestAnimationFrame\(\(\) => \{[\s\S]*?--space-near-x/);
  assert.match(js, /if \(reduced\) \{ clearAtmosphereMotion\(\);/);
});

test("editorial motion uses local licensed GSAP with static and reduced-motion fallbacks", () => {
  assert.match(html, /src="\/assets\/vendor\/gsap\/gsap\.min\.js\?v=3\.13\.0" defer/);
  assert.match(html, /src="\/assets\/vendor\/gsap\/ScrollTrigger\.min\.js\?v=3\.13\.0" defer/);
  assert.match(html, /src="\/assets\/js\/design-motion\.js\?v=1" defer/);
  assert.equal(packageJson.devDependencies.gsap, "^3.13.0");
  assert.match(gsapJs.slice(0, 350), /GSAP 3\.13\.0[\s\S]*@license Copyright 2025, GreenSock[\s\S]*gsap\.com\/standard-license/);
  assert.match(scrollTriggerJs.slice(0, 380), /ScrollTrigger 3\.13\.0[\s\S]*@license Copyright 2025, GreenSock[\s\S]*gsap\.com\/standard-license/);
  assert.match(designMotionJs, /if \(reduced\.matches \|\| !gsap \|\| !ScrollTrigger\) return/);
  assert.match(designMotionJs, /gsap\.registerPlugin\(ScrollTrigger\)/);
  assert.match(designMotionJs, /heroImage[\s\S]*clipPath: "polygon\(0 0, 0 0, 0 100%, 0 100%\)"/);
  assert.match(designMotionJs, /releaseArt[\s\S]*ScrollTrigger/);
  assert.match(designMotionJs, /revealGroup\("\.videos"[\s\S]*revealGroup\("\.follow"/);
  assert.match(designMotionJs, /clearProps: "opacity,visibility,transform,clipPath,filter"/);
  assert.doesNotMatch(`${html}\n${designMotionJs}`, /Lenis|VANTA|ReactBits|react-bits/i);
  assert.match(css, /\.op-name\{[^}]*white-space:nowrap/);
  assert.match(css, /\.gsap-enhanced \.op-portrait img/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)[\s\S]*?\.op-portrait img,\.nda-release__frame\{clip-path:none!important/);
});

test("signup is email-only, explicit, private by design, and has a removal route", () => {
  assert.match(html, /<input id="signupEmail" name="email" type="email"[^>]* required>/);
  assert.doesNotMatch(html, /name="(?:name|phone|payment|card)"/i);
  assert.match(html, /Get release updates/i);
  assert.match(html, /Free to join/i);
  assert.doesNotMatch(html, /paid subscription|charge/i);
  assert.match(html, /name="consent_token"[^>]*value="release-updates-v1"/);
  assert.match(html, /\/privacy\.html#email-list/);
  assert.match(text("privacy.html"), /private Google Sheet/i);
  assert.match(text("privacy.html"), /Remove%20me%20from%20PRXD\.JAY%20email%20updates/i);
  assert.doesNotMatch(`${text("privacy.html")}\n${text("terms.html")}`, /\b(?:TrakTrain|X)\b/);
});

test("first-visit signup panel is compact, non-modal, and dismissible", () => {
  const prompt = html.match(/<aside class="signup-prompt"[\s\S]*?<\/aside>/)?.[0];
  assert.ok(prompt, "Missing signup prompt panel");
  assert.match(prompt, /aria-labelledby="signupPromptTitle"/);
  assert.match(prompt, /aria-describedby="signupPromptDescription"/);
  assert.match(prompt, /\bhidden\b/);
  assert.match(prompt, /id="signupPromptClose"[^>]*aria-label="Collapse email signup"/);
  assert.match(prompt, /id="promptSignupForm"[^>]*data-signup-form/);
  assert.match(prompt, /type="email"[^>]*required/);
  assert.match(prompt, /Join to unlock the first half of NDA before October 23/);
  assert.match(html, /id="signupPromptOpen"[^>]*aria-controls="signupPrompt"[^>]*aria-expanded="false"/);
  assert.doesNotMatch(html, /<dialog class="signup-prompt"/);
  assert.match(signupJs, /7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(signupJs, /localStorage\.setItem\(dismissalKey/);
  assert.match(signupJs, /prompt\.hidden = false/);
  assert.match(signupJs, /prompt\.addEventListener\("keydown"/);
  assert.match(signupJs, /\[data-jump="follow"\][\s\S]*?closePrompt\(false, false\)/);
  assert.match(signupJs, /location\.hash !== "#follow"/);
  assert.doesNotMatch(signupJs, /showModal|\.close\(\)/);
  assert.doesNotMatch(css, /\.signup-prompt::backdrop/);
  assert.match(css, /\.signup-prompt\{[^}]*width:min\(360px/);
  assert.match(css, /@media \(max-width:759px\)[\s\S]*?\.signup-prompt\{[^}]*top:calc\(var\(--ft\) \+ var\(--navH\) \+ 8px\)[^}]*width:min\(340px/);
});

test("NDA preview unlock is fail-closed, signup-gated, and never autoplayed", () => {
  assert.match(signupJs, /ndaPreviewSource = "\/assets\/releases\/nda-first-half-preview\.mp3"/);
  assert.match(signupJs, /ndaPreviewMaximum = 97\.2975/);
  assert.match(signupJs, /if \(!Number\.isFinite\(ndaPreviewAudio\.duration\) \|\| ndaPreviewAudio\.duration > ndaPreviewMaximum\)/);
  assert.match(signupJs, /case "saved":[\s\S]*?case "resubscribed":[\s\S]*?unlockNdaPreview\(true\)/);
  assert.match(signupJs, /case "duplicate":[\s\S]*?unlockNdaPreview\(true\)/);
  assert.doesNotMatch(signupJs.match(/case "invalid":[\s\S]*?case "error":/)?.[0] || "", /unlockNdaPreview/);
  assert.doesNotMatch(signupJs.match(/case "error":[\s\S]*?default:/)?.[0] || "", /unlockNdaPreview/);
  assert.doesNotMatch(signupJs, /\.play\s*\(/);
  assert.match(signupJs, /localStorage\.setItem\(ndaUnlockKey, "1"\)/);
});

test("NDA preview asset has the approved truncated bytes when present", {
  skip: existsSync(new URL(ndaPreviewPath, root)) ? false : "Approved Library preview has not been materialized",
}, () => {
  const preview = bytes(ndaPreviewPath);
  assert.equal(preview.length, 3_106_351);
  assert.equal(createHash("sha256").update(preview).digest("hex"), "5051d37a5d3afc64592122e47979b89c2069c2c4498c1dd3a0a4cea8cc13f6d2");
  assert.equal(preview.subarray(0, 3).toString(), "ID3");
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

test("Follow me fast travel contains only the five verified current destinations", () => {
  const follow = html.match(/<section class="follow sec" id="follow"[\s\S]*?<\/section>/)?.[0];
  assert.ok(follow, "Missing Follow me quick-links section");
  assert.match(follow, /<h2[^>]*id="follow-title"[^>]*>Follow me<\/h2>/);
  const hrefs = [...follow.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, [
    "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip",
    "https://music.apple.com/us/artist/prxd-jay/1418723888",
    "https://www.youtube.com/@PrxdJayNY",
    "https://instagram.com/prxd.jay",
    "https://www.tiktok.com/@prxd.jay",
  ]);
  assert.match(html, /class="nav-follow" href="#follow" data-jump="follow">Follow me<\/a>/);
  assert.doesNotMatch(follow, /(?:twitter\.com|x\.com|traktrain|snapchat|discord|pre-?save)/i);
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
  const audioTags = tags.filter((tag) => /^<audio\b/i.test(tag));
  assert.equal(audioTags.length, 1);
  assert.match(audioTags[0], /id="ndaPreviewAudio"/);
  assert.doesNotMatch(audioTags[0], /\bautoplay\b|\bsrc=/);
  const staticIframes = [...html.matchAll(/<iframe\b[^>]*>/gi)].map(([tag]) => tag);
  assert.equal(staticIframes.length, 1);
  assert.match(staticIframes[0], /class="signup__result-frame"/);
  assert.match(staticIframes[0], /\bhidden\b/);
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
  for (const path of ["assets/js/design-motion.js", "assets/js/signup-config.js", "assets/js/signup.js", "assets/js/signup-result.js"]) {
    assert.doesNotThrow(() => new vm.Script(text(path), { filename: fileURLToPath(new URL(path, root)) }));
  }
  assert.match(text("assets/js/signup-result.js"), /window\.top\.postMessage/);
  assert.doesNotMatch(text("assets/js/signup-result.js"), /window\.parent\.postMessage/);
  for (const [, attributes, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=|application\/ld\+json/.test(attributes)) continue;
    assert.doesNotThrow(() => new vm.Script(content, { filename: "index.html inline script" }));
  }
});
