# Production Deployment

## Current State

- Source repository: `prxdjay/prxdjay-site`
- Current public build: GitHub Pages
- `prxdjay.com`: Squarespace holding page
- Production target: Cloudflare Pages, because the secure signup endpoint needs server-side code
- Registrar: Squarespace Domains II LLC
- Email records on the domain: Google Workspace MX and SPF records; preserve them during the DNS move

Keep `DNS-BEFORE-CHANGE.txt` as the rollback record.

## 1. Create a Preview Deployment

In Cloudflare, open **Workers & Pages**, create a Pages project, and connect the GitHub repository.

- Project name: `prxdjay-site`
- Production branch: `main`
- Framework preset: none
- Build command: `exit 0`
- Build output directory: `.`

Complete the variables and secrets in `SETUP-THE-LIST.md`. Deploy first on the `pages.dev` address and finish the acceptance test before changing the domain.

In the Pages project, open **Metrics** and enable Cloudflare Web Analytics. It provides privacy-first page-view and performance measurements without collecting visitors' personal data.

## 2. Move DNS Management to Cloudflare

Cloudflare Pages requires an apex domain such as `prxdjay.com` to use Cloudflare nameservers.

1. Add `prxdjay.com` as a site in the same Cloudflare account.
2. Confirm that Cloudflare imported the current DNS records.
3. Compare every imported record with `DNS-BEFORE-CHANGE.txt`.
4. Preserve the Google Workspace MX and SPF TXT records exactly.
5. At Squarespace Domains, replace the current nameservers with the two Cloudflare nameservers assigned to the zone.
6. Wait until Cloudflare marks the zone active.

Do not delete the Google Workspace records. Changing nameservers does not transfer domain ownership; registration stays at Squarespace.

## 3. Attach the Domain

After the Pages preview and email test pass:

1. Open the Pages project > **Custom domains**.
2. Add `prxdjay.com`.
3. Add `www.prxdjay.com` and redirect it to the apex domain.
4. Wait for the certificates to become active.
5. Confirm `https://prxdjay.com`, `https://www.prxdjay.com`, the privacy page, and the signup endpoint.

The `CNAME.hold` file remains only as history from the GitHub Pages setup. Cloudflare creates the required DNS record when the custom domain is activated.

## 4. Production Checks

- The Squarespace holding page is gone.
- The opening screen shows PRXD.JAY and one Listen button.
- Music is the first section after the opening.
- Desktop, phone, reduced-motion, keyboard, and 200 percent zoom layouts work.
- All streaming and social links reach the intended official profiles.
- Link previews use `assets/img/share.jpg`.
- The email form completes double confirmation and unsubscribe correctly.
- Browser security headers are present.
- `pages.dev` preview URLs carry `noindex` headers.
- Google Workspace email still sends and receives.

## Rollback

If the domain move causes a serious issue, restore the Squarespace nameservers and the records in `DNS-BEFORE-CHANGE.txt`. The GitHub Pages URL remains a separate public fallback while Cloudflare is being configured.

## Future Releases

Push release changes to a branch first. Review the Cloudflare preview URL, then merge to `main` after media, links, copy, and the form have passed the release checklist.
