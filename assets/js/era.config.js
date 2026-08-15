/* =============================================================================
   PRXD.JAY — SITE CONFIG
   -----------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU EDIT TO CHANGE THE SITE.
   Photos, hero media, featured release, copy, links — all of it lives here.
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
    tagline: "After hours. On his own terms.",
    legalName: "PRXDIGY LLC",
    domain: "https://prxdjay.com"
  },

  /* ---------------------------------------------------------------------------
     3. EXPERIENCE FLAGS
     ------------------------------------------------------------------------ */
  experience: {
    introCurtain: true,      // the door
    grain: true,
    ambientGlow: true,       // scanlines + vignette
    chromeShimmer: true,     // VHS chroma split on the wordmark
    stickyDock: true,        // always-visible link bar at the bottom

    /* ---- VIEWS -------------------------------------------------------
       MODERN is the default dark editorial view. RETRO is the Windows-style
       alternate. Every visit starts in Modern; color choice stays saved.
       Set skinSwitcher:false to hide the toggle and lock one look.
       ------------------------------------------------------------------ */
    defaultSkin: "tape",
    defaultColor: "midnight",
    skinSwitcher: true
    // All motion auto-disables for prefers-reduced-motion users.
  },

  /* ---------------------------------------------------------------------------
     4. THE DOOR + HERO
     ------------------------------------------------------------------------
     video:  drop an .mp4 at assets/img/hero-loop.mp4 and point here.
             MUTED + LOOPED decoration only. Never plays audio.
             Best source: a 10–15s cut from the WRIST video, 1080p, under 5MB.
     slides: until that mp4 exists, these cross-fade behind the name with a
             slow push-in. Kills the dead-black screen. Real footage, your own.
     ------------------------------------------------------------------------ */
  hero: {
    /* ONE full-bleed clip behind the name. The best version of this page.
       Drop a 10–15s silent cut from the WRIST video at assets/img/hero-loop.mp4
       and point here — it replaces the slideshow entirely.
       MUTED + LOOPED decoration only. It never plays audio, ever. */
    video: null,                       // "assets/img/hero-loop.mp4"  <-- when ready

    /* Until that exists, these cross-fade with a slow drift.
       EACH ENTRY CAN BE A CLIP, NOT JUST A PHOTO:
         "assets/img/clips/wrist.mp4?v=25"   ← best. silent, looping, ~2MB
         "assets/img/clips/wrist.gif"   ← works, but heavy. mp4 beats gif every time
         "https://i.ytimg.com/..."      ← a still
       Mix them freely. Anything ending .mp4/.webm plays as silent video.
       `fallback` is used automatically if the first URL is missing. */
    /* ---- THE DOOR DOUBLES AS THE LOADING SCREEN --------------------
       The hero opens on video, so the door holds shut until that first
       clip has enough frames ready to open cleanly.
         label     what it says while it waits
         minShow   ms the loading screen shows for NO MATTER WHAT, even when
                   the first clip is already cached. Keep this short: later
                   clips load one at a time behind the one already playing.
         maxWait   ms before it lets them in regardless (bad connections).
                   The door only waits for the opening clip.
         autoEnter true = open by itself the moment it's ready
       ---------------------------------------------------------------- */
    loading: {
      label: "LOADING",
      minShow: 650,
      maxWait: 4500,
      autoEnter: false,

      /* What sits behind the door. Kept separate from `slides` above so the
         first thing a stranger sees is you and not a record you're featured
         on. Your Spotify portrait, held still.
           - swap the string for any image or clip path
           - use [] for a blank screen: black, grain, wordmark, nothing else */
      media: ["https://i.scdn.co/image/ab6761610000e5eb1fba8e84e5fb261305dcba7f"]
    },

    slides: [
      /* Silent clips cut from your own videos. Self-hosted, and only the one
         on screen is ever downloaded.

         Each clip PLAYS ONCE and then hands over to the next — nothing loops
         back on itself. So the pace of the hero is set by the footage: a short
         cut moves on quickly, a longer one gets its time.

         Four moving cuts only, so the reel never pauses on a still. */

      /* WRIST — opens on the thumbnail shot (all five of them), then the
         LED-floor sequence. ~6.5s */
      { src: "assets/img/clips/wrist.mp4?v=25",     fallback: "https://i.ytimg.com/vi/tE0BXfeUcWo/maxresdefault.jpg" },
      /* SPONSORED — high-contrast black and white */
      { src: "assets/img/clips/sponsored.mp4?v=25", fallback: "https://i.ytimg.com/vi/zkoz1tAjeEA/maxresdefault.jpg" },
      /* FIND YOU — your green-lit section, not Kayeandre's */
      { src: "assets/img/clips/findyou.mp4?v=25",   fallback: "https://i.ytimg.com/vi/Se1q1ejP65g/sddefault.jpg" },
      /* TOO MANY — you in the backseat, Times Square out the window */
      { src: "assets/img/clips/toomany.mp4?v=25",   fallback: "https://i.ytimg.com/vi/e7SS51HBa5c/maxresdefault.jpg" }
    ],
    image: "https://i.scdn.co/image/ab6761610000e5eb1fba8e84e5fb261305dcba7f",
    imageAlt: "PRXD.JAY",
    focalPoint: "50% 32%",
    headline: "PRXD.JAY",
    sub: "pronounced Prodigy",
    kicker: null,          // genre tag over the name. null = nothing shows
    sticker: "PRXDIGY VXL.1 — OUT NOW",   // real, not invented
    enterLabel: "ENTER",
    scrollHint: "scroll",

    /* The line along the bottom of the door.

       This used to read out listener counts and stream totals, which made
       the first thing anyone saw feel like a pitch deck. It's a doorway, not
       a quarterly report — so it says who's inside instead of how many.
       Set to null to hide it. */
    doorLine: null,

    /* Two buttons, no more. One plays the record, one opens the link hub.
       style: "solid" (the inverted tape block) or "ghost" (underlined).
       Use `primary:true` to inherit the featured link's URL automatically. */
    ctas: [
      { label: "PLAY THE EP", style: "solid", primary: true },
      { label: "ALL LINKS", style: "ghost", target: "links" }
    ],

    /* The one-line on-ramp for someone who has never heard him.
       Removes the "where do I even start" problem. Set to null to hide. */
    startHere: {
      text: "Never heard him? Start with",
      label: "WRIST",
      url: "https://www.youtube.com/watch?v=tE0BXfeUcWo"
    }
  },

  /* ---------------------------------------------------------------------------
     5. STICKY DOCK  — the fast path. Always one tap away.
     ------------------------------------------------------------------------
     These are the five fastest routes out to the full ecosystem.
     ------------------------------------------------------------------------ */
  dock: [
    { label: "Spotify",   icon: "spotify",   url: "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip" },
    { label: "Apple",     icon: "apple",     url: "https://music.apple.com/us/artist/prxd-jay/1418723888" },
    { label: "YouTube",   icon: "youtube",   url: "https://www.youtube.com/@PrxdJayNY" },
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
    heading: "ALL LINKS",
    caption: "Every place you can find me. One tap.",
    items: [
      {
        type: "primary",
        label: "PRXDIGY VXL.1",
        note: "5-track EP",
        cta: "PLAY ON SPOTIFY",
        art: "https://i.scdn.co/image/ab67616d0000b27323af26d29c34b6c9e6852dc0",
        url: "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw"
      },
      { label: "SPOTIFY",     note: "22.5K monthly listeners", cta: "Listen",  icon: "spotify",   url: "https://open.spotify.com/artist/2BXB6wbzCaQKOx0kP4sTip" },
      { label: "APPLE MUSIC", note: "Full catalog",            cta: "Listen",  icon: "apple",     url: "https://music.apple.com/us/artist/prxd-jay/1418723888" },
      { label: "YOUTUBE",     note: "6 official videos",       cta: "Watch",   icon: "youtube",   url: "https://www.youtube.com/@PrxdJayNY" },
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
    pullQuote: "He isn't making records for the radio. He's making them for the drive home.",
    body: [
      "PRXD.JAY — pronounced Prodigy — makes music for the hours nobody else is awake for. Low-lit, unhurried, and honest past the point most artists would have edited it out. He doesn't stay in one lane long enough to be filed under it.",
      "PRXDIGY VXL.1 is his first rap project — five tracks, twelve minutes, not a wasted bar. Nobody asked him to make it and nobody had to: twenty-two thousand people a month find him with no label pushing them there, and \"Leave You Behind\" has passed half a million streams.",
      "It all runs through PRXDIGY LLC, on his own schedule, answering to nobody. The catalog already runs deep. This is still the early part."
    ],
    stats: [
      { value: "22.5K", label: "Monthly listeners" },
      { value: "530K+", label: "Streams · one record" },
      { value: "11",    label: "Releases" }
    ],
    facts: [
      { k: "Sound",  v: "Rap. R&B when it suits him." },
      { k: "Latest", v: "PRXDIGY VXL.1 — first rap project, 2025" },
      { k: "Label",  v: "PRXDIGY LLC — independent" },
      { k: "Worked with", v: "Kayeandre · Abby Jasmine · JDE" }
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
      { src: "https://i.ytimg.com/vi/zkoz1tAjeEA/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/zkoz1tAjeEA/hqdefault.jpg", alt: "PRXD.JAY & Kayeandre — Sponsored" },
      { src: "https://i.ytimg.com/vi/Se1q1ejP65g/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/Se1q1ejP65g/hqdefault.jpg", alt: "PRXD.JAY & Kayeandre — Find You" },
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
    { after: "video", src: "https://i.ytimg.com/vi/zkoz1tAjeEA/maxresdefault.jpg", fallback: "https://i.ytimg.com/vi/zkoz1tAjeEA/hqdefault.jpg", caption: "SPONSORED — official video" }
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
      { title: "SPONSORED",     note: "with Kayeandre · Official video", id: "zkoz1tAjeEA" },
      { title: "FIND YOU",      note: "with Kayeandre · Official video", id: "Se1q1ejP65g" },
      { title: "P4RTY",         note: "ft. JDE · Official visualiser",   id: "rACq2a4tj2c" },
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
    caption: "Everything he's put out. Newest first.",
    featured: {
      title: "PRXDIGY VXL.1",
      type: "EP",
      year: "2025",
      spotifyAlbumId: "7reVqpxCzqE0df6fGIobVw",
      cover: "https://i.scdn.co/image/ab67616d0000b27323af26d29c34b6c9e6852dc0",
      url: "https://open.spotify.com/album/7reVqpxCzqE0df6fGIobVw",
      blurb: "His first rap project. PRAY · UPSET · WRIST · FANTASIZE · 9 to 5 — five tracks, twelve minutes, not a wasted bar.",
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
      { title: "P4RTY",                   year: "2025", type: "ft. JDE", id: "68TWroQpfsoPod9qlzm8az", cover: "https://i.scdn.co/image/ab67616d0000b27394d91f726bd8f07316deb33b" },
      { title: "Sorry You Feel That Way", year: "2024", type: "EP",     id: "43M4MemZfW5zijlSPaOmKF", cover: "https://i.scdn.co/image/ab67616d0000b273d43662578e32c8f0d6f2916b" },
      { title: "lost",                    year: "2024", type: "Single", id: "1rnzBT6kveAE4Cxn5hlDD8", cover: "https://i.scdn.co/image/ab67616d0000b27307bb233b57a11db425044499" },
      { title: "Leave You Behind",        year: "2024", type: "w/ Kayeandre", id: "0oU4MmtvCWQKrLQaemf1Hd", cover: "https://i.scdn.co/image/ab67616d0000b273c8b65797cc35c1a3661a212f" },
      { title: "too much",                year: "2024", type: "Single", id: "2SjlCp1mAPlmLMn2dddqVI", cover: "https://i.scdn.co/image/ab67616d0000b27325a99c019af9e511831489d5" },
      { title: "Amazin'",                 year: "2024", type: "Single", id: "7xQE57zjyum0NL1Vk2zOee", cover: "https://i.scdn.co/image/ab67616d0000b2736c20dbc865d06eda434f8083" },
      { title: "find a way",              year: "2024", type: "Single", id: "3UuKyc7XauNfZLhufwKqZt", cover: "https://i.scdn.co/image/ab67616d0000b273ede3a52ddd565a369ca574ae" },
      { title: "DNT TRN ME UP",           year: "2023", type: "Single", id: "6kKxvUe5GKSv6aH4iWaFhY", cover: "https://i.scdn.co/image/ab67616d0000b2738fa24af975dbff946937b1e0" }
    ]
  },

  /* ---------------------------------------------------------------------------
     12. CONTACT
     ------------------------------------------------------------------------ */
  contact: {
    heading: "CONTACT",
    caption: "Features, bookings, press. This inbox is read.",
    email: "prxd.jay@gmail.com",
    emailLabel: "Business inquiries",
    secondary: [
      { label: "DM on Instagram", url: "https://instagram.com/prxd.jay" }
    ]
  },

  /* ---------------------------------------------------------------------------
     13. FOOTER
     ------------------------------------------------------------------------ */
  footer: {
    mark: "PRXD.JAY",
    note: "pronounced Prodigy",
    rights: "All rights reserved.",
    links: [
      { label: "Privacy", url: "privacy.html" },
      { label: "Terms",   url: "terms.html" }
    ]
  },

  /* ---------------------------------------------------------------------------
     14. SHARING  — what gets sent when someone passes the site on
     ------------------------------------------------------------------------ */
  share: {
    title: "PRXD.JAY — pronounced Prodigy",
    text: "Play this loud.",
    url: "https://prxdjay.com"
  },

  /* ---------------------------------------------------------------------------
     15. ANALYTICS  — so you can see what's actually converting
     ------------------------------------------------------------------------
     All off by default. Nothing loads and nothing is tracked until you fill
     one in.
       plausible: your domain, e.g. "prxdjay.com"  (privacy-first, no banner)
       ga4:       "G-XXXXXXXXXX"                   (needs a cookie notice in most places)
     ------------------------------------------------------------------------ */
  analytics: {
    plausible: null,
    ga4: null
  },

  /* ---------------------------------------------------------------------------
     16. NAVIGATION
     ------------------------------------------------------------------------ */
  /* Every label here is the exact same word as the heading it jumps to.
     If you rename a section, rename it in both places — a nav that says one
     thing and lands on another is the fastest way to lose someone. */
  nav: [
    { label: "HOME",      target: "home" },
    { label: "ALL LINKS", target: "links" },
    { label: "MUSIC",     target: "music" },
    { label: "VIDEOS",    target: "video" },
    { label: "PHOTOS",    target: "gallery" },
    { label: "ABOUT",     target: "bio" },
    { label: "CONTACT",   target: "contact" }
  ]
};
