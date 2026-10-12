# Email list deployment

The signup is deliberately fail-closed. With an empty endpoint in
`assets/js/signup-config.js`, the form and its navigation link stay hidden.
Do not activate them until the Google write and duplicate paths have both
been verified.

## Architecture

- Public site: an email-only form on `prxdjay.com`.
- Write service: a Google Apps Script web app using
  `google-apps-script/Code.gs`.
- Storage: a private Google Sheet with a `Subscribers` tab.
- Public access: write-only. `doGet` returns `Not found.` and there is no list
  read route.
- Credentials: the Sheet ID remains in Apps Script properties. It is never
  committed to the repository or sent to a visitor.

Google Apps Script web-app URLs are public submission addresses, not account
credentials. The private Sheet ID and Google authorization must stay out of
`assets/js/signup-config.js`.

## One-time Google setup

This step changes persistent Google account access. Complete it only in the
owner account and review the authorization screen before accepting it.

1. Open the owner-controlled Apps Script project, or create a script from the
   private subscriber Sheet.
2. Replace its code with `google-apps-script/Code.gs`.
3. In **Project Settings > Script properties**, add:
   - `SPREADSHEET_ID`: the private subscriber Sheet ID.
   - `SITE_ORIGIN`: `https://prxdjay.com`
4. Deploy as a web app:
   - Execute as: the owner.
   - Who has access: anyone.
5. Copy the `/exec` URL. Do not use the editor or `/dev` URL.
6. Paste only that web-app URL into `assets/js/signup-config.js`.

The Sheet itself remains private. "Anyone" allows the web app to execute its
limited `doPost` function; it does not grant public Sheet access.

## Required end-to-end release test

Use a clearly synthetic address, for example
`codex-synthetic-test+YYYYMMDD@example.com`.

1. Deploy the repository update and load `https://prxdjay.com/#updates` on a
   phone-sized viewport and a desktop viewport.
2. Submit the synthetic address. Confirm the page says `You're on the list.`
   and exactly one row appears in the private Sheet.
3. Submit the same address with different capitalization. Confirm the page
   says `You're already on the list.`, no second row appears, and
   `submission_count` increments.
4. Submit an invalid address and confirm the browser keeps focus on the email
   field and nothing is written.
5. Temporarily break the endpoint in a preview branch and confirm the form is
   not shown. Restore the verified endpoint before release.
6. Check keyboard focus, visible status announcements, a 320px-wide viewport,
   and reduced-motion mode.
7. Remove only the clearly labelled synthetic test row after verification.
   Never bulk-delete or modify real subscriber rows during testing.

## Removal requests

The public privacy page links to a removal email. When a subscriber asks to be
removed, set their `status` to `removed` and record the date in `removed_at`.
Do not delete unrelated rows. A later explicit signup from the same address
reactivates that single record and stores the current consent wording.

## Sending email

This feature only stores opt-ins. It does not create campaigns or send fan
email. Any future sending workflow needs a separate decision and review.
