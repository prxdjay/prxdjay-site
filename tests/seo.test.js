import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

// Offline SEO regression checks. Live HTTP status, response headers, search
// indexing, social previews, and browser rendering still need release QA.
const root = new URL("../", import.meta.url);
const site = "https://prxdjay.com";
const artistId = `${site}/#artist`;
const albumId = `${site}/#prxdigy-vxl1`;
const albumUrl = "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw";
const identityUrl = `${site}/assets/identity/prxd-jay-artist-photo.jpg`;
const read = (path) => readFileSync(new URL(path, root), "utf8");
const pages = new Map(["index.html", "photos.html"].map((path) => [path, read(path)]));
const sitemap = read("sitemap.xml");
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([, key, double, single]) => [key.toLowerCase(), decode(double ?? single)]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(([tag]) => attrs(tag));
const links = (html) => tags(html, "a").map((tag) => tag.href).filter(Boolean);
const visibleText = (html) => decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
const metadata = (html, key) => tags(html, "meta").find((tag) => tag.property === key || tag.name === key)?.content;
const graph = (html) => {
  const script = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(([, attributes]) => attrs(attributes).type === "application/ld+json");
  assert.ok(script, "Missing JSON-LD script");
  const data = JSON.parse(script[2]);
  assert.equal(data["@context"], "https://schema.org");
  assert.ok(Array.isArray(data["@graph"]), "Expected a JSON-LD graph");
  return data["@graph"];
};
const person = (html) => {
  const people = graph(html).filter((node) => node["@type"] === "Person");
  assert.equal(people.length, 1, "Artist must have a single Person identity");
  return people[0];
};
const localPath = (url) => {
  const parsed = new URL(url, site);
  assert.equal(parsed.origin, site, `Expected a first-party asset: ${url}`);
  return parsed.pathname.slice(1);
};
const imageSize = (path) => {
  const bytes = readFileSync(new URL(path, root));
  if (bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), type: "image/png" };
  }
  assert.equal(bytes.subarray(0, 2).toString("hex"), "ffd8", `Unsupported image format: ${path}`);
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 8 < bytes.length) {
    assert.equal(bytes[offset], 0xff, `Invalid JPEG marker: ${path}`);
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
    const length = bytes.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= bytes.length, `Invalid JPEG segment: ${path}`);
    if (startOfFrame.has(marker)) return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3), type: "image/jpeg" };
    offset += length;
  }
  assert.fail(`JPEG dimensions not found: ${path}`);
};

// Names and IDs are from the verified Spotify PRXDIGY VXL.1 album response.
const expectedTracks = [
  ["PRAY", "0P2KocOh7xPk2Zxo8OwIm8"],
  ["UPSET", "1PhiLZuRfntLzW9PS6ZQSO"],
  ["WRIST", "3ryxAVbC9DxEZExqQ3iD9z"],
  ["FANTASIZE", "39TWjROfUpsNxXDEUnqX3o"],
  ["9 to 5 (FREESTYLE)", "4c7LRfelqA5FH9BCqUcVlp"],
].map(([name, id]) => ({ name, url: `https://open.spotify.com/track/${id}` }));
const expectedProfiles = [
  "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip",
  "https://music.apple.com/us/artist/prxd-jay/1418723888",
  "https://www.youtube.com/@PrxdJayNY",
  "https://music.youtube.com/channel/UCBg1SZoBGV_fCrmEQqM98Ig",
  "https://soundcloud.com/prxdjay",
  "https://instagram.com/prxd.jay",
  "https://www.tiktok.com/@prxd.jay",
];
const requiredPhotos = [
  { path: "assets/photos/prxd-jay-concrete-original.png", width: 2048, height: 878, type: "image/png", subject: /concrete/i },
  { path: "assets/artist/photos/fence_grain-6.3pct.jpg", width: 2000, height: 662, type: "image/jpeg", subject: /fence/i },
];
// SHA-256 fingerprints were derived from the selected, approved V1–V4 PNGs.
// Keep these portable: the review workspace is not a test runtime dependency.
const approvedStills = [
  {
    path: "assets/photos/prxd-jay-sponsored-car-still.png",
    sha256: "781a1fed7b9f2e78dc52deedc3e9eba0ebcdd7e6713f1fab8200056a4fcbb3aa",
    width: 1152, height: 648, title: "SPONSORED", scene: "black-and-white car scene",
    sourceClip: `${site}/assets/img/clips/sponsored.mp4`,
  },
  {
    path: "assets/photos/prxd-jay-find-you-spotlight-still.png",
    sha256: "4693bc35b1092e102eef76826776247fd4d2abdb2a6ee4b693f0467cd39349f5",
    width: 1152, height: 768, title: "FIND YOU", scene: "green spotlight scene",
    sourceClip: `${site}/assets/img/clips/findyou.mp4`,
  },
  {
    path: "assets/photos/prxd-jay-find-you-car-still.png",
    sha256: "8df511a12c62912e79f04861cc8e79a2d2aae4ca3657b2617539241b5bd69c02",
    width: 1152, height: 768, title: "FIND YOU", scene: "green-lit car scene",
    sourceClip: `${site}/assets/img/clips/findyou.mp4`,
  },
  {
    path: "assets/photos/prxd-jay-too-many-reflections-still.png",
    sha256: "dd29bab25a7d4ea22563a16517ca9caf9b7758214d1f5a5c9013bd95f766dbbf",
    width: 1152, height: 648, title: "TOO MANY", scene: "purple city reflections",
    sourceClip: `${site}/assets/img/clips/toomany.mp4`,
  },
];

