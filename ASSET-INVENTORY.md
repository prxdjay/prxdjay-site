# PRXD.JAY — OFFICIAL ASSET INVENTORY

Compiled 2026-08-11. **Only artist-owned / platform-provided sources.** No fan uploads, no stock, no unverified accounts.

**Status: the site is fully populated. Nothing on it is a placeholder.**

> **Updated 11 Aug 2026.** Three silent hero loops were cut from the WRIST and
> SPONSORED videos and are now self-hosted at `assets/img/clips/`. A10TN was
> removed from the photo grid (too old to be representing him); the video
> itself is still listed under VIDEOS. The bio was rewritten — see the note at
> the bottom of this file.

---

## ✅ VERIFIED OFFICIAL PROFILES

| Platform | Handle | URL | Verified by |
|---|---|---|---|
| Spotify | Prxd. Jay | `open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip` | 22.5K monthly listeners, © PRXDIGYLLC |
| Apple Music | Prxd. Jay | `music.apple.com/us/artist/prxd-jay/1418723888` | Matching catalog |
| YouTube | @PrxdJayNY | `youtube.com/@PrxdJayNY` | Channel "Prxd. Jay", about = PRXDIGY |
| Instagram | @prxd.jay | `instagram.com/prxd.jay` | **Linked from your Spotify profile** |
| X | @prxdjay | `twitter.com/prxdjay` | **Linked from your Spotify profile** |
| TikTok | @prxd.jay | `tiktok.com/@prxd.jay` | Handle match |
| TrakTrain | prxdjay | `traktrain.com/prxdjay` | Producer beat store |

**Rights holder:** © / ℗ PRXDIGYLLC

---

## ✅ VIDEOS — 6 LIVE ON THE SITE

Every ID below was confirmed via YouTube's oEmbed API as an upload on **@PrxdJayNY**. No reuploads, no fan channels.

| Title | Type | ID |
|---|---|---|
| WRIST | Official music video (2025) | `tE0BXfeUcWo` |
| Sponsored (w/ Kayeandre) | Official music video (2024) | `zkoz1tAjeEA` |
| Find You (w/ Kayeandre) | Official music video (2024) | `Se1q1ejP65g` |
| P4RTY (ft. JDE) | Official visualiser (2025) | `rACq2a4tj2c` |
| DNT TRN ME UP | Official video | `j02TnPuogJU` |
| A10TN | Official visualizer | `79s0B8S2a5o` |

