# DEPLOY — prxdjay.com on GitHub Pages

Beginner-friendly. Free forever. ~20 minutes the first time, then every future update is a 30-second drag-and-drop.

---

## PART 1 — PUT THE SITE ON GITHUB

### 1. Make a GitHub account
Go to **github.com** → Sign up. Free.

### 2. Create the repository
1. Click the **+** in the top right → **New repository**
2. **Repository name:** `prxdjay-site`
3. **Public** (required for free GitHub Pages)
4. **Do NOT** check "Add a README" — you already have one
5. Click **Create repository**

### 3. Upload the files
On the empty repo page, click **"uploading an existing file"**.

**Important:** open the `prxdjay-site` folder on your computer, select **everything inside it** (`index.html`, `assets`, `README.md`, `CNAME`, etc.) and drag those in — **not** the folder itself. `index.html` must land at the top level of the repo.

Then click **Commit changes**.

> **Heads up:** GitHub's web uploader sometimes hides files starting with a dot. If `.nojekyll` doesn't appear after uploading, create it manually: **Add file → Create new file** → name it `.nojekyll` → leave it empty → Commit.

### 4. Turn on GitHub Pages
1. In your repo → **Settings** (top bar)
2. Left sidebar → **Pages**
3. Under **Source**, choose **Deploy from a branch**
4. Branch: **main** · Folder: **/ (root)** → **Save**
5. Wait ~1 minute, refresh. You'll see a green box with your live URL:
   `https://YOURUSERNAME.github.io/prxdjay-site/`

**Open it on your phone.** Site is live.

---

## PART 2 — POINT prxdjay.com AT IT

### 1. Tell GitHub your domain
1. Repo → **Settings → Pages**
2. Under **Custom domain**, type `prxdjay.com` → **Save**

(The included `CNAME` file already does this, but confirming in Settings triggers verification.)

### 2. Update DNS at your domain registrar
Log in wherever you bought `prxdjay.com` (GoDaddy, Namecheap, Squarespace Domains, Google Domains, Cloudflare…). Find **DNS** / **DNS Records** / **Manage DNS**.

**Add four A records** — delete any existing A records for `@` first:

| Type | Name / Host | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | Auto |
| A | `@` | `185.199.109.153` | Auto |
| A | `@` | `185.199.110.153` | Auto |
| A | `@` | `185.199.111.153` | Auto |

**Then add one CNAME record** for `www`:

| Type | Name / Host | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `YOURUSERNAME.github.io` | Auto |

> Replace `YOURUSERNAME` with your actual GitHub username. The trailing dot (`.github.io.`) is fine if your registrar adds it.

### 3. Turn on HTTPS
Wait 10–60 minutes for DNS to propagate (sometimes up to 24 hours). Then:

Repo → **Settings → Pages** → check **Enforce HTTPS**.

If the checkbox is greyed out, DNS hasn't finished. Come back in an hour.

**Done. `https://prxdjay.com` is live.**

---

## PART 3 — UPDATING THE SITE LATER

### Easiest way (no terminal)
1. Go to your repo on github.com
2. Click into the file you want to change (e.g. `assets/js/era.config.js`)
3. Click the **pencil icon** → edit → **Commit changes**
4. Live in ~60 seconds

### To swap photos
1. Navigate to `assets/img/` in the repo
2. **Add file → Upload files** → drag your new images in
3. Keep the same filenames (`hero.jpg`, `bio.jpg`, `gallery/01.jpg`…) and nothing else needs changing
4. **Commit changes**

### If you use the terminal
```bash
cd prxdjay-site
git add .
git commit -m "Era 002 — Gold Hour"
git push
```

First-time setup only:
```bash
cd prxdjay-site
git init
git branch -M main
git add .
git commit -m "PRXD.JAY site — era 001 Midnight Chrome"
git remote add origin https://github.com/YOURUSERNAME/prxdjay-site.git
git push -u origin main
```

---

## PART 4 — LAUNCH CHECKLIST

Before you share the link:

- [ ] Replace `assets/img/hero.jpg` with a real photo
- [ ] Replace `assets/img/bio.jpg`
- [ ] Add 6 photos to `assets/img/gallery/` and set `placeholder: false` in `era.config.js`
- [ ] Add YouTube video IDs in `era.config.js` → `video.items`
- [ ] Create `assets/img/share.jpg` at **1200×630** — this is what shows when someone texts your link
- [ ] Add your Formspree endpoint (see README) so the Inner Circle list collects properly
- [ ] Download the Spotify cover art and self-host it (see ASSET-INVENTORY.md)
- [ ] Open the site on your actual phone and scroll the whole thing
- [ ] Text yourself the link and confirm the preview card looks right
- [ ] Put `prxdjay.com` in your Instagram, TikTok, YouTube, and Spotify bios

---

## TROUBLESHOOTING

**Page loads but has no styling**
`index.html` isn't at the repo root — it's probably nested inside a `prxdjay-site` folder. Re-upload the contents, not the folder.

**404 after enabling Pages**
Wait 2 minutes and hard-refresh. Confirm Settings → Pages shows branch `main` / folder `/ (root)`.

**Custom domain says "not properly configured"**
DNS hasn't propagated. Check your records at **dnschecker.org**. Give it an hour.

**Images show as labeled placeholder boxes**
That's the framework working as designed — the file isn't there yet, or the filename in `era.config.js` doesn't match exactly. Filenames are case-sensitive: `Hero.JPG` ≠ `hero.jpg`.

**Fonts look wrong**
Google Fonts is blocked or slow. Falls back to system fonts automatically — the layout still holds.

**Nothing changed after I pushed**
Hard refresh: **Cmd+Shift+R** (Mac) / **Ctrl+Shift+R** (Windows). Browsers cache aggressively.

---

## COST

| Item | Cost |
|---|---|
| GitHub Pages hosting | $0 |
| SSL certificate | $0 |
| Formspree (50 signups/mo) | $0 |
| `prxdjay.com` domain | ~$12–15/year |

---

© PRXDIGY LLC · PRXD.JAY, pronounced Prodigy.