test("SEO: approved public name, roles and birth year are visible without invented age or birth date", () => {
  const photos = pages.get("photos.html");
  const body = visibleText(photos.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "");
  assert.match(body, /Evangelio Irizarry Jr\./);
  assert.match(body, /singer,? rapper and songwriter/i);
  assert.match(body, /born in 2000\b/i);
  for (const [path, html] of pages) {
    const artist = person(html);
    assert.equal(artist.name, "PRXD.JAY", path);
    assert.ok(artist.alternateName.includes("Evangelio Irizarry Jr."), path);
    assert.equal(artist.givenName, "Evangelio", path);
    assert.equal(artist.familyName, "Irizarry", path);
    assert.equal(artist.honorificSuffix, "Jr.", path);
    assert.deepEqual(new Set(artist.jobTitle), new Set(["Singer", "Rapper", "Songwriter"]), path);
    assert.match(artist.description, /born in 2000\b/i, path);
    assert.ok(!Object.hasOwn(artist, "birthDate"), `${path}: keep birth year in prose only`);
    assert.ok(!Object.hasOwn(artist, "age"), `${path}: do not publish a fixed age`);
    assert.doesNotMatch(html, /\b2000[-/]\d{1,2}(?:[-/]\d{1,2})?\b|\b\d{1,2}[-/]\d{1,2}[-/]2000\b/, path);
    assert.doesNotMatch(visibleText(html), /\b\d{1,3}[-\s]+years?[-\s]+old\b|\bage(?:d)?\s*[:=]?\s*\d{1,3}\b/i, path);
  }
});

test("SEO: both pages retain the same Person identity and stable portrait URL", () => {
  for (const [path, html] of pages) {
    const artist = person(html);
    assert.equal(artist["@id"], artistId, path);
    assert.equal(artist.url, `${site}/`, path);
    assert.equal(artist.image, identityUrl, path);
    assert.ok(existsSync(new URL(localPath(artist.image), root)), path);
  }
});

test("SEO: sameAs contains verified official profiles and excludes removed accounts", () => {
  const visibleLinks = new Set(links(pages.get("photos.html")));
  for (const [path, html] of pages) {
    const profiles = person(html).sameAs;
    assert.ok(Array.isArray(profiles), path);
    assert.equal(profiles.length, new Set(profiles).size, `${path}: duplicate sameAs URLs`);
    assert.deepEqual(new Set(profiles), new Set(expectedProfiles), `${path}: review any profile change before updating this fixture`);
    for (const url of profiles) {
      assert.equal(new URL(url).search, "", `${path}: profile URL must be canonical`);
      assert.doesNotMatch(new URL(url).hostname, /^(?:www\.)?(?:twitter\.com|x\.com|traktrain\.com)$/i, path);
      assert.ok(visibleLinks.has(url), `Official profile should have a visible link: ${url}`);
    }
  }
});

