# TURN THE LIST ON

> **Beta note:** the public website does not currently show this feature. Keep
> these setup notes for a future launch after the signup flow is ready.

Before restoring the feature, connect a real endpoint. The legacy fallback
opens the visitor's mail app, which most people will not finish.

This takes about ten minutes and costs nothing. Pick **one** option.

---

## OPTION A — Google Sheet (recommended)

Free, unlimited signups, and you end up owning the data in a spreadsheet you
already know how to use. No account to create, no monthly cap.

### 1. Make the sheet

1. Go to **sheets.google.com** → blank spreadsheet. Name it `Early Access`.
2. In row 1, type these nine headers, one per cell, left to right:

   `timestamp` · `email` · `name` · `phone` · `sms_consent` · `consent_text` · `source` · `stage` · `referrer`

### 2. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Delete whatever's in the editor. Paste this in:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var p = e.parameter;
  sheet.appendRow([
    new Date(),
    p.email || '',
    p.name || '',
    p.phone || '',
    p.sms_consent || '',
    p.consent_text || '',
    p.source || '',
    p.stage || '',
    p.referrer || ''
  ]);
  return ContentService.createTextOutput('ok');
}
```

3. Click **Deploy → New deployment**.
4. Click the gear next to "Select type" → **Web app**.
5. Set **Execute as:** `Me`. Set **Who has access:** `Anyone`.
   > That second one has to say **Anyone**, or the site can't post to it. It
   > does not make your spreadsheet public — it only lets the form add rows.
6. **Deploy** → authorise it (Google will warn you about your own script;
   click **Advanced → Go to (project name)** → **Allow**).
7. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy..../exec`

### 3. Put it in the site

Open `assets/js/era.config.js`, find the `list:` block, and set both lines:

```javascript
endpoint: "https://script.google.com/macros/s/AKfy..../exec",
transport: "opaque",
```

`transport: "opaque"` is required for Google. Don't skip it.

### 4. Bump the cache number

In `index.html`, change every `?v=2` to `?v=3`. There are five.

### 5. Test it

Load the site, sign yourself up, and watch a row appear in the sheet.

---

## OPTION B — Formspree (faster, but capped)

Easiest possible setup. Free plan is **50 signups a month** — fine to start,
not fine once something takes off.

1. **formspree.io** → sign up → **New Form**.
2. Copy the endpoint: `https://formspree.io/f/xxxxxxx`
3. In `era.config.js`:

```javascript
endpoint: "https://formspree.io/f/xxxxxxx",
transport: "json",
```

4. Bump `?v=2` to `?v=3` in `index.html`.

Same idea works with **Basin**, **Getform**, or **Formsubmit** — all use
`transport: "json"`.

---

## OPTION C — a real email platform

Once the list is worth sending to properly, move it to **Mailchimp**,
**ConvertKit**, or **Beehiiv**. All of them accept a CSV export from your
Google Sheet, so **Option A now doesn't lock you out of this later** — that's
the main reason to start there.

---

# SENDING THE TEXTS

The site **collects** phone numbers and stores proof of consent. It does not
send anything — you need a texting service for that.

## What you have to know before your first text

US text marketing is regulated, and the penalties are per message. The site is
already built to keep you on the right side of it:

- The consent box is **separate** from the email signup and **unticked** by default.
- A number **without** a ticked box is never submitted as consenting.
- The exact sentence someone agreed to is saved with their record, along with the timestamp.

That's your proof. **Don't remove any of it**, and don't text anyone whose
`sms_consent` column says anything other than `yes`.

## Getting set up

1. Pick a service — **SimpleTexting**, **Community**, **Klaviyo**, or **Twilio**.
2. You'll have to register the number (in the US this is called **A2P 10DLC**).
   They'll ask for a link to your terms and privacy policy — that's what
   `terms.html` and `privacy.html` are for. Both are already linked in your footer.
3. Every message must let people reply **STOP**. Any real service handles this
   automatically — check that it's on.

> **Get a lawyer to read `terms.html` and `privacy.html` before the first
> marketing text goes out.** They're written to be accurate and to cover what
> carriers ask for, but they haven't been reviewed by anyone qualified.

---

# WHAT TO SEND

The list is only worth having if it's worth being on. What was promised on the
site is: *unreleased records first, one text when something drops, show alerts.*
That's it. Send that, and nothing else, and people stay.

The fastest way to kill it is to go quiet for eight months and then show up
asking for streams.

---

# CHECKING IF IT'S WORKING

Set analytics in `era.config.js` and you'll see the funnel:

```javascript
analytics: {
  plausible: "prxdjay.com",   // plausible.io — ~$9/mo, no cookie banner needed
  ga4: null                   // or "G-XXXXXXXXXX" for Google Analytics (free)
}
```

The site already fires these on its own:

| Event | What it means |
|---|---|
| `join_view` | someone saw a signup form |
| `join_email` | someone submitted step 1 — **this is the number that matters** |
| `join_phone` | someone gave a phone number too |
| `join_skip_phone` | email only, no phone |
| `share` | someone shared the site after joining |
| `hero_cta` / `dock_join` / `drop_join` | which button got them there |
| `prompt_show` / `exit_intent_show` | the slide-up bar and the exit pop-up |

`join_email ÷ join_view` is your conversion rate. Under 2% means the offer
isn't landing. Over 10% means it is.
