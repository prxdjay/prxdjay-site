# PRXD.JAY Official Site

The artist site for PRXD.JAY, pronounced Prodigy. It is intentionally simple: static HTML, CSS, and JavaScript for the public experience, with one Cloudflare Pages Function for protected email signup.

## Release Updates

Most release changes happen in `assets/js/era.config.js`:

1. Update `opening.sticker` and the primary release in `links.items`.
2. Update `music.featured` with the title, year, cover, Spotify ID, and URL.
3. Add new YouTube IDs under `video.items`.
4. Replace the portrait, opening image, gallery images, and `assets/img/share.jpg` when new media is ready.
5. Change every `?v=26` reference in the HTML files to the next number after editing CSS or JavaScript.

The permanent framework lives in `index.html`, `assets/css/base.css`, and `assets/js/app.js`. A normal release should not require changes to those files.

## Site Order

The site opens directly on PRXD.JAY, then moves through Music, Videos, About, Photos, Links, Join, and Contact. The public language describes the music as R&B and hip-hop. The About section stays focused on PRXD.JAY, Brentwood, New York, the way he creates, and what is next.

## Contact List

Email contacts belong in Brevo under a dedicated `PRXD.JAY Website` list. The public form posts to `/api/subscribe`, where Cloudflare Turnstile is checked before Brevo starts a double-confirmation signup.

- API keys stay in Cloudflare secrets, never in the public code.
- Contact information is not stored in the visitor's browser.
- The form does not claim success when the service is missing or rejects a request.
- Phone collection is off until a compliant text provider and separate consent flow are ready.

See `SETUP-THE-LIST.md` for the one-time account connection.

## Important Files

| File | Purpose |
|---|---|
| `assets/js/era.config.js` | Release copy, links, music, videos, photos, About, and contact settings |
| `assets/css/theme.css` | Colors, typography, texture, and spacing |
| `assets/img/share.jpg` | 1200 x 630 link preview image |
| `functions/api/subscribe.js` | Protected email signup endpoint |
| `_headers` | Browser security and caching headers on Cloudflare Pages |
| `privacy.html` / `terms.html` | Public policies that match the current email-only setup |
| `RELEASE-CHECKLIST.md` | Short checklist for the next release |
| `DEPLOY.md` | Hosting, account, domain, and rollback instructions |

## Local Preview

The page can be inspected with any local static server. The Cloudflare signup function requires a Pages development environment and configured test secrets; the public form remains disabled until the real account connection is complete.

## Publishing Rule

Use a preview deployment before changing production. Confirm the opening screen, mobile layout, external links, email confirmation, privacy pages, and social preview before promoting a release build to `main`.

Copyright PRXDIGY LLC.