test("SEO: EP schema contains exactly the five released tracks with canonical Spotify identities", () => {
  for (const [path, html] of pages) {
    const albums = graph(html).filter((node) => node["@type"] === "MusicAlbum");
    assert.equal(albums.length, 1, path);
    const album = albums[0];
    assert.equal(album["@id"], albumId, path);
    assert.equal(album.name, "PRXDIGY VXL.1", path);
    assert.equal(album.url, albumUrl, path);
    assert.equal(album.albumReleaseType, "https://schema.org/EPRelease", path);
    assert.equal(album.numTracks, 5, path);
    assert.equal(album.byArtist["@id"], artistId, path);
    const tracks = Array.isArray(album.track) ? album.track : album.track?.itemListElement?.map((entry) => entry.item);
    assert.ok(Array.isArray(tracks), `${path}: missing track list`);
    assert.deepEqual(tracks.map(({ name, url }) => ({ name, url })), expectedTracks, path);
    for (const track of tracks) {
      assert.equal(track["@type"], "MusicRecording", path);
      assert.equal(track["@id"], track.url, `${path}: canonical track identity`);
      assert.equal(new URL(track.url).search, "", `${path}: remove generated tracking parameters`);
      assert.equal(track.byArtist["@id"], artistId, path);
      assert.equal(track.inAlbum["@id"], albumId, path);
    }
  }
});

test("SEO: all five verified recordings have visible canonical links on the profile page", () => {
  const html = pages.get("photos.html");
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(([, attributes, content]) => ({ ...attrs(attributes), text: visibleText(content) }));
  for (const track of expectedTracks) {
    const anchor = anchors.find(({ href }) => href === track.url);
    assert.ok(anchor, `Missing canonical visible track link: ${track.name}`);
    assert.ok(anchor.text.includes(track.name), `Wrong label for ${track.url}`);
  }
  for (const href of links(html).filter((url) => url.startsWith("https://open.spotify.com/track/"))) {
    assert.ok(expectedTracks.some(({ url }) => url === href), `Unexpected or tracked EP link: ${href}`);
  }
});

test("SEO: profile page and homepage are indexable, canonical and linked together", () => {
  for (const [path, html] of pages) {
    const canonical = path === "index.html" ? `${site}/` : `${site}/photos.html`;
    assert.deepEqual(tags(html, "link").filter(({ rel }) => rel === "canonical").map(({ href }) => href), [canonical]);
    assert.match(metadata(html, "robots") ?? "", /\bindex\b/);
    assert.match(metadata(html, "robots") ?? "", /\bfollow\b/);
    assert.match(metadata(html, "robots") ?? "", /max-image-preview:large/);
    assert.doesNotMatch(metadata(html, "robots") ?? "", /noindex|nofollow|noimageindex/i);
    assert.equal(metadata(html, "og:url"), canonical);
  }
  assert.ok(links(pages.get("index.html")).includes("/photos.html"));
  assert.ok(links(pages.get("photos.html")).includes("/"));
  const robots = read("robots.txt");
  assert.match(robots, /Sitemap:\s*https:\/\/prxdjay\.com\/sitemap\.xml/i);
  for (const [, rule] of robots.matchAll(/^Disallow:\s*(\S*)/gmi)) {
    if (!rule) continue;
    assert.ok(rule !== "/" && !["/photos.html", ...requiredPhotos.map(({ path }) => `/${path}`)].some((path) => path.startsWith(rule)), `robots.txt blocks required public content: ${rule}`);
  }
});

