# PRXD.JAY — Official Site Framework

**pronounced Prodigy**

A permanent, era-swappable artist site. Static HTML/CSS/JS. No build step, no framework, no dependencies. Loads in under a second on a phone.

---

## THE ONE RULE

> **To launch a new era, you edit `assets/js/era.config.js` and swap the images. That's it.**

The framework files (`index.html`, `base.css`, `app.js`) stay untouched forever.

---

## FILE MAP

```
prxdjay-site/
├── index.html                  ← Page skeleton + all SEO/social metadata. Rarely touched.
├── privacy.html / terms.html   ← Required before you ever send a marketing text.
├── 404.html                    ← Dead links land here and get sent back.
├── CNAME                       ← Your custom domain for GitHub Pages.
├── site.webmanifest            ← Makes it installable as a phone app icon.
├── robots.txt / sitemap.xml    ← Search engine basics.
├── .nojekyll                   ← Tells GitHub Pages to serve files as-is.
├── ASSET-INVENTORY.md          ← Every verified official asset + what's still missing.
├── SETUP-THE-LIST.md           ← 🔴 READ THIS. Turns the signup form on.
├── DEPLOY.md                   ← Step-by-step GitHub + domain setup.
├── tools/
│   └── og-image.html           ← Makes the picture people see when your link is shared.
└── assets/
    ├── css/
    │   ├── theme.css           ← ⚡ ERA FILE. Colors, fonts, textures, spacing.
    │   ├── base.css            ← Permanent framework styles. Don't edit per era.
    │   ├── skin-win.css        ← The alternate RETRO view.
    │   └── color-themes.css    ← Color palettes for both views.
    ├── js/
    │   ├── era.config.js       ← ⚡⚡ THE ERA FILE. All content, links, copy.
    │   └── app.js              ← Permanent renderer. Don't edit per era.
    └── img/                    ← ⚡ ERA FOLDER. Swap photos here.
        ├── hero.jpg            (landing screen)
        ├── bio.jpg             (bio portrait)
        ├── share.jpg           (1200×630 social card — make it with tools/og-image.html)
        ├── clips/              (silent .mp4 loops for the landing screen — optional, best)
        ├── favicon.svg
        └── gallery/01–06.jpg
```

⚡ = swap per era. Everything else is permanent.

---

## ⚠ THE ONE THING THAT WILL BITE YOU

Every CSS and JS file in `index.html` ends in `?v=5`.

**Every time you edit `era.config.js` — or any css/js file — bump that number
by one in `index.html`.** There are six of them; change them all to `?v=6`,
then `?v=7`, and so on.

Skip it and anyone who's visited before keeps seeing the **old** site until
their browser decides to let go of it, which can take days. This is the single
most common way a static site update appears "not to work".

---

## HOW SOMEONE BECOMES A FAN

The site is built around one path, in this order:

1. **The door** — one screen, one button. Returning visitors get "welcome back".
2. **The landing screen** — two buttons only: play the record, or open the full link hub.
   Under them, one line for someone who's never heard him: *start with WRIST*.
3. **All Links → Music → Videos → Photos → About** — every nav label is the exact
   word of the section it lands on. No riddles.
4. **The payoff** — every official destination is one tap away, with music and
   video surfaced before the deeper artist story.

---

## WHAT'S IN THE BOX

| Section | What it does |
|---|---|
| **Landing** | Full-screen name, "pronounced Prodigy", hero image/video, ENTER curtain |
| **The Hub** | Custom link hub — your Linktree, but inside your world. Square-ready. |
| **The Artist** | Bio + pull quote + EPK stat strip + fact list |
| **Visuals** | Photo gallery with lightbox. Placeholders where photos are missing. |
| **In Motion** | YouTube videos — click-to-play only, never autoplay |
| **The Music** | Featured release + Spotify embed + full catalog grid |
| **Contact** | Direct email for features / placements / press |
| **Footer** | PRXD.JAY · All rights reserved |

---

## HOW TO LAUNCH A NEW ERA (15 minutes)

1. **Photos** — drop new images into `assets/img/` and `assets/img/gallery/`, same filenames. Done.
2. **Colors** — open `assets/css/theme.css`, change the values in `:root`. Two starter eras (`GOLD HOUR`, `COLD WAVE`) are commented at the bottom — uncomment one to test instantly.
3. **Content** — open `assets/js/era.config.js` and update:
   - `era` — id, name, year (shows in the header + menu)
   - `hero` — headline, kicker, hero image or looping video
   - `links.items` — reorder, add, or `hidden: true` to park a link
   - `music.featured` — new release title, cover, Spotify album ID
   - `video.items` — new YouTube IDs
   - `gallery.items` — new photo list
   - `bio` — updated copy and stats
4. **Push to GitHub.** Live in ~60 seconds.

### Quick reference: where do I find IDs?

| Need | Where |
|---|---|
| Spotify album ID | `open.spotify.com/album/`**`7reVqpxCzqE0df6fGIobVw`** |
| YouTube video ID | `youtube.com/watch?v=`**`dQw4w9WgXcQ`** |

---

## ADDING SQUARE LATER (booking / checkout)

Already wired. Two parked entries sit at the bottom of `links.items`. When your Square link is ready:

```js
{ type:"link", label:"BOOK PRXDIGY STUDIOS", note:"Sessions & mixing",
  url:"https://squareup.com/appointments/...", icon:"square", hidden:false }
```

Change `hidden: true` → `hidden: false`, paste the URL. No code changes.

---

## TURNING ON THE MAILING LIST (2 minutes, free)

The form works out of the box in fallback mode — it opens the visitor's email app addressed to you. To collect properly:

1. Go to **formspree.io** → sign up free → **New Form**
2. Copy the endpoint (looks like `https://formspree.io/f/abcdwxyz`)
3. In `era.config.js`, replace:
   ```js
   endpoint: "https://formspree.io/f/YOUR_FORM_ID"
   ```
4. Push. Submissions land in your inbox with name, email, phone, and consent.

Free tier = 50 submissions/month. Upgrade or swap to Mailchimp/ConvertKit later by changing that one URL.

> **Texting people:** the consent checkbox is there so you're covered. Only text people who checked it, and always honor STOP.

---

## PROMISES THE CODE KEEPS

- **Nothing autoplays.** YouTube iframes don't even load until a visitor taps play. Spotify embeds load lazily and stay silent.
- **Reduced motion respected.** All animation disables automatically for users who ask for it.
- **Keyboard accessible.** Skip link, focus rings, Escape closes menus and the lightbox, arrow keys navigate photos.
- **No broken images ever.** Missing files render as clean labeled placeholders instead of broken icons.
- **Phone-first.** 16px inputs (no iOS zoom), 44px+ tap targets, safe-area insets for notched phones.
- **Prints as an EPK.** Ctrl/Cmd+P gives a clean one-pager with links spelled out.

---

## TESTING LOCALLY

Double-clicking `index.html` mostly works, but fonts and embeds behave better over a local server:

```bash
cd prxdjay-site
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

---

## DEPLOY

See **DEPLOY.md** for beginner step-by-step GitHub Pages + `prxdjay.com` setup.

---

© PRXDIGY LLC · PRXD.JAY, pronounced Prodigy.
