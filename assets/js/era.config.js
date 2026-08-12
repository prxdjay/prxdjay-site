/* =============================================================================
   PRXD.JAY — SITE CONFIG
   -----------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU EDIT TO CHANGE THE SITE.
   Photos, opening media, featured release, copy, links — all of it lives here.
   The framework (HTML/CSS/JS) never needs to be rebuilt.

   CURRENT CHAPTER: the reboot. No era codename on the page.
   When you're ready to name the next chapter, fill in `chapter.name` below
   and it starts appearing. Until then the site says nothing invented.
   ========================================================================== */

window.ERA = {

  /* ---------------------------------------------------------------------------
     1. CHAPTER  — leave name null and NOTHING shows on the page.
        Fill it in when you name the next era.
     ------------------------------------------------------------------------ */
  era: {
    id: null,
    name: null,          // e.g. "NOCTURNE" — set this to turn era labels back on
    year: "2026"
  },

  /* ---------------------------------------------------------------------------
     2. IDENTITY
     ------------------------------------------------------------------------ */
  identity: {
    name: "PRXD.JAY",
    pronunciation: "pronounced Prodigy",
    tagline: "R&B and hip-hop from New York.",
    legalName: "PRXDIGY LLC",
    domain: "https://prxdjay.com"
  },

  /* ---------------------------------------------------------------------------
     3. EXPERIENCE FLAGS
     ------------------------------------------------------------------------ */
  experience: {
    introCurtain: true,
    grain: true,
    ambientGlow: true,       // scanlines + vignette
    chromeShimmer: true,     // VHS chroma split on the wordmark
    stickyDock: true,        // always-visible link bar at the bottom
    listPrompt: true         // slide-up mailing list invite
    // All motion auto-disables for prefers-reduced-motion users.
  },

  /* ---------------------------------------------------------------------------
     4. OPENING SCREEN
     ------------------------------------------------------------------------ */
  opening: {
    /* Short self-hosted clips keep the opening alive without the weight of
       animated GIFs. The startup window prepares the first clip; the rest
       download quietly after the site opens. */
    video: null,
    loading: {
      label: "LOADING MEDIA",
      minShow: 900,
      maxWait: 5000,
      criticalClips: 1,
      autoEnter: true,
      media: []
    },
    slides: [
      { src: "assets/img/clips/wrist.mp4?v=27", fallback: "https://i.ytimg.com/vi/tE0BXfeUcWo/maxresdefault.jpg" },
      { src: "assets/img/clips/sponsored.mp4?v=27", fallback: "https://i.ytimg.com/vi/zkoz1tAjeEA/maxresdefault.jpg" },
      { src: "assets/img/clips/findyou.mp4?v=27", fallback: "https://i.ytimg.com/vi/Se1q1ejP65g/sddefault.jpg" },
      { src: "assets/img/clips/toomany.mp4?v=27", fallback: "https://i.ytimg.com/vi/e7SS51HBa5c/maxresdefault.jpg" }
    ],
    image: "https://i.scdn.co/image/ab6761610000e5eb1fba8e84e5fb261305dcba7f",
    imageAlt: "PRXD.JAY",
    focalPoint: "50% 32%",
    headline: "PRXD.JAY",
    sub: "pronounced Prodigy",
    kicker: null,          // genre tag over the name. null = nothing shows
    sticker: "PRXDIGY VXL.1 · OUT NOW",
    enterLabel: "ENTER SITE",
    doorLine: "PRXD.JAY // MEDIA PLAYER // NEW YORK",
    scrollHint: "scroll",

    /* Keep the opening decision simple. The primary link comes from links.items. */
    ctas: [
      { label: "LISTEN NOW", style: "solid", primary: true }
    ],

    startHere: null
  },

  /* ---------------------------------------------------------------------------
     5. STICKY DOCK  — the fast path. Always one tap away.
     ------------------------------------------------------------------------
     An item with `action:"join"` opens the list instead of leaving the site.
     It renders inverted so it reads as the primary move.
     ------------------------------------------------------------------------ */
  dock: [
    { label: "Spotify",   icon: "spotify",   url: "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip" },
    { label: "YouTube",   icon: "youtube",   url: "https://www.youtube.com/@PrxdJayNY" },
    { label: "Join",      icon: "star",      action: "join", memberLabel: "You're in" },
    { label: "Instagram", icon: "instagram", url: "https://instagram.com/prxd.jay" },
    { label: "TikTok",    icon: "tiktok",    url: "https://www.tiktok.com/@prxd.jay" }
  ],

  /* ---------------------------------------------------------------------------
     5b. NEXT DROP  — countdown + pre-save bar under the hero.
     ------------------------------------------------------------------------
     HIDDEN until you set active:true. Flip it on the moment a date is real.
     `date` is ISO with a timezone offset. -04:00 = New York summer, -05:00 = winter.
     When the clock hits zero it flips itself to "OUT NOW" on its own.
     ------------------------------------------------------------------------ */
  drop: {
    active: false,
    kicker: "NEXT",
    title: "",                       // e.g. "VXL.2"
    kind: "EP",                      // "Single" · "EP" · "Video"
    date: "2026-12-31T00:00:00-05:00",
    url: "",                         // pre-save / release link
    cta: "PRE-SAVE",
    liveCta: "PLAY IT",
    liveKicker: "OUT NOW",
    note: "Get the text the second it lands.",
    joinCta: "TEXT ME WHEN IT DROPS"
  },

  /* ---------------------------------------------------------------------------
     6. LINK HUB
     ------------------------------------------------------------------------
     `note` now says exactly where the link goes. `cta` is the action verb.
     Square booking / checkout links drop straight in here later.
     ------------------------------------------------------------------------ */
  links: {
    heading: "LINKS",
    caption: "Listen, watch, and follow.",
    items: [
      {
        type: "primary",
        label: "PRXDIGY VXL.1",
        note: "5-track EP",
        cta: "PLAY ON SPOTIFY",
        art: "https://i.scdn.co/image/ab67616d0000b27323af26d29c34b6c9e6852dc0",
        url: "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw"
      },
      { label: "SPOTIFY",     note: "Artist page",             cta: "Listen",  icon: "spotify",   url: "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip" },
      { label: "APPLE MUSIC", note: "Full catalog",            cta: "Listen",  icon: "apple",     url: "https://music.apple.com/us/artist/prxd-jay/1418723888" },
      { label: "YOUTUBE",     note: "Official channel",        cta: "Watch",   icon: "youtube",   url: "https://www.youtube.com/@PrxdJayNY" },
      { label: "INSTAGRAM",   note: "@prxd.jay",               cta: "Follow",  icon: "instagram", url: "https://instagram.com/prxd.jay" },
      { label: "TIKTOK",      note: "@prxd.jay",               cta: "Follow",  icon: "tiktok",    url: "https://www.tiktok.com/@prxd.jay" },
      { label: "X",           note: "@prxdjay",                cta: "Follow",  icon: "x",         url: "https://twitter.com/prxdjay" },
      { label: "BEATS",       note: "TrakTrain",               cta: "Browse",  icon: "wave",      url: "https://traktrain.com/prxdjay" },

      /* ---- PARKED — flip hidden to false when ready ---- */
      { label: "BOOK PRXDIGY STUDIOS", note: "Sessions & mixing", cta: "Book", icon: "square", url: "#", hidden: true },
      { label: "MERCH",                note: "Coming soon",       cta: "Shop", icon: "square", url: "#", hidden: true }
    ]
  },

  /* ---------------------------------------------------------------------------
     7. BIO
     ------------------------------------------------------------------------
     Written the way the biggest artists' bios are written — as an assessment,
     not a résumé. No job titles, no hometown-as-qualifier, no credit list.
     Third person, present tense, declarative. Every number in here is real.
       ¶1  the claim nobody else is making
       ¶2  the evidence
       ¶3  the trajectory
     Copy-pasteable straight into press and into your Spotify bio.
     ------------------------------------------------------------------------ */
  bio: {
    heading: "ABOUT",
    portrait: "https://i.scdn.co/image/ab6761610000e5eb1fba8e84e5fb261305dcba7f",
    portraitAlt: "PRXD.JAY",
    pullQuote: null,
    body: [
      "PRXD.JAY, pronounced Prodigy, is an artist, producer, and engineer from Brentwood, New York.",
      "His music moves between R&B and hip-hop. He writes, records, produces, and engineers his work, shaping each record from the first idea to the final mix.",
      "Now he is preparing a new run of solo releases and visuals through PRXDIGY LLC. New music is next."
    ],
    stats: [],
    facts: [
      { k: "From",  v: "Brentwood, New York" },
      { k: "Music", v: "R&B and hip-hop" },
      { k: "Creates", v: "Writing, vocals, production, and engineering" },
      { k: "Next", v: "New music and visuals" }
    ]
  },

  /* ---------------------------------------------------------------------------
     8. GALLERY
     ------------------------------------------------------------------------
     Thumbnails now auto-fall-back if YouTube has no max-res version,
     so no more empty frames.
     ------------------------------------------------------------------------ */
  gallery: {
    heading: "PHOTOS",
    caption: "Shots from the videos. Tap one to see it full size.",
    ratio: "4/3",
    items: [
      { src: "https://i.ytimg.com/vi/tE0BXfeUcWo/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/tE0BXfeUcWo/hqdefault.jpg", alt: "PRXD.JAY — WRIST" },
      { src: "https://i.ytimg.com/vi/rACq2a4tj2c/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/rACq2a4tj2c/hqdefault.jpg", alt: "PRXD.JAY — P4RTY" },
      { src: "https://i.ytimg.com/vi/j02TnPuogJU/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/j02TnPuogJU/hqdefault.jpg", alt: "PRXD.JAY — DNT TRN ME UP" }
    ]
  },

  /* ---------------------------------------------------------------------------
     9. FULL-BLEED IMAGE BREAKS  — big photography between sections
     ------------------------------------------------------------------------
     Set `after` to any section id. Keeps the page from going all-black.
     ------------------------------------------------------------------------ */
  bands: [
    { after: "music", src: "https://i.ytimg.com/vi/tE0BXfeUcWo/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/tE0BXfeUcWo/hqdefault.jpg", caption: "WRIST — official video" },
    { after: "video", src: "https://i.ytimg.com/vi/j02TnPuogJU/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/j02TnPuogJU/hqdefault.jpg", caption: "DNT TRN ME UP · official video" }
  ],

  /* ---------------------------------------------------------------------------
     10. VIDEO  — NEVER autoplays. Click-to-load only.
     ------------------------------------------------------------------------ */
  video: {
    heading: "VIDEOS",
    caption: "Tap one to play. Nothing starts on its own.",
    channelUrl: "https://www.youtube.com/@PrxdJayNY",
    channelLabel: "WATCH ALL ON YOUTUBE",
    items: [
      { title: "WRIST",         note: "Official music video · 2025",     id: "tE0BXfeUcWo" },
      { title: "SPONSORED",     note: "Official video", id: "zkoz1tAjeEA" },
      { title: "FIND YOU",      note: "Official video", id: "Se1q1ejP65g" },
      { title: "P4RTY",         note: "Official visualizer", id: "rACq2a4tj2c" },
      { title: "DNT TRN ME UP", note: "Official video",                  id: "j02TnPuogJU" }
    ]
  },

  /* ---------------------------------------------------------------------------
     11. MUSIC
     ------------------------------------------------------------------------
     `featured` = what's current. `archive` = everything before the reboot,
     collapsed behind a toggle so the past doesn't crowd the present.
     ------------------------------------------------------------------------ */
  music: {
    heading: "MUSIC",
    caption: "The catalog, newest first.",
    featured: {
      title: "PRXDIGY VXL.1",
      type: "EP",
      year: "2025",
      spotifyAlbumId: "7reVqpxCzqE0df6fGIobVw",
      cover: "https://i.scdn.co/image/ab67616d0000b27323af26d29c34b6c9e6852dc0",
      url: "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw",
      blurb: "Five tracks: PRAY, UPSET, WRIST, FANTASIZE, and 9 to 5.",
      cta: "PLAY ON SPOTIFY",
      /* Handwritten in the margin, in your voice, first person. This is the
         one place on the page he speaks directly — leave it short and real.
         Set to "" and it disappears. */
      story: ""
    },
    archiveLabel: "THE ARCHIVE",
    archiveNote: "Everything before the reboot",
    archive: [
      { title: "2U",                      year: "2025", type: "Single", id: "5uw8wfkXSvWKKfURGsXoti", cover: "https://i.scdn.co/image/ab67616d0000b273a6681c2d4b2ac136c7fe36fe" },
      { title: "TOO MANY",                year: "2025", type: "Single", id: "7umTdiUx0Pmdcmodk4qgHf", cover: "https://i.scdn.co/image/ab67616d0000b2731b2305a11765cbf0713defdc" },
      { title: "P4RTY",                   year: "2025", type: "Single", id: "68TWroQpfsoPod9qlzm8az", cover: "https://i.scdn.co/image/ab67616d0000b27394d91f726bd8f07316deb33b" },
      { title: "Sorry You Feel That Way", year: "2024", type: "EP",     id: "43M4MemZfW5zijlSPaOmKF", cover: "https://i.scdn.co/image/ab67616d0000b273d43662578e32c8f0d6f2916b" },
      { title: "lost",                    year: "2024", type: "Single", id: "1rnzBT6kveAE4Cxn5hlDD8", cover: "https://i.scdn.co/image/ab67616d0000b27307bb233b57a11db425044499" },
      { title: "Leave You Behind",        year: "2024", type: "Single", id: "0oU4MmtvCWQKrLQaemf1Hd", cover: "https://i.scdn.co/image/ab67616d0000b273c8b65797cc35c1a3661a212f" },
      { title: "too much",                year: "2024", type: "Single", id: "2SjlCp1mAPlmLMn2dddqVI", cover: "https://i.scdn.co/image/ab67616d0000b27325a99c019af9e511831489d5" },
      { title: "Amazin'",                 year: "2024", type: "Single", id: "7xQE57zjyum0NL1Vk2zOee", cover: "https://i.scdn.co/image/ab67616d0000b2736c20dbc865d06eda434f8083" },
      { title: "find a way",              year: "2024", type: "Single", id: "3UuKyc7XauNfZLhufwKqZt", cover: "https://i.scdn.co/image/ab67616d0000b273ede3a52ddd565a369ca574ae" },
      { title: "DNT TRN ME UP",           year: "2023", type: "Single", id: "6kKxvUe5GKSv6aH4iWaFhY", cover: "https://i.scdn.co/image/ab67616d0000b2738fa24af975dbff946937b1e0" }
    ]
  },

  /* ---------------------------------------------------------------------------
     12. EMAIL LIST
     ------------------------------------------------------------------------
     The form stays unavailable until Cloudflare, Turnstile, and Brevo are
     connected. See SETUP-THE-LIST.md. Phone collection is intentionally off.
     ------------------------------------------------------------------------ */
  list: {
    heading: "JOIN THE LIST",
    caption: "Get new music and release updates by email.",

    enabled: false,                 // set true after Cloudflare and Brevo are connected
    endpoint: "/api/subscribe",
    turnstileSiteKey: "",         // set in Cloudflare when the protected form is connected
    unavailable: "The email list is being connected. Please check back soon.",

    /* The three reasons to hand over an email. Concrete beats vague. */
    perks: [
      { k: "New music", v: "Release announcements and direct listening links" },
      { k: "Early updates", v: "The next release before it reaches social media" },
      { k: "Live dates", v: "Show announcements when dates are confirmed" }
    ],

    /* STEP 1 */
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    submitLabel: "JOIN",
    reassure: "Confirm by email. Unsubscribe at any time.",

    pending: {
      title: "Check your inbox.",
      body: "Use the confirmation link to finish joining the list."
    },

    /* Shown after the confirmation link returns to the site. */
    done: {
      title: "You're on the list.",
      body: "You'll get the next music and release update by email. In the meantime:",
      /* The reward. Point it at anything real — an unreleased track, a private
         playlist, a video. Set `url` to "" and the reward block disappears. */
      reward: {
        label: "START HERE",
        title: "PRXDIGY VXL.1",
        note: "Five tracks. Twelve minutes. Play it loud.",
        url: "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw",
        cta: "PLAY IT NOW"
      },
      shareLabel: "Send it to one person who'd get it",
      shareCopy: "PRXD.JAY, pronounced Prodigy. Listen now.",
      copiedMsg: "Link copied."
    },

    successMsg: "Check your inbox to confirm.",
    errorMsg: "That didn't send. Please try again.",

    /* The slide-up bar. Now it takes the email inline instead of just
       pointing at the form — that alone roughly doubles what it catches. */
    prompt: {
      title: "Hear it first.",
      body: "Get new music and release updates by email.",
      yes: "JOIN",
      no: "Not now",
      /* Show it once they've gone this deep. "video" | "music" | "gallery" */
      after: "video"
    },

    /* Desktop only. Fires once, when the cursor leaves for the tab bar.
       Never fires on mobile, never fires twice, never fires for members. */
    exitIntent: {
      on: true,
      title: "Before you go —",
      body: "Get the next release directly by email.",
      dismiss: "No thanks"
    }
  },

  /* ---------------------------------------------------------------------------
     13. CONTACT
     ------------------------------------------------------------------------ */
  contact: {
    heading: "CONTACT",
    caption: "Bookings, press, and business inquiries.",
    email: "prxd.jay@gmail.com",
    emailLabel: "Business inquiries",
    secondary: [
      { label: "DM on Instagram", url: "https://instagram.com/prxd.jay" }
    ]
  },

  /* ---------------------------------------------------------------------------
     14. FOOTER
     ------------------------------------------------------------------------ */
  footer: {
    mark: "PRXD.JAY",
    note: "pronounced Prodigy",
    rights: "All rights reserved.",
    /* Required if you ever run the SMS list. Carriers check for these. */
    links: [
      { label: "Privacy", url: "privacy.html" },
      { label: "Terms",   url: "terms.html" }
    ]
  },

  /* ---------------------------------------------------------------------------
     16. SHARING  — what gets sent when someone passes the site on
     ------------------------------------------------------------------------ */
  share: {
    title: "PRXD.JAY — pronounced Prodigy",
    text: "Listen now.",
    url: "https://prxdjay.com"
  },

  /* ---------------------------------------------------------------------------
     15. NAVIGATION
     ------------------------------------------------------------------------ */
  /* Every label here is the exact same word as the heading it jumps to.
     If you rename a section, rename it in both places — a nav that says one
     thing and lands on another is the fastest way to lose someone.
     `primary:true` renders JOIN as the one filled button in the header. */
  nav: [
    { label: "HOME",      target: "home" },
    { label: "MUSIC",     target: "music" },
    { label: "VIDEOS",    target: "video" },
    { label: "ABOUT",     target: "bio" },
    { label: "PHOTOS",    target: "gallery" },
    { label: "LINKS",     target: "links" },
    { label: "JOIN",      target: "list", primary: true },
    { label: "CONTACT",   target: "contact" }
  ]
};