test("SEO: approved PRXDIGY X card is used consistently for share metadata and site icons", () => {
  const sharePath = "assets/img/prxdjay-share.png";
  const shareUrl = `${site}/${sharePath}`;
  assert.deepEqual(imageSize(sharePath), { width: 1200, height: 630, type: "image/png" });
  assert.equal(
    createHash("sha256").update(readFileSync(new URL("assets/identity/prxdigy-x-original.png", root))).digest("hex"),
    "bdaa98337b28cf31fbea66f378a6a7a6565ffc16ad4eec6231b99851fcf3b793",
  );
  for (const [path, html] of pages) {
    assert.equal(metadata(html, "og:image"), shareUrl, path);
    assert.equal(metadata(html, "og:image:secure_url"), shareUrl, path);
    assert.equal(metadata(html, "twitter:image"), shareUrl, path);
    assert.equal(metadata(html, "og:image:type"), "image/png", path);
    assert.equal(Number(metadata(html, "og:image:width")), 1200, path);
    assert.equal(Number(metadata(html, "og:image:height")), 630, path);
    assert.match(metadata(html, "og:image:alt") ?? "", /PRXDIGY X logo/i, path);
    assert.match(metadata(html, "twitter:image:alt") ?? "", /PRXDIGY X logo/i, path);
    const icon = tags(html, "link").find((tag) => tag.rel === "icon");
    assert.deepEqual(icon, { rel: "icon", href: "/assets/img/prxdigy-x-icon-64.png", type: "image/png", sizes: "64x64" }, path);
    assert.ok(tags(html, "link").some((tag) => tag.rel === "apple-touch-icon" && tag.href === "/assets/img/apple-touch-icon.png"), path);
    assert.ok(tags(html, "link").some((tag) => tag.rel === "manifest" && tag.href === "/site.webmanifest"), path);
  }
  for (const [asset, width, height] of [
    ["assets/img/prxdigy-x-icon-64.png", 64, 64],
    ["assets/img/prxdigy-x-icon-192.png", 192, 192],
    ["assets/img/prxdigy-x-icon-512.png", 512, 512],
    ["assets/img/apple-touch-icon.png", 180, 180],
  ]) assert.deepEqual(imageSize(asset), { width, height, type: "image/png" });

  const manifest = JSON.parse(read("site.webmanifest"));
  assert.deepEqual(manifest.icons, [
    { src: "/assets/img/prxdigy-x-icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/assets/img/prxdigy-x-icon-512.png", sizes: "512x512", type: "image/png" },
  ]);
});

test("SEO: approved concrete and wide fence photos are ordinary images with correct dimensions and captions", () => {
  const html = pages.get("photos.html");
  const images = tags(html, "img");
  const figures = [...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)].map(([, content]) => content);
  const nodes = graph(html);
  const gallery = nodes.find((node) => node["@type"] === "ImageGallery");
  assert.ok(gallery, "Profile photos need an ImageGallery entity");
  assert.equal(gallery.about["@id"], artistId);
  for (const photo of requiredPhotos) {
    const src = `/${photo.path}`;
    const image = images.find((item) => item.src === src);
    assert.ok(image, `Missing normal img element for ${src}`);
    assert.equal(Number(image.width), photo.width, src);
    assert.equal(Number(image.height), photo.height, src);
    assert.match(image.alt ?? "", /PRXD\.?\s?JAY/i, src);
    assert.match(image.alt ?? "", photo.subject, src);
    assert.notEqual(image["aria-hidden"], "true", src);
    assert.deepEqual(imageSize(photo.path), { width: photo.width, height: photo.height, type: photo.type }, src);
    const figure = figures.find((content) => tags(content, "img").some((item) => item.src === src));
    assert.ok(figure, `Missing figure for ${src}`);
    const caption = figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1];
    assert.ok(caption, `Missing visible figcaption for ${src}`);
    assert.match(visibleText(caption), photo.subject, src);
    assert.ok(links(figure).includes(src), `Missing full-size link for ${src}`);
    const imageNode = nodes.find((node) => node["@type"] === "ImageObject" && node.contentUrl === `${site}${src}`);
    assert.ok(imageNode, `Missing ImageObject for ${src}`);
    assert.equal(imageNode.width, photo.width, src);
    assert.equal(imageNode.height, photo.height, src);
    assert.equal(imageNode.encodingFormat, photo.type, src);
    assert.match(imageNode.caption ?? "", photo.subject, src);
    assert.equal(imageNode.about["@id"], artistId, src);
  }
  // Additional approved photos or video stills are allowed; no total-count lock.
});

