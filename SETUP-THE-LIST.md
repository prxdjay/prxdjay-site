# Connect the Email List

## Where Contacts Go

Confirmed contacts go to **Brevo > Contacts > Lists > PRXD.JAY Website**. Brevo is the single place to view contacts, export a backup, remove someone, create a release email, and see delivery results.

The site currently leaves signup disabled until this account connection is finished. It never opens a mail app, writes an address to local browser storage, or displays a false success message.

## 1. Prepare Brevo

1. Create or open the PRXD.JAY Brevo account.
2. Create a contact list named `PRXD.JAY Website` and note its numeric list ID.
3. Create a contact attribute named `SIGNUP_SOURCE` with text type.
4. Create and activate a double-confirmation email template.
5. Put `{{ params.DOIurl }}` on the confirmation button in that template.
6. Note the template's numeric ID.
7. Create an API key named `prxdjay-site-production` and store it securely.

The confirmation email should plainly say that the person requested PRXD.JAY music and release updates. It should not mention texts while phone collection is off.

## 2. Prepare Cloudflare Pages

Create a Pages project connected to the `prxdjay/prxdjay-site` GitHub repository.

- Production branch: `main`
- Framework preset: none
- Build command: `exit 0`
- Build output directory: `.`

In **Settings > Variables and Secrets**, add these production values:

| Name | Kind | Value |
|---|---|---|
| `BREVO_API_KEY` | Secret | Brevo API key |
| `BREVO_LIST_ID` | Variable | Numeric website list ID |
| `BREVO_DOI_TEMPLATE_ID` | Variable | Numeric confirmation template ID |
| `BREVO_REDIRECT_URL` | Variable | `https://prxdjay.com/?confirmed=1#list` |
| `SITE_ORIGIN` | Variable | `https://prxdjay.com` |
| `TURNSTILE_SECRET_KEY` | Secret | Secret from the Turnstile widget |

Do not place either secret in `era.config.js`, a screenshot, a support message, or a git commit.

## 3. Create Turnstile Protection

1. In Cloudflare, create a Turnstile widget named `PRXD.JAY email signup`.
2. Allow `prxdjay.com` and the production Pages hostname.
3. Add the secret to `TURNSTILE_SECRET_KEY` in the Pages project.
4. Copy the public site key into `list.turnstileSiteKey` in `assets/js/era.config.js`.

Turnstile is complete only when the public widget and server-side verification are both active.

## 4. Turn the Form On

In `assets/js/era.config.js`:

```js
list: {
  enabled: true,
  endpoint: "/api/subscribe",
  turnstileSiteKey: "YOUR_PUBLIC_SITE_KEY",
  // Phone collection remains off until a separate text program is ready.
}
```

Bump the cache number in the HTML files, deploy a preview, and test with an address you control.

## 5. Acceptance Test

The setup is complete only when all of these pass:

- An invalid email stays on the page with a clear error.
- A valid request produces a Brevo confirmation email.
- The address does not enter the active list before confirmation.
- Confirmation adds the address to `PRXD.JAY Website`.
- The website displays the success state only after Brevo accepts the request.
- The unsubscribe link removes the address from future campaigns.
- A repeated request and a failed bot check do not create duplicate active contacts.
- No email address appears in local browser storage or public logs.

## Routine Organization

- Send campaigns only to the `PRXD.JAY Website` list or a clearly named segment built from it.
- Export a CSV backup before a major release campaign and store it privately.
- Remove test contacts after testing.
- Review hard bounces and complaints after every send.
- Never upload purchased, scraped, or collaborator lists.
- Keep access limited to the people who actually send PRXD.JAY campaigns.

## Phone Numbers

Phone collection is intentionally off. Before enabling it, choose a text provider that manages opt-out keywords and sender registration, have the consent language and policies reviewed for the actual program, build a separate phone confirmation path, and run a complete STOP/HELP test. An email signup must never silently become permission to text.