**Not included** (feature on another artist's channel, so it belongs to them): `Sabotage (feat. Prxd. Jay)` — `ukfm9XycjOI`. Add it if you want.

Videos never load or play until a visitor taps play.

---

## ✅ MUSIC — 11 RELEASES LIVE, ALL WITH REAL COVER ART

| Release | Type | Year | Album ID |
|---|---|---|---|
| **PRXDIGY VXL.1** (featured) | EP | 2025-07-14 | `7reVqpxCzqE0df6fGIobVw` |
| 2U | Single | 2025-06-18 | `5uw8wfkXSvWKKfURGsXoti` |
| TOO MANY | Single | 2025-03-25 | `7umTdiUx0Pmdcmodk4qgHf` |
| P4RTY (ft. JDE) | Single | 2025-02-18 | `68TWroQpfsoPod9qlzm8az` |
| Sorry You Feel That Way | EP (6 trk) | 2024-08-28 | `43M4MemZfW5zijlSPaOmKF` |
| lost | Single | 2024-05-29 | `1rnzBT6kveAE4Cxn5hlDD8` |
| Leave You Behind | w/ Kayeandre | 2024-05-28 | `0oU4MmtvCWQKrLQaemf1Hd` |
| too much | Single | 2024-04-26 | `2SjlCp1mAPlmLMn2dddqVI` |
| Amazin' | Single | 2024-04-03 | `7xQE57zjyum0NL1Vk2zOee` |
| find a way | Single | 2024-01-24 | `3UuKyc7XauNfZLhufwKqZt` |
| DNT TRN ME UP | Single | 2023-07-28 | `6kKxvUe5GKSv6aH4iWaFhY` |

**VXL.1 tracklist:** PRAY · UPSET · WRIST · FANTASIZE · 9 to 5 (FREESTYLE)

**Note on "Leave You Behind"** — your biggest number (533K streams) but it's released under **Kayeandre x Boost Collective**, with you featured. It's labeled `w/ Kayeandre` on the site so the credit is accurate.

---

## ✅ IMAGES — LIVE, BUT WORTH SELF-HOSTING

| Where | Source | Type |
|---|---|---|
| Hero + bio portrait | `i.scdn.co/image/ab6761610000e5eb1fba8e84e5fb261305dcba7f` | Your own Spotify artist photo |
| 11 album covers | `i.scdn.co/image/...` | Your own cover art |
| 6 gallery images | `i.ytimg.com/vi/{ID}/maxresdefault.jpg` | Stills from your own official videos |

### ⚠ The one thing worth doing (10 minutes)

These load from Spotify/YouTube CDNs. **They work right now**, but those URLs can rotate without warning, and third-party images are slower than self-hosted ones.

To self-host:

1. Open each URL above in a browser → right-click → Save Image As
2. Save into `assets/img/` (hero.jpg, bio.jpg) and `assets/img/gallery/` (01–06.jpg)
3. In `era.config.js`, swap the long `https://i.scdn.co/...` string for `assets/img/hero.jpg` etc.

Nothing else changes. If a file is ever missing, the framework renders a clean labeled placeholder instead of a broken icon.

### ✅ SELF-HOSTED NOW — hero clips

| File | Source | Cut from | Length | Size | Look |
|---|---|---|---|---|---|
| `assets/img/clips/wrist.mp4` | WRIST | 2:00.4 | 1.8s | 131 KB | UV blue — the thumbnail shot, all five |
| `assets/img/clips/sponsored.mp4` | SPONSORED | 0:20 | 6s | 382 KB | High-contrast black & white |
| `assets/img/clips/findyou.mp4` | FIND YOU | 1:08 | 6s | 385 KB | Warm orange |
| `assets/img/clips/toomany.mp4` | TOO MANY (visualizer) | 2:07.9 | 2.2s | 473 KB | Purple, Times Square |

Silent, looping, 1152px wide, H.264. **The order in `era.config.js` alternates
the palette on purpose** — blue, black & white, a photo, orange, purple. Four
clips of the same colour would read as one long shot instead of five.

Only the clip currently on screen is downloaded (the next is fetched while the
current one plays), so the landing screen costs about 130 KB up front, not 1.4 MB.

The WRIST and TOO MANY cuts are short because the edit cuts away — both are
near-static shots, so the loop doesn't announce itself. **Not used:** A10TN
(too old) and P4RTY. The two source videos have several other usable moments if
you want different ones.

**To swap one:** drop a new `.mp4` into that folder and point at it in
`era.config.js` → `hero.slides`. Photos and clips can be mixed freely in that
list — anything ending `.mp4`/`.webm` plays as silent video, anything else
renders as a still.

### Still worth shooting / making

- **`assets/img/share.jpg` — 1200×630.** What shows when someone texts your link.
  Currently falls back to the square Spotify photo, which works but isn't ideal.
  **Open `tools/og-image.html`, click Download, save it here.** Ten seconds.
- **Real era photos.** The photo grid still uses video stills. Good stopgap, not
  a substitute for a shoot.
- **A full-screen hero loop.** One 10–15s cut at `assets/img/hero-loop.mp4` and
  `hero.video` replaces the whole slideshow. Best version of the landing screen.
- `assets/img/apple-touch-icon.png` — 180×180. The `<link>` for it in
  `index.html` is commented out until the file exists.

---

## ❌ EXCLUDED ON PURPOSE

- `linktr.ee/prod.jay` — different artist ("prod. jay"), not you
- Any fan upload, reupload channel, or lyric-video account
- Stock photography of any kind
- Covers of releases where you're only a feature on someone else's project (except Leave You Behind, which is clearly credited)

---

## OFFICIAL BIO (verbatim from your Spotify artist profile)

> Prxd. Jay (pronounced prodigy) is an R&B Singer, Song writer, Music Producer and Audio Engineer from Long Island New York. Although it is difficult to put creativity in a box, Jay's ability to be unique in combination with the high levels of production quality leads to an easy listen that appeals to the ears and souls of many. Jay showcases his artistry in a way that can be embraced by almost any listener. With sounds that mirror R&B, neo soul, pop and hip hop — there is no reason to say Prxd. Jay isn't going to be one of the most influential artists of this generation.

**This is no longer what the site says**, and it's worth updating on Spotify to
match. The rewrite drops the job titles and the hometown, leads with the work
instead of the résumé, and treats PRXDIGY VXL.1 correctly as a rap project.

The live version is in `era.config.js` → `bio.body`, written to be pasted
straight into your Spotify bio and any press request. Your Spotify profile
still shows the old one above.