test("SEO: sitemap includes the profile page and approved required images", () => {
  assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.match(sitemap, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  const entries = [...sitemap.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)].map(([, entry]) => entry);
  const profile = entries.find((entry) => entry.match(/<loc>(.*?)<\/loc>/)?.[1] === `${site}/photos.html`);
  assert.ok(profile, "Missing profile sitemap entry");
  const imageUrls = [...profile.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(([, url]) => decode(url));
  for (const photo of requiredPhotos) assert.ok(imageUrls.includes(`${site}/${photo.path}`), `Required gallery photo missing from sitemap: ${photo.path}`);
  for (const [, url] of sitemap.matchAll(/<image:loc>(.*?)<\/image:loc>/g)) {
    assert.ok(existsSync(new URL(localPath(decode(url)), root)), `Missing sitemap image: ${url}`);
  }
});

test("SEO: all four approved music-video stills retain exact bytes, native dimensions, scene captions and source links", () => {
  const html = pages.get("photos.html");
  const figures = [...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi)].map(([, content]) => content);
  const nodes = graph(html);
  const gallery = nodes.find((node) => node["@type"] === "ImageGallery");
  assert.ok(gallery, "Missing gallery schema");
  const entries = [...sitemap.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)].map(([, entry]) => entry);
  const entryFor = (url) => entries.find((entry) => entry.match(/<loc>(.*?)<\/loc>/)?.[1] === url);
  const profileEntry = entryFor(`${site}/photos.html`);
  assert.ok(profileEntry, "Missing profile sitemap entry");
  const sitemapImages = (entry) => [...(entry ?? "").matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(([, url]) => decode(url));
  const profileImages = sitemapImages(profileEntry);
  const homeImages = sitemapImages(entryFor(`${site}/`));

  for (const still of approvedStills) {
    const src = `/${still.path}`;
    const url = `${site}${src}`;
    const bytes = readFileSync(new URL(still.path, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), still.sha256, `Approved still bytes changed: ${src}`);
    assert.deepEqual(imageSize(still.path), { width: still.width, height: still.height, type: "image/png" }, src);
    const figure = figures.find((content) => tags(content, "img").some((image) => image.src === src));
    assert.ok(figure, `Missing normal image inside a figure: ${src}`);
    const image = tags(figure, "img").find((item) => item.src === src);
    assert.equal(Number(image.width), still.width, src);
    assert.equal(Number(image.height), still.height, src);
    assert.notEqual(image["aria-hidden"], "true", src);
    assert.equal(image.alt, `Still from ${still.title}: ${still.scene}.`, src);
    const caption = figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1];
    assert.ok(caption, `Missing scene caption for ${src}`);
    assert.ok(visibleText(caption).includes(still.title), src);
    assert.ok(visibleText(caption).toLowerCase().includes(still.scene), src);
    assert.ok(links(figure).includes(src), `Missing full-size still link: ${src}`);
    assert.ok(links(caption).includes(still.sourceClip), `Missing source clip link: ${src}`);
    assert.ok(existsSync(new URL(localPath(still.sourceClip), root)), `Missing source clip: ${still.sourceClip}`);

    const imageNode = nodes.find((node) => node["@type"] === "ImageObject" && node.contentUrl === url);
    assert.ok(imageNode, `Missing still ImageObject: ${src}`);
    assert.equal(imageNode.url, url, src);
    assert.equal(imageNode.width, still.width, src);
    assert.equal(imageNode.height, still.height, src);
    assert.equal(imageNode.encodingFormat, "image/png", src);
    assert.equal(imageNode.caption, image.alt, src);
    assert.equal(imageNode.isBasedOn, still.sourceClip, src);
    for (const property of ["image", "hasPart"]) {
      assert.ok(gallery[property]?.some((reference) => reference["@id"] === imageNode["@id"]), `Gallery ${property} must reference ${src}`);
    }
    assert.ok(profileImages.includes(url), `Still missing from profile image sitemap: ${src}`);
    if (homeImages.includes(url)) {
      assert.ok(pages.get("index.html").includes(src), `Homepage sitemap lists a still absent from the homepage: ${src}`);
    }
  }
});
