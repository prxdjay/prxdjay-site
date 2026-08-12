/* =============================================================================
   PRXD.JAY — FRAMEWORK RENDERER
   Reads window.ERA from era.config.js and builds the page.
   You should not need to edit this file to launch a new era.

   HARD RULES BAKED IN:
   · No audio or video ever autoplays. YouTube only loads after a real click.
   · All motion respects prefers-reduced-motion.
   · Everything is keyboard reachable.
   ========================================================================== */
(function () {
  "use strict";

  var E = window.ERA;
  if (!E) { console.error("era.config.js did not load."); return; }

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, cls, html) {
    var n = document.createElement(t);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  var set = function (id, txt) { var n = document.getElementById(id); if (n && txt != null) n.textContent = txt; };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* -------------------------------------------------------------------------
     SHARED STATE  — memory, analytics, and who's already a member
     ---------------------------------------------------------------------- */
  var KEY = {
    member:    "prxdjay.member",     // they joined. never ask again.
    lead:      "prxdjay.lead",       // what we know about them
    prompt:    "prxdjay.prompt",     // slide-up dismissed
    exit:      "prxdjay.exit",       // exit modal shown
    been:      "prxdjay.been",       // they've been here before
    skin:      "prxdjay.skin"
  };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    json: function (k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  };

  var isMember = function () { return store.get(KEY.member) === "1"; };

  /* Fires into Plausible / GA4 if either is configured. Silent no-op otherwise. */
  function track(event, props) {
    try {
      if (window.plausible) window.plausible(event, props ? { props: props } : undefined);
      if (window.gtag) window.gtag("event", event, props || {});
    } catch (e) {}
  }

  /* An image that heals itself: falls back, and catches YouTube's 120x90 grey
     "missing thumbnail" placeholder, which it serves instead of a 404. */
  function smartImg(src, fallback, onDead) {
    var img = el("img");
    var tried = false;
    img.alt = ""; img.decoding = "async";
    function dead() { if (onDead) onDead(img); else img.remove(); }
    function retry() {
      if (!tried && fallback && img.src.indexOf(fallback) === -1) { tried = true; img.src = fallback; return true; }
      return false;
    }
    img.onerror = function () { if (!retry()) dead(); };
    img.onload  = function () { if (img.naturalWidth <= 120 && !retry()) dead(); };
    img.src = src;
    return img;
  }

  var isClip = function (u) { return /\.(mp4|webm|mov)(\?|#|$)/i.test(String(u || "")); };

  /* Slides accept a plain URL string or { src, fallback }. */
  function normSlides(arr) {
    return (arr || []).map(function (s) {
      return typeof s === "string" ? { src: s } : (s || {});
    }).filter(function (s) { return s.src; });
  }

  /* One slide -> an <img> or a silent looping <video>. Mix them freely.

     Only the first clip is fetched up front. The rest carry their URL in a
     data attribute and don't touch the network until they're about to be
     shown — so a visitor who never scrolls past the first frame downloads
     one clip, not four. */
  function slideNode(s, first) {
    if (isClip(s.src)) {
      var v = el("video");
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.setAttribute("aria-hidden", "true");
      v.dataset.src = s.src;

      // A phone that won't play the clip still gets the frame behind it.
      v.onerror = function () {
        if (!s.fallback) { v.remove(); return; }
        var img = smartImg(s.fallback);
        img.className = v.className;
        if (v.parentNode) v.parentNode.replaceChild(img, v);
      };

      // NOT armed here on purpose. play() on an element that isn't in the
      // document yet gets rejected and the clip sits paused on a black frame.
      // The caller arms it after appending. See armFirst().
      return v;
    }
    var img = smartImg(s.src, s.fallback);
    if (first) img.fetchPriority = "high"; else img.loading = "lazy";
    return img;
  }

  /* Start the first slide, once it's actually in the document. */
  function armFirst(nodes) {
    var first = nodes && nodes[0];
    if (first && first.tagName === "VIDEO") armClip(first);
  }

  /* Give a deferred clip its source and start it. Safe to call repeatedly.

     The wait matters: calling play() on an element that is still loading gets
     rejected ("interrupted by a new load request") and the clip then sits on
     a black frame forever. So if it isn't ready yet, play on `canplay`. */
  function armClip(v) {
    if (!v || v.tagName !== "VIDEO") return;
    if (!v.src && v.dataset.src) { v.preload = "auto"; v.src = v.dataset.src; }
    if (reduced) return;                    // motion off: load a frame, hold it
    v.autoplay = true;

    function go() {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    if (v.readyState >= 2) go();
    else v.addEventListener("canplay", go, { once: true });
  }

  /* Rotate a set of slides.

     A clip plays through ONCE and then hands over — it never loops back on
     itself mid-slide. A still has no natural end, so it holds for `hold` ms.
     That means the rhythm of the hero is set by the footage, not by a timer:
     a 2-second cut moves on in 2 seconds, a 6-second one gets its 6. */
  function runSlides(nodes, hold) {
    if (reduced || !nodes || nodes.length < 2) return;
    var i = 0, timer = null, gen = 0;

    function clear() { if (timer) { clearTimeout(timer); timer = null; } }

    // Fetch the next clip while the current one plays, so its turn never
    // opens on a black frame.
    function preload(n) {
      if (n && n.tagName === "VIDEO" && !n.src && n.dataset.src) {
        n.preload = "auto"; n.src = n.dataset.src;
      }
    }

    var cleanup = null;

    function play(n) {
      clear();
      if (cleanup) { cleanup(); cleanup = null; }
      var g = ++gen;                       // stale handlers check this and bail
      var advance = function () { if (g === gen) next(); };

      if (n.tagName !== "VIDEO") {
        if (n.parentNode) n.parentNode.setAttribute("data-kind", "still");
        timer = setTimeout(advance, hold || 5000);
        return;
      }

      if (n.parentNode) n.parentNode.setAttribute("data-kind", "clip");
      n.loop = false;                      // play once, then hand over
      try { n.currentTime = 0; } catch (e) {}

      /* Safety net for the case where `ended` never arrives — autoplay
         blocked, dead file, a tab that got backgrounded mid-clip.

         It has to be measured from the time left on the clip, not from now:
         a clip that spends a second loading would otherwise get cut off a
         second early. So recalculate whenever playback actually starts or
         the duration first becomes known. */
      function safety() {
        clear();
        var d = n.duration, t = n.currentTime || 0;
        var left = (d && isFinite(d) && d > 0) ? (d - t) * 1000 : 6000;
        timer = setTimeout(advance, left + 2000);
      }

      n.addEventListener("ended", advance);
      n.addEventListener("playing", safety);
      n.addEventListener("loadedmetadata", safety);
      cleanup = function () {
        n.removeEventListener("ended", advance);
        n.removeEventListener("playing", safety);
        n.removeEventListener("loadedmetadata", safety);
      };

      armClip(n);
      safety();
    }

    function next() {
      clear();
      var live = nodes.filter(function (n) { return n.isConnected; });
      if (live.length < 2) return;

      var cur = live[i % live.length];
      cur.classList.remove("is-on");
      if (cur.tagName === "VIDEO") { try { cur.pause(); } catch (e) {} }

      i = (i + 1) % live.length;
      var nxt = live[i];
      nxt.classList.remove("is-on");
      void nxt.offsetWidth;                // restart the drift from the top
      nxt.classList.add("is-on");
      play(nxt);
      preload(live[(i + 1) % live.length]);
    }

    play(nodes[0]);
    preload(nodes[1]);
  }

  /* -------------------------------------------------------------------------
     ICONS  (inline SVG — no icon font, no extra request)
     ---------------------------------------------------------------------- */
  var ICON = {
    spotify:  '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.75.75 0 01-1 .25c-2.8-1.7-6.3-2.1-10.4-1.16a.75.75 0 11-.33-1.46c4.5-1.02 8.4-.56 11.5 1.34.36.22.47.68.23 1.03zm1.2-2.9a.94.94 0 01-1.29.31c-3.2-1.97-8.1-2.54-11.9-1.39a.94.94 0 11-.54-1.8c4.3-1.3 9.7-.66 13.4 1.6.44.27.58.85.33 1.28zm.1-3.02C14.06 8.2 7.9 8 4.6 9a1.12 1.12 0 11-.65-2.15C7.76 5.7 14.56 5.93 18.9 8.5a1.12 1.12 0 11-1.14 1.93z"/>',
    apple:    '<path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.85-1.45-.15-2.83.85-3.57.85-.73 0-1.87-.83-3.07-.81-1.58.02-3.03.92-3.84 2.33-1.63 2.84-.42 7.05 1.17 9.36.78 1.13 1.71 2.4 2.93 2.35 1.18-.05 1.62-.76 3.05-.76 1.42 0 1.82.76 3.06.74 1.26-.02 2.06-1.15 2.83-2.29.89-1.31 1.26-2.58 1.28-2.65-.03-.01-2.45-.94-2.47-3.72zM14.1 5.4c.65-.79 1.09-1.88.97-2.98-.94.04-2.07.63-2.74 1.41-.6.7-1.13 1.81-.99 2.88 1.05.08 2.11-.53 2.76-1.31z"/>',
    youtube:  '<path d="M21.6 7.2s-.2-1.4-.8-2c-.76-.8-1.6-.8-2-.85C16 4.2 12 4.2 12 4.2h-.02s-4 0-6.8.15c-.4.05-1.24.05-2 .85-.6.6-.8 2-.8 2S2.2 8.85 2.2 10.5v1.55c0 1.65.2 3.3.2 3.3s.2 1.4.8 2c.76.8 1.76.78 2.2.86 1.6.15 6.8.2 6.8.2s4 0 6.8-.16c.4-.05 1.24-.05 2-.85.6-.6.8-2 .8-2s.2-1.65.2-3.3V10.5c0-1.65-.2-3.3-.2-3.3zM9.9 14.1V8.6l5.2 2.76-5.2 2.74z"/>',
    instagram:'<path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.24a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2zm0 10.89a4.29 4.29 0 110-8.58 4.29 4.29 0 010 8.58zm8.4-11.15a1.54 1.54 0 11-3.08 0 1.54 1.54 0 013.08 0z"/>',
    tiktok:   '<path d="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.59 2.59 0 112.59-2.59V12.2a5.68 5.68 0 105.68 5.68V9.4a7.3 7.3 0 004.28 1.38V7.7a4.28 4.28 0 01-3.81-1.88z"/>',
    x:        '<path d="M17.3 3h3.3l-7.2 8.24L21.9 21h-6.6l-5.17-6.77L4.2 21H.9l7.7-8.8L.4 3h6.77l4.67 6.18L17.3 3zm-1.16 16.03h1.83L6.02 4.86H4.05l12.09 14.17z"/>',
    wave:     '<path d="M2 12h2.2l1.6-5.6L8 18l2.2-13 2.3 16 2.1-11.4L16.8 12H22"  fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    square:   '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="8.6" y="8.6" width="6.8" height="6.8" rx="1.4"/>',
    link:     '<path d="M10.6 13.4a4 4 0 015.66 0l.7.7a4 4 0 01-5.66 5.66l-1.4-1.42M13.4 10.6a4 4 0 00-5.66 0l-.7.7a4 4 0 005.66 5.66" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    star:     '<path d="M12 2.6l2.9 5.88 6.5.95-4.7 4.58 1.11 6.46L12 17.42l-5.81 3.05 1.11-6.46-4.7-4.58 6.5-.95L12 2.6z"/>',
    check:    '<path d="M4 12.6l5.2 5.2L20 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    mail:     '<path d="M3.2 6.4h17.6v11.2H3.2zM3.6 7l8.4 6 8.4-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function svg(name, cls) {
    var p = ICON[name] || ICON.link;
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' + p + "</svg>";
  }
  var ARROW = '<svg class="hub__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* -------------------------------------------------------------------------
     EXPERIENCE FLAGS -> <html> attributes (CSS reads these)
     ---------------------------------------------------------------------- */
  var X = E.experience || {};
  root.setAttribute("data-motion",  reduced ? "off" : "on");
  root.setAttribute("data-grain",   X.grain === false || reduced ? "off" : "on");
  root.setAttribute("data-glow",    X.ambientGlow === false ? "off" : "on");
  root.setAttribute("data-shimmer", X.chromeShimmer === false || reduced ? "off" : "on");
  if (E.era && E.era.id) root.setAttribute("data-era", E.era.id);

  // Film grain generated in-browser (no image file to ship)
  document.documentElement.style.setProperty("--grain-url",
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")");

  /* -------------------------------------------------------------------------
     IDENTITY / TITLES
     ---------------------------------------------------------------------- */
  var ID = E.identity || {};
  set("curtainMark", ID.name);
  set("curtainSay",  ID.pronunciation);
  set("hdrMark",     ID.name);
  set("heroName",    (E.hero && E.hero.headline) || ID.name);
  set("heroSay",     (E.hero && E.hero.sub) || ID.pronunciation);
  set("ftrMark",     (E.footer && E.footer.mark) || ID.name);
  set("ftrNote",     (E.footer && E.footer.note) || ID.pronunciation);
  set("hdrEra",      (E.era && E.era.name) ? "ERA " + (E.era.id||"") + " · " + E.era.name : (ID.tagline || ""));
  set("navFoot",     (E.era && E.era.name) ? "ERA " + (E.era.id||"") + " — " + E.era.name : (ID.tagline || ""));
  set("railFoot",    ID.pronunciation || "");
  var fl = document.getElementById("ftrLegal");
  if (fl) {
    var flinks = ((E.footer && E.footer.links) || []).map(function (l) {
      return '<a href="' + esc(l.url) + '">' + esc(l.label) + "</a>";
    }).join('<span aria-hidden="true"> · </span>');
    fl.innerHTML =
      "© " + new Date().getFullYear() + " " + esc(ID.name || "") + "<br>" +
      esc((E.footer && E.footer.rights) || "All rights reserved.") +
      (ID.legalName ? "<br>" + esc(ID.legalName) : "") +
      (flinks ? '<br><span class="ftr__links">' + flinks + "</span>" : "");
  }

  /* -------------------------------------------------------------------------
     ANALYTICS — nothing loads unless a key is filled in in era.config.js.
     ---------------------------------------------------------------------- */
  (function analytics() {
    var A = E.analytics || {};
    if (A.plausible) {
      var s = el("script");
      s.defer = true; s.dataset.domain = A.plausible;
      s.src = "https://plausible.io/js/script.js";
      document.head.appendChild(s);
      window.plausible = window.plausible || function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
    }
    if (A.ga4) {
      var g = el("script");
      g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(A.ga4);
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", A.ga4);
    }
  })();

  /* -------------------------------------------------------------------------
     HERO
     ---------------------------------------------------------------------- */
  (function hero() {
    var H = E.hero || {};
    var kickEl = $("#heroKicker");
    if (kickEl) { if (H.kicker) kickEl.textContent = H.kicker; else kickEl.remove(); }
    set("heroScroll", H.scrollHint || "scroll");

    var st = $("#heroSticker");
    if (st) {
      if (H.sticker) st.textContent = H.sticker;
      else if (E.era && E.era.name) st.textContent = "ERA " + (E.era.id || "") + " \u00B7 " + E.era.name;
      else st.remove();
    }

    var media = $("#heroMedia");
    media.style.setProperty("--focal", H.focalPoint || "50% 35%");

    var slides = normSlides(H.slides);

    if (H.video) {
      // Muted, looping, decorative background only. Never plays audio.
      var v = el("video");
      v.src = H.video; v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.setAttribute("aria-hidden", "true");
      if (!reduced) { v.autoplay = true; v.play().catch(function () {}); }
      media.appendChild(v);
    } else if (slides.length > 1) {
      var wrapS = el("div", "hero__slides");
      var nodes = [];
      slides.forEach(function (s, i) {
        var n = slideNode(s, i === 0);
        // Each slide drifts a different way, so a set of stills reads as footage
        // rather than as a stack of photos. Clips get the same treatment.
        // A still can't move on its own, so it gets its own treatment
        // rather than sharing the clips' drift.
        n.classList.add(n.tagName === "IMG" ? "drift-still" : "drift-" + (i % 4));
        if (i === 0) n.classList.add("is-on");
        wrapS.appendChild(n); nodes.push(n);
      });
      media.appendChild(wrapS);
      armFirst(nodes);
      runSlides(nodes, 5000);   // clips run their length; stills hold 5s
    } else if (H.image) {
      var img = el("img");
      img.src = H.image;
      img.alt = "";
      img.fetchPriority = "high";
      img.decoding = "async";
      img.onerror = function () { media.classList.add("is-empty"); img.remove(); };
      media.appendChild(img);
    } else {
      media.classList.add("is-empty");
    }

    var cta = $("#heroCta");
    var primary = (E.links && E.links.items || []).filter(function (i) { return i.type === "primary" && !i.hidden; })[0];

    var ctas = H.ctas && H.ctas.length ? H.ctas : [
      { label: (primary && primary.cta) || "PLAY ON SPOTIFY", style: "solid", primary: true },
      { label: "JOIN THE LIST", style: "ghost", target: "list" }
    ];

    ctas.forEach(function (c) {
      var url = c.url || (c.primary && primary ? primary.url : null);
      if (!url && !c.target) return;
      var a = el("a", "btn btn--" + (c.style === "solid" ? "solid" : "ghost"), "<span>" + esc(c.label) + "</span>");
      if (c.target) {
        a.href = "#" + c.target;
      } else {
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        if (c.primary && primary) a.setAttribute("aria-label", "Listen to " + primary.label);
      }
      a.addEventListener("click", function () { track("hero_cta", { label: c.label }); });
      cta.appendChild(a);
    });

    // The on-ramp for someone who has never heard him: one obvious first play.
    var sh = H.startHere;
    if (sh && sh.url && sh.label) {
      var p = el("p", "hero__start");
      p.innerHTML = esc(sh.text || "Start with") + " " +
        '<a href="' + esc(sh.url) + '" target="_blank" rel="noopener">' + esc(sh.label) + "</a>";
      p.querySelector("a").addEventListener("click", function () { track("start_here"); });
      $(".hero__inner").appendChild(p);
    }
  })();

  /* -------------------------------------------------------------------------
     NAV
     ---------------------------------------------------------------------- */
  (function nav() {
    var list = $("#navList");
    var bar  = $("#hdrNav");
    var rail = $("#railList");
    (E.nav || []).forEach(function (item, i) {
      if (!document.getElementById(item.target)) return;
      var li = el("li");
      var a = el("a", "nav__link",
        "<span>" + String(i + 1).padStart(2, "0") + "</span>" + esc(item.label));
      a.href = "#" + item.target;
      li.appendChild(a); list.appendChild(li);

      // Same items, same order, always visible on a wide screen.
      if (bar && item.target !== "home") {
        var b = el("a");
        b.className = item.primary ? "hdr__nav--join" : "";
        b.href = "#" + item.target;
        b.textContent = item.label;
        bar.appendChild(b);
      }

      // And in the desktop side rail, which never closes.
      if (rail && item.target !== "home") {
        var rli = el("li");
        var r = el("a", "rail__link" + (item.primary ? " rail__link--join" : ""),
          '<span class="rail__n">' + String(i).padStart(2, "0") + "</span>" +
          '<span class="rail__t">' + esc(item.label) + "</span>");
        r.href = "#" + item.target;
        rli.appendChild(r);
        rail.appendChild(rli);
      }
    });

    var btn = $("#menuBtn"), navEl = $("#nav"), label = $("#menuLabel");
    function toggle(open) {
      btn.setAttribute("aria-expanded", String(open));
      navEl.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
      label.textContent = open ? "CLOSE" : "MENU";
      if (open) { var f = navEl.querySelector("a"); if (f) f.focus(); }
    }
    btn.addEventListener("click", function () { toggle(btn.getAttribute("aria-expanded") !== "true"); });
    navEl.addEventListener("click", function (e) { if (e.target.closest("a")) toggle(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navEl.classList.contains("is-open")) { toggle(false); btn.focus(); }
    });

    // Sticky header state + active section
    var hdr = $("#hdr");
    var onScroll = function () { hdr.classList.toggle("is-stuck", window.scrollY > 40); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

    if ("IntersectionObserver" in window) {
      var links = [].slice.call(list.querySelectorAll("a"))
        .concat(bar  ? [].slice.call(bar.querySelectorAll("a"))  : [])
        .concat(rail ? [].slice.call(rail.querySelectorAll("a")) : []);
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) {
            l.setAttribute("aria-current", l.getAttribute("href") === "#" + en.target.id ? "true" : "false");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      (E.nav || []).forEach(function (n) {
        var s = document.getElementById(n.target); if (s) spy.observe(s);
      });
    }
  })();

  /* -------------------------------------------------------------------------
     LINK HUB
     ---------------------------------------------------------------------- */
  (function hub() {
    var L = E.links || {};
    if (L.heading) set("linksH", L.heading);   // heading + nav label stay in sync
    set("linksCap", L.caption);
    var box = $("#hub"), n = 0;
    (L.items || []).forEach(function (it) {
      if (it.hidden) return;
      var a = el("a", "hub__item" + (it.type === "primary" ? " hub__item--primary" : ""));
      a.href = it.url || "#";
      if (/^https?:/.test(a.href)) { a.target = "_blank"; a.rel = "noopener"; }
      n += 1;
      a.innerHTML =
        (it.type === "primary"
          ? (it.art ? '<img class="hub__art" src="' + esc(it.art) + '" alt="" loading="lazy">' : "")
          : (it.icon ? svg(it.icon, "hub__ico") : '<span class="hub__num">' + String(n - 1).padStart(2, "0") + "</span>")) +
        '<span class="hub__txt">' +
          '<span class="hub__label">' + esc(it.label) + "</span>" +
          '<span class="hub__dots" aria-hidden="true"></span>' +
          (it.note ? '<span class="hub__note">' + esc(it.note) + "</span>" : "") +
        "</span>" +
        (it.cta ? '<span class="hub__cta">' + esc(it.cta) + "</span>" : "") + ARROW;
      box.appendChild(a);
    });
  })();

  /* -------------------------------------------------------------------------
     BIO
     ---------------------------------------------------------------------- */
  (function bio() {
    var B = E.bio || {};
    if (B.heading) set("bioH", B.heading);
    set("bioQuote", B.pullQuote);
    if (!B.pullQuote) $("#bioQuote").style.display = "none";

    var body = $("#bioBody");
    (B.body || []).forEach(function (p) { body.appendChild(el("p", null, esc(p))); });

    var fig = $("#bioPortrait");
    if (B.portrait) {
      var img = el("img");
      img.src = B.portrait; img.alt = B.portraitAlt || ""; img.loading = "lazy"; img.decoding = "async";
      img.onerror = function () {
        img.remove();
        fig.innerHTML = '<div class="gal__ph"><b>ARTIST PORTRAIT</b><span>Drop bio.jpg in /assets/img/</span></div>';
      };
      fig.appendChild(img);
    }

    var stats = $("#bioStats");
    (B.stats || []).forEach(function (s) {
      stats.appendChild(el("div", "bio__stat", "<b>" + esc(s.value) + "</b><span>" + esc(s.label) + "</span>"));
    });
    if (!(B.stats || []).length) stats.style.display = "none";

    var facts = $("#bioFacts");
    (B.facts || []).forEach(function (f) {
      facts.appendChild(el("div", "bio__fact", "<dt>" + esc(f.k) + "</dt><dd>" + esc(f.v) + "</dd>"));
    });
  })();

  /* -------------------------------------------------------------------------
     GALLERY + LIGHTBOX
     ---------------------------------------------------------------------- */
  (function gallery() {
    var G = E.gallery || {}; set("galCap", G.caption);
    if (G.heading) set("galH", G.heading);
    var grid = $("#gal");
    if (G.ratio) grid.style.setProperty("--gal-ratio", G.ratio);
    var real = [];

    (G.items || []).forEach(function (it) {
      var cell = el("div", "gal__cell");
      if (it.placeholder) {
        cell.innerHTML = '<div class="gal__ph"><b>' + esc(it.label || "ERA PHOTO") +
                         "</b><span>" + esc(it.src) + "</span></div>";
      } else {
        var idx = real.length; real.push(it);
        var btn = el("button", null, "");
        btn.type = "button";
        btn.setAttribute("aria-label", "Open photo: " + (it.alt || "PRXD.JAY"));
        btn.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
        var img = el("img");
        img.src = it.src; img.alt = it.alt || ""; img.loading = "lazy"; img.decoding = "async";
        img.onerror = function () {
          if (it.fallback && img.src.indexOf(it.fallback) === -1) { img.src = it.fallback; return; }
          cell.remove();   // dead tile: remove it rather than leave a hole
        };
        // YouTube serves a 120x90 grey placeholder instead of a 404 for missing
        // max-res thumbs. Catch that too and fall back.
        img.onload = function () {
          if (img.naturalWidth <= 120 && it.fallback && img.src.indexOf(it.fallback) === -1) {
            img.src = it.fallback;
          } else if (img.naturalWidth <= 120) {
            cell.remove();
          }
        };
        cell.appendChild(img); cell.appendChild(btn);
        btn.addEventListener("click", function () { open(idx); });
      }
      grid.appendChild(cell);
    });

    var lbx = $("#lbx"), lbxImg = $("#lbxImg"), cur = 0, lastFocus = null;
    function open(i) {
      if (!real.length) return;
      cur = i; lastFocus = document.activeElement;
      lbxImg.src = real[cur].src; lbxImg.alt = real[cur].alt || "";
      lbx.classList.add("is-open"); document.body.classList.add("is-locked");
      $("#lbxClose").focus();
    }
    function close() {
      lbx.classList.remove("is-open"); document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }
    function step(d) {
      cur = (cur + d + real.length) % real.length;
      lbxImg.src = real[cur].src; lbxImg.alt = real[cur].alt || "";
    }
    $("#lbxClose").addEventListener("click", close);
    $("#lbxPrev").addEventListener("click", function () { step(-1); });
    $("#lbxNext").addEventListener("click", function () { step(1); });
    lbx.addEventListener("click", function (e) { if (e.target === lbx) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lbx.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    if (real.length < 2) { $("#lbxPrev").hidden = true; $("#lbxNext").hidden = true; }
  })();

  /* -------------------------------------------------------------------------
     VIDEO — click-to-load facade. NOTHING loads or plays until a real click.
     ---------------------------------------------------------------------- */
  (function video() {
    var V = E.video || {};
    if (V.heading) set("vidH", V.heading);
    set("vidCap", V.caption);
    var box = $("#vids");

    (V.items || []).forEach(function (it) {
      var card = el("div", "vid" + (it.placeholder || !it.id ? " vid--ph" : ""));

      if (it.placeholder || !it.id) {
        card.innerHTML =
          '<div class="vid__phbg"></div>' +
          '<div class="vid__btn"><span class="vid__play" aria-hidden="true"></span></div>' +
          '<span class="vid__meta"><span class="vid__title">' + esc(it.title) + "</span>" +
          '<span class="vid__note">' + esc(it.note || "Video slot — add a YouTube ID") + "</span></span>";
        box.appendChild(card);
        return;
      }

      var thumb = it.thumb || ("https://i.ytimg.com/vi/" + it.id + "/maxresdefault.jpg");
      var btn = el("button", "vid__btn");
      btn.type = "button";
      btn.setAttribute("aria-label", "Play video: " + (it.title || "PRXD.JAY"));
      btn.innerHTML = '<span class="vid__play" aria-hidden="true"></span>';

      var img = el("img");
      img.src = thumb; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      var fb = "https://i.ytimg.com/vi/" + it.id + "/hqdefault.jpg";
      img.onerror = function () {
        if (img.src.indexOf("hqdefault") === -1) { img.src = fb; return; }
        card.remove();                       // no thumbnail at all: drop the tile
      };
      // YouTube returns a 120x90 grey placeholder instead of a 404 when a
      // max-res thumb doesn't exist. Catch that and fall back.
      img.onload = function () {
        if (img.naturalWidth <= 120) {
          if (img.src.indexOf("hqdefault") === -1) img.src = fb;
          else card.remove();
        }
      };

      card.appendChild(img);
      card.appendChild(btn);
      card.insertAdjacentHTML("beforeend",
        '<span class="vid__meta"><span class="vid__title">' + esc(it.title) + "</span>" +
        (it.note ? '<span class="vid__note">' + esc(it.note) + "</span>" : "") + "</span>");

      btn.addEventListener("click", function () {
        var f = el("iframe");
        // autoplay=1 here is USER-INITIATED (they just clicked play). Nothing plays on load.
        f.src = "https://www.youtube-nocookie.com/embed/" + it.id + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
        f.title = it.title || "PRXD.JAY video";
        f.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
        f.allowFullscreen = true;
        card.innerHTML = ""; card.appendChild(f);
      });

      box.appendChild(card);
    });

    var ch = $("#vidChannel");
    if (V.channelUrl) { ch.href = V.channelUrl; ch.textContent = V.channelLabel || "WATCH ALL ON YOUTUBE"; }
    else ch.parentNode.remove();
  })();

  /* -------------------------------------------------------------------------
     MUSIC — Spotify embeds load lazily on scroll. Spotify never autoplays.
     ---------------------------------------------------------------------- */
  (function music() {
    var M = E.music || {};
    if (M.heading) set("musH", M.heading);
    set("musCap", M.caption);

    var F = M.featured;
    if (F) {
      var wrapF = $("#feat");
      var art = el("figure", "feat__art");
      if (F.cover) {
        var ci = el("img");
        ci.src = F.cover; ci.alt = F.title ? F.title + " cover art" : ""; ci.loading = "lazy";
        ci.onerror = function () {
          ci.remove();
          art.innerHTML = '<div class="gal__ph"><b>COVER ART</b><span>Add to era.config.js</span></div>';
        };
        art.appendChild(ci);
      }
      var body = el("div", "feat__body");
      body.innerHTML =
        '<span class="feat__meta">Featured · ' + esc(F.type || "") + " · " + esc(F.year || "") + "</span>" +
        '<h3 class="display feat__title">' + esc(F.title) + "</h3>" +
        (F.blurb ? '<p class="feat__blurb">' + esc(F.blurb) + "</p>" : "") +
        (F.url ? '<p><a class="btn btn--solid" href="' + esc(F.url) + '" target="_blank" rel="noopener">' + esc(F.cta || "PLAY ON SPOTIFY") + '</a></p>' : "");

      // The one line on the page in his own voice, in his own handwriting.
      if (F.story) {
        var sc = el("p", "scrawl feat__story", esc(F.story));
        body.appendChild(sc);
      }

      if (F.spotifyAlbumId) {
        var emb = el("div", "embed");
        emb.dataset.spotify = "https://open.spotify.com/embed/album/" + F.spotifyAlbumId + "?theme=0";
        emb.dataset.h = "352";
        body.appendChild(emb);
      }
      wrapF.appendChild(art); wrapF.appendChild(body);
    } else { $("#feat").remove(); }

    var arch = $("#archive");
    var list = M.archive || M.catalog || [];
    if (!list.length) { if (arch) arch.remove(); }
    else {
      var btn = el("button", "arch__btn");
      btn.type = "button"; btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", "archPanel");
      btn.innerHTML = "<span>" + esc(M.archiveLabel || "THE ARCHIVE") + "</span>" +
        "<i>" + esc(M.archiveNote || "") + " · " + list.length + " releases</i><u>\u25BE</u>";
      var panel = el("div", "arch__panel"); panel.id = "archPanel";
      var relBox = el("div", "rel"); panel.appendChild(relBox);
      arch.appendChild(btn); arch.appendChild(panel);
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.classList.toggle("is-open", !open);
      });
    list.forEach(function (r, ri) {
      var a = el("a", "rel__item",
        '<span class="rel__num">' + String(ri + 1).padStart(2, "0") + "</span>" +
        (r.cover ? '<img class="rel__art" src="' + esc(r.cover) + '" alt="" loading="lazy" decoding="async">' : "") +
        '<span class="rel__title">' + esc(r.title) + "</span>" +
        '<span class="rel__dots" aria-hidden="true"></span>' +
        '<span class="rel__meta">' + esc(r.type || "") + " \u00b7 " + esc(r.year || "") + "</span>");
      a.href = "https://open.spotify.com/album/" + r.id;
      a.target = "_blank"; a.rel = "noopener";
      relBox.appendChild(a);
    });
    }

    // Lazy-mount Spotify iframes only when scrolled near.
    var pending = [].slice.call(document.querySelectorAll("[data-spotify]"));
    function mount(node) {
      var f = el("iframe");
      f.src = node.dataset.spotify;
      f.height = node.dataset.h || "352";
      f.title = "Spotify player";
      f.loading = "lazy";
      f.allow = "clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      node.appendChild(f);
      delete node.dataset.spotify;
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) { mount(en.target); io.unobserve(en.target); }
        });
      }, { rootMargin: "300px" });
      pending.forEach(function (n) { io.observe(n); });
    } else { pending.forEach(mount); }
  })();

  /* =========================================================================
     JOIN — the one component behind every signup on the site.
     -------------------------------------------------------------------------
     The section, the slide-up bar and the exit modal all mount this same
     thing, so there is exactly one place to change how signup behaves.

     THE FLOW, AND WHY:
       step 1  email only. One field, one tap. Asking for less here is the
               single biggest lever on how many people finish.
       step 2  name + phone, asked AFTER they've already committed. Anyone
               who stops here is still on the email list — nothing is lost.
       step 3  the payoff. A record to play and something to send a friend.
     ====================================================================== */
  var JOIN = (function () {
    var L = E.list || {};
    var endpoint = String(L.endpoint || "");
    var configured = /^https?:\/\//.test(endpoint) && endpoint.indexOf("YOUR_FORM_ID") === -1;
    var listeners = [];
    var uid = 0;

    if (!configured && endpoint) {
      console.warn("[PRXD.JAY] list.endpoint isn't set up yet — signups will fall back to the mail app. See SETUP-THE-LIST.md");
    }

    function lead() { return store.json(KEY.lead) || {}; }
    function remember(patch) {
      var d = lead();
      Object.keys(patch).forEach(function (k) { if (patch[k]) d[k] = patch[k]; });
      store.set(KEY.lead, JSON.stringify(d));
      return d;
    }
    function onJoin(fn) { listeners.push(fn); }
    function announce() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

    /* ----------------------------------------------------------------------
       SEND. Resolves true/false. Never throws, never loses the record —
       anything that fails is kept locally so nothing typed is thrown away.
       ------------------------------------------------------------------- */
    function send(fields, cb) {
      remember(fields);

      var payload = {
        email:        fields.email || lead().email || "",
        name:         fields.name || "",
        phone:        fields.phone || "",
        sms_consent:  fields.sms_consent || "no",
        consent_text: fields.consent_text || "",
        consent_at:   new Date().toISOString(),
        source:       fields.source || "site",
        stage:        fields.stage || "email",
        page:         location.href,
        referrer:     document.referrer || "direct",
        _subject:     "Inner Circle — " + (fields.stage === "phone" ? "phone added" : "new signup")
      };

      if (!configured) {
        // Nothing set up yet: hand it to the mail app so the signup still
        // reaches him. Lossy — this is why SETUP-THE-LIST.md matters.
        var to = L.fallbackEmail || (E.contact && E.contact.email) || "";
        var body = Object.keys(payload).map(function (k) { return k + ": " + payload[k]; }).join("\r\n");
        window.location.href = "mailto:" + encodeURIComponent(to) +
          "?subject=" + encodeURIComponent(payload._subject) +
          "&body=" + encodeURIComponent(body);
        cb(true);
        return;
      }

      var opaque = (L.transport === "opaque");
      var opts = opaque
        ? { method: "POST", mode: "no-cors", body: new URLSearchParams(payload) }
        : { method: "POST", headers: { Accept: "application/json" }, body: toFormData(payload) };

      fetch(endpoint, opts)
        .then(function (r) {
          // A no-cors response is always opaque — we can't read it, so a
          // resolved promise is the only success signal available.
          if (!opaque && !r.ok) throw new Error("bad response");
          cb(true);
        })
        .catch(function () { cb(false); });
    }

    function toFormData(o) {
      var fd = new FormData();
      Object.keys(o).forEach(function (k) { fd.append(k, o[k]); });
      return fd;
    }

    /* ----------------------------------------------------------------------
       MOUNT. opts = { source, compact, onDone }
       `compact` is the one-line inline version used in the slide-up bar.
       ------------------------------------------------------------------- */
    function mount(box, opts) {
      opts = opts || {};
      var src = opts.source || "site";
      var n = ++uid;
      var id = function (s) { return "jf" + n + "-" + s; };

      if (isMember()) { return renderDone(box, opts); }
      renderStep1();

      /* ---- STEP 1 — email only ---- */
      function renderStep1() {
        box.innerHTML =
          '<form class="form join' + (opts.compact ? " join--compact" : "") + '" novalidate>' +
            '<div class="join__row">' +
              '<div class="field field--grow">' +
                '<label for="' + id("email") + '">' + esc(L.emailLabel || "Email") + "</label>" +
                '<input id="' + id("email") + '" name="email" type="email" required ' +
                  'autocomplete="email" inputmode="email" spellcheck="false" ' +
                  'placeholder="' + esc(L.emailPlaceholder || "you@email.com") + '">' +
              "</div>" +
              '<button class="btn btn--solid join__go" type="submit"><span>' +
                esc(L.submitLabel || "I'M IN") + "</span></button>" +
            "</div>" +
            '<input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            (opts.compact ? "" : '<p class="join__fine">' + esc(L.reassure || "") + "</p>") +
            '<p class="form__msg" role="status" aria-live="polite"></p>' +
          "</form>";

        var form = box.querySelector("form");
        var msg  = box.querySelector(".form__msg");
        var btn  = box.querySelector(".join__go");
        var input = form.email;

        track("join_view", { source: src });

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          if (form._gotcha.value) return;                       // bot
          msg.textContent = ""; msg.removeAttribute("data-state");

          if (!input.checkValidity() || !input.value.trim()) {
            msg.textContent = "That email doesn't look right.";
            msg.setAttribute("data-state", "err");
            input.focus();
            return;
          }

          setBusy(btn, true, "SENDING");
          track("join_email", { source: src });

          send({ email: input.value.trim(), source: src, stage: "email" }, function (ok) {
            setBusy(btn, false, L.submitLabel || "I'M IN");
            if (!ok) {
              msg.textContent = L.errorMsg || "That didn't send. Try again in a second.";
              msg.setAttribute("data-state", "err");
              return;
            }
            store.set(KEY.member, "1");
            announce();
            renderStep2();
          });
        });
      }

      /* ---- STEP 2 — name + phone, post-commitment ---- */
      function renderStep2() {
        var S = L.step2 || {};
        var consent = S.consentText || "";
        box.innerHTML =
          '<div class="join__done-head">' +
            '<p class="join__title">' + esc(S.title || "You're in.") + "</p>" +
            '<p class="join__body">' + esc(S.body || "") + "</p>" +
          "</div>" +
          '<form class="form join" novalidate>' +
            '<div class="join__two">' +
              '<div class="field">' +
                '<label for="' + id("name") + '">' + esc(S.nameLabel || "First name") + "</label>" +
                '<input id="' + id("name") + '" name="name" type="text" autocomplete="given-name" ' +
                  'placeholder="' + esc(S.namePlaceholder || "") + '">' +
              "</div>" +
              '<div class="field">' +
                '<label for="' + id("phone") + '">' + esc(S.phoneLabel || "Phone") + "</label>" +
                '<input id="' + id("phone") + '" name="phone" type="tel" autocomplete="tel" inputmode="tel" ' +
                  'placeholder="' + esc(S.phonePlaceholder || "") + '">' +
              "</div>" +
            "</div>" +
            '<label class="consent"><input type="checkbox" name="consent">' +
              "<span>" + esc(consent) + "</span></label>" +
            '<div class="join__row join__row--end">' +
              '<button class="btn btn--solid join__go" type="submit"><span>' +
                esc(S.submitLabel || "TEXT ME TOO") + "</span></button>" +
              '<button class="join__skip" type="button">' + esc(S.skipLabel || "Email is enough") + "</button>" +
            "</div>" +
            '<p class="form__msg" role="status" aria-live="polite"></p>' +
          "</form>";

        var form = box.querySelector("form");
        var msg  = box.querySelector(".form__msg");
        var btn  = box.querySelector(".join__go");

        track("join_step2_view", { source: src });
        var t = box.querySelector(".join__title");
        if (t) { t.setAttribute("tabindex", "-1"); t.focus(); }

        box.querySelector(".join__skip").addEventListener("click", function () {
          track("join_skip_phone", { source: src });
          renderDone(box, opts);
        });

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var phone = form.phone.value.trim();
          var name  = form.name.value.trim();
          msg.textContent = ""; msg.removeAttribute("data-state");

          // A phone number with no ticked box is not a consenting number.
          // Sending to it would be illegal, so the box is required here.
          if (phone && !form.consent.checked) {
            msg.textContent = "Tick the box so I'm allowed to text you.";
            msg.setAttribute("data-state", "err");
            form.consent.focus();
            return;
          }
          if (phone && phone.replace(/\D/g, "").length < 10) {
            msg.textContent = "That number looks short.";
            msg.setAttribute("data-state", "err");
            form.phone.focus();
            return;
          }
          if (!phone && !name) { renderDone(box, opts); return; }

          setBusy(btn, true, "SENDING");
          send({
            name: name,
            phone: phone,
            sms_consent: phone && form.consent.checked ? "yes" : "no",
            consent_text: phone && form.consent.checked ? consent : "",
            source: src,
            stage: "phone"
          }, function (ok) {
            setBusy(btn, false, (L.step2 || {}).submitLabel || "TEXT ME TOO");
            if (!ok) {
              msg.textContent = L.errorMsg || "That didn't send. Try again in a second.";
              msg.setAttribute("data-state", "err");
              return;
            }
            track(phone ? "join_phone" : "join_name", { source: src });
            renderDone(box, opts);
          });
        });
      }

      /* ---- STEP 3 — the payoff ---- */
      function renderDone(target, o) {
        var D = L.done || {};
        var R = D.reward || {};
        var name = (lead().name || "").trim();
        var greet = name ? "Welcome in, " + name + "." : (D.title || "Welcome in.");

        target.innerHTML =
          '<div class="join__done">' +
            '<p class="join__title">' + esc(greet) + "</p>" +
            (D.body ? '<p class="join__body">' + esc(D.body) + "</p>" : "") +
            (R.url ?
              '<a class="reward" href="' + esc(R.url) + '" target="_blank" rel="noopener">' +
                '<span class="reward__tag">' + esc(R.label || "START HERE") + "</span>" +
                '<span class="reward__txt">' +
                  '<b>' + esc(R.title || "") + "</b>" +
                  (R.note ? "<i>" + esc(R.note) + "</i>" : "") +
                "</span>" +
                '<span class="reward__cta">' + esc(R.cta || "PLAY") + "</span>" +
              "</a>" : "") +
            '<div class="join__share">' +
              '<span class="join__share-lbl">' + esc(D.shareLabel || "Send it to someone") + "</span>" +
              '<button class="btn btn--ghost join__share-btn" type="button"><span>SHARE</span></button>' +
            "</div>" +
            '<p class="form__msg" role="status" aria-live="polite"></p>' +
          "</div>";

        var msg = target.querySelector(".form__msg");
        var sb  = target.querySelector(".join__share-btn");
        if (R.url) {
          target.querySelector(".reward").addEventListener("click", function () { track("reward_click"); });
        }
        sb.addEventListener("click", function () {
          shareSite(function (how) {
            if (how === "copy") {
              msg.textContent = D.copiedMsg || "Link copied.";
              msg.setAttribute("data-state", "ok");
            }
            track("share", { how: how });
          });
        });
        if (o && o.onDone) o.onDone();
        return target;
      }

      function setBusy(btn, busy, label) {
        btn.disabled = busy;
        var s = btn.querySelector("span") || btn;
        s.textContent = busy ? "SENDING…" : label;
      }
    }

    return { mount: mount, onJoin: onJoin, configured: configured, lead: lead };
  })();

  /* Native share sheet where it exists, clipboard everywhere else. */
  function shareSite(cb) {
    var S = E.share || {};
    var data = {
      title: S.title || document.title,
      text:  S.text || "",
      url:   S.url || location.href
    };
    if (navigator.share) {
      navigator.share(data).then(function () { cb("native"); }).catch(function () {});
      return;
    }
    var txt = data.url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { cb("copy"); }).catch(function () { cb("fail"); });
    } else {
      var ta = el("textarea"); ta.value = txt; document.body.appendChild(ta);
      ta.select(); try { document.execCommand("copy"); cb("copy"); } catch (e) { cb("fail"); }
      ta.remove();
    }
  }

  /* -------------------------------------------------------------------------
     INNER CIRCLE SECTION
     ---------------------------------------------------------------------- */
  (function list() {
    var L = E.list || {};
    if (L.heading) set("listH", L.heading);
    set("listCap", L.caption);
    var box = $("#listBox");

    // What they actually get. Concrete beats "news and updates".
    var perks = L.perks || [];
    if (perks.length) {
      var ul = el("ul", "perks");
      perks.forEach(function (p, i) {
        ul.appendChild(el("li", "perks__item",
          '<span class="perks__n">' + String(i + 1).padStart(2, "0") + "</span>" +
          '<span class="perks__k">' + esc(p.k) + "</span>" +
          '<span class="perks__v">' + esc(p.v) + "</span>"));
      });
      box.appendChild(ul);
    }

    var mountPoint = el("div", "join__mount");
    box.appendChild(mountPoint);
    JOIN.mount(mountPoint, { source: "section" });

    // If they join from the bar or the modal, this section catches up.
    JOIN.onJoin(function () {
      if (!mountPoint.querySelector(".join__done")) {
        JOIN.mount(mountPoint, { source: "section" });
      }
    });
  })();

  /* -------------------------------------------------------------------------
     CONTACT
     ---------------------------------------------------------------------- */
  (function contact() {
    var C = E.contact || {};
    if (C.heading) set("conH", C.heading);
    set("conCap", C.caption);
    var box = $("#conBody");
    if (C.email) {
      box.innerHTML =
        '<span class="eyebrow" style="display:block;margin-bottom:12px">' + esc(C.emailLabel || "Email") + "</span>" +
        '<a class="contact__mail" href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a>";
    }
    if ((C.secondary || []).length) {
      var alt = el("div", "contact__alt");
      C.secondary.forEach(function (s) {
        var a = el("a", "btn btn--ghost", "<span>" + esc(s.label) + "</span>");
        a.href = s.url; a.target = "_blank"; a.rel = "noopener";
        alt.appendChild(a);
      });
      box.appendChild(alt);
    }
  })();

  /* -------------------------------------------------------------------------
     INTRO CURTAIN
     ---------------------------------------------------------------------- */
  (function curtain() {
    var c = $("#curtain");
    if (!X.introCurtain) { c.remove(); return; }
    var H = E.hero || {};

    // Behind the name: the loop if it exists, otherwise your own frames.
    var cm = $("#curtainMedia");
    if (cm) {
      if (H.video) {
        var cv = el("video");
        cv.src = H.video; cv.muted = true; cv.loop = true; cv.playsInline = true;
        cv.setAttribute("muted", ""); cv.setAttribute("playsinline", "");
        if (!reduced) { cv.autoplay = true; cv.play().catch(function () {}); }
        cm.appendChild(cv);
      } else {
        normSlides(H.slides).slice(0, 3).forEach(function (s, i) {
          var n = slideNode(s, i === 0);
          // A still can't move on its own, so it gets its own treatment
        // rather than sharing the clips' drift.
        n.classList.add(n.tagName === "IMG" ? "drift-still" : "drift-" + (i % 4));
          if (i === 0) n.classList.add("is-on");
          cm.appendChild(n);
        });
        var cnodes = [].slice.call(cm.children);
        armFirst(cnodes);
        runSlides(cnodes, 3200);   // same rule behind the door, stills move quicker
      }
    }

    set("curtainTag", H.sticker || "");
    store.set(KEY.been, "1");

    /* The line along the bottom of the door.

       It used to be assembled from the bio stats \u2014 listener counts, stream
       totals \u2014 which turned the first screen into a sales sheet. Now it's
       whatever `hero.doorLine` says, and it's about who's inside rather than
       how many. */
    var meta = $("#curtainMeta");
    if (meta) {
      if (H.doorLine) meta.textContent = H.doorLine;
      else meta.remove();
    }

    c.hidden = false;
    document.body.classList.add("is-locked");
    var btn = $("#curtainBtn");
    var lbl = btn.querySelector("span") || btn;

    function go() {
      c.classList.add("is-out");
      document.body.classList.remove("is-locked");
      setTimeout(function () { c.remove(); }, reduced ? 0 : 900);
    }

    /* ---- THE DOOR IS ALSO THE LOADING SCREEN -------------------------------
       The hero opens on video. If someone walks in before it has buffered,
       the first thing they see is a stutter — the worst possible first frame.

       So the door holds itself shut until the opening clip can actually play
       through, and says so while it waits. The wait is capped: on a bad
       connection they get in anyway rather than staring at a locked door. */
    var gate = (E.hero && E.hero.loading) || {};
    var maxWait = gate.maxWait == null ? 4000 : gate.maxWait;
    var opener  = document.querySelector(".hero__slides video, .hero__media video");
    var opened  = false;

    function unlock(why) {
      if (opened) return;
      opened = true;
      clearTimeout(waitTimer);
      c.removeAttribute("data-loading");
      lbl.textContent = H.enterLabel || "ENTER";
      btn.disabled = false;
      btn.removeAttribute("aria-disabled");
      btn.focus();
      if (why === "auto" && gate.autoEnter) go();
    }

    // Nothing to wait on (reduced motion, stills only, or already buffered).
    var ready = !opener || reduced || opener.readyState >= 3;
    var waitTimer = null;

    if (ready) {
      unlock("ready");
    } else {
      c.setAttribute("data-loading", "1");
      lbl.textContent = gate.label || "LOADING";
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      opener.addEventListener("canplaythrough", function () { unlock("ready"); }, { once: true });
      opener.addEventListener("error", function () { unlock("error"); }, { once: true });
      waitTimer = setTimeout(function () { unlock("timeout"); }, maxWait);
    }

    btn.addEventListener("click", function () { if (!btn.disabled) go(); });
    document.addEventListener("keydown", function k(e) {
      if (e.key !== "Escape" && e.key !== "Enter") return;
      if (btn.disabled && e.key === "Enter") return;   // don't skip the buffer
      go(); document.removeEventListener("keydown", k);
    });
  })();

  /* -------------------------------------------------------------------------
     SCROLL REVEAL
     ---------------------------------------------------------------------- */
  (function reveal() {
    var nodes = [].slice.call(document.querySelectorAll(".reveal"));
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    nodes.forEach(function (n) { io.observe(n); });
  })();


  /* -------------------------------------------------------------------------
     STICKY DOCK — the fast path. Appears once they leave the hero.
     ---------------------------------------------------------------------- */
  (function dock() {
    var d = $("#dock");
    if (!d) return;
    if (X.stickyDock === false || !(E.dock || []).length) { d.remove(); return; }

    E.dock.forEach(function (it) {
      /* An item with action:"join" stays on the site instead of leaving it.
         It's the only inverted one, so the eye lands there first. */
      if (it.action === "join") {
        var b = el("button", "dock__item dock__item--join");
        b.type = "button";
        var relabel = function () {
          var joined = isMember();
          b.innerHTML = svg(joined ? "check" : (it.icon || "star"), "") +
            "<span>" + esc(joined ? (it.memberLabel || "You're in") : it.label) + "</span>";
          b.setAttribute("aria-label", joined ? "You're on the list" : "Join the list");
        };
        relabel();
        JOIN.onJoin(relabel);
        b.addEventListener("click", function () {
          track("dock_join");
          var sec = document.getElementById("list");
          if (!sec) return;
          sec.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
          setTimeout(function () {
            var f = sec.querySelector("input[type=email]");
            if (f) f.focus({ preventScroll: true });
          }, reduced ? 0 : 800);
        });
        d.appendChild(b);
        return;
      }
      var a = el("a", "dock__item",
        svg(it.icon || "link", "") + "<span>" + esc(it.label) + "</span>");
      a.href = it.url; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("aria-label", it.label + " (opens in a new tab)");
      a.addEventListener("click", function () { track("dock_out", { to: it.label }); });
      d.appendChild(a);
    });

    var hero = document.getElementById("home");
    if (!hero || !("IntersectionObserver" in window)) { d.classList.add("is-up"); return; }
    new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { d.classList.toggle("is-up", !en.isIntersecting); });
    }, { threshold: 0.25 }).observe(hero);
  })();

  /* -------------------------------------------------------------------------
     FULL-BLEED IMAGE BANDS — breaks up the black
     ---------------------------------------------------------------------- */
  (function bands() {
    (E.bands || []).forEach(function (b) {
      var slot = document.getElementById("band-" + b.after);
      if (!slot) return;
      var img = el("img");
      img.src = b.src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      img.onerror = function () {
        if (b.fallback && img.src.indexOf(b.fallback) === -1) { img.src = b.fallback; return; }
        slot.remove();
      };
      img.onload = function () {
        if (img.naturalWidth <= 120 && b.fallback && img.src.indexOf(b.fallback) === -1) img.src = b.fallback;
        else if (img.naturalWidth <= 120) slot.remove();
      };
      slot.appendChild(img);
      if (b.caption) slot.appendChild(el("span", "band__cap", esc(b.caption)));
      slot.hidden = false;
    });
  })();

  /* -------------------------------------------------------------------------
     INNER CIRCLE SLIDE-UP — fires only after they've engaged.
     Dismissal is remembered. It never nags twice.
     ---------------------------------------------------------------------- */
  (function listPrompt() {
    var p = $("#prompt");
    if (!p) return;
    var L = E.list || {}, C = L.prompt;
    if (X.listPrompt === false || !C || isMember()) { p.remove(); return; }
    if (store.get(KEY.prompt)) { p.remove(); return; }

    p.innerHTML =
      '<div class="prompt__inner">' +
        "<div class=\"prompt__copy\">" +
          '<p class="prompt__title">' + esc(C.title) + "</p>" +
          '<p class="prompt__body">' + esc(C.body) + "</p>" +
        "</div>" +
        '<div class="prompt__act"></div>' +
        '<button class="prompt__no" type="button">' + esc(C.no || "Not now") + "</button>" +
      "</div>";

    // The bar takes the email itself. Sending people off to find a form
    // somewhere else on the page is where most of them used to fall out.
    JOIN.mount($(".prompt__act", p), {
      source: "prompt",
      compact: true,
      onDone: function () { setTimeout(function () { close(true); }, 2600); }
    });

    function close(remember) {
      p.classList.remove("is-up");
      if (remember) store.set(KEY.prompt, "1");
      setTimeout(function () { p.hidden = true; }, 600);
    }
    $(".prompt__no", p).addEventListener("click", function () {
      track("prompt_dismiss");
      close(true);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && p.classList.contains("is-up")) close(true);
    });
    JOIN.onJoin(function () { store.set(KEY.prompt, "1"); });

    // Trigger: they got as far as the videos. They're interested — now ask.
    var trigger = document.getElementById(C.after || "video") || document.getElementById("music");
    if (!trigger || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.disconnect();
        if (isMember()) return;
        // Never cover the form they're already filling in.
        if (document.activeElement && document.activeElement.closest &&
            document.activeElement.closest("#listBox")) return;
        p.hidden = false;
        setTimeout(function () { p.classList.add("is-up"); track("prompt_show"); }, 400);
      });
    }, { threshold: 0.3 });
    io.observe(trigger);
  })();

  /* -------------------------------------------------------------------------
     EXIT INTENT — desktop only, once ever, never for members.
     Fires when the cursor leaves upward for the tab bar or the close button.
     ---------------------------------------------------------------------- */
  (function exitIntent() {
    var L = E.list || {}, C = L.exitIntent || {};
    if (!C.on || isMember() || store.get(KEY.exit)) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;   // no mobile
    if (window.innerWidth < 860) return;

    var armed = false, fired = false;
    // Don't ambush someone who just landed — give them a minute with the site.
    setTimeout(function () { armed = true; }, 25000);

    function open() {
      if (fired || !armed || isMember()) return;
      fired = true;
      store.set(KEY.exit, "1");
      track("exit_intent_show");

      var m = el("div", "modal");
      m.id = "joinModal";
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      m.setAttribute("aria-label", C.title || "Join the list");
      m.innerHTML =
        '<div class="modal__panel">' +
          '<button class="modal__x" type="button" aria-label="Close">&#10005;</button>' +
          '<p class="modal__title display">' + esc(C.title || "Before you go —") + "</p>" +
          '<p class="modal__body">' + esc(C.body || "") + "</p>" +
          '<div class="modal__act"></div>' +
          '<button class="modal__no" type="button">' + esc(C.dismiss || "No thanks") + "</button>" +
        "</div>";
      document.body.appendChild(m);

      var last = document.activeElement;
      JOIN.mount($(".modal__act", m), {
        source: "exit",
        onDone: function () { setTimeout(close, 3200); }
      });

      function close() {
        m.classList.remove("is-open");
        document.body.classList.remove("is-locked");
        setTimeout(function () { m.remove(); }, 400);
        if (last && last.focus) last.focus();
        document.removeEventListener("keydown", onKey);
      }
      function onKey(e) {
        if (e.key === "Escape") close();
        if (e.key !== "Tab") return;
        // Keep focus inside the dialog while it's open.
        var f = m.querySelectorAll('button, [href], input, select, textarea');
        if (!f.length) return;
        var first = f[0], lastF = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); }
        else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
      }

      $(".modal__x", m).addEventListener("click", close);
      $(".modal__no", m).addEventListener("click", function () { track("exit_intent_dismiss"); close(); });
      m.addEventListener("click", function (e) { if (e.target === m) close(); });
      document.addEventListener("keydown", onKey);

      requestAnimationFrame(function () {
        m.classList.add("is-open");
        document.body.classList.add("is-locked");
        var inp = m.querySelector("input[type=email]");
        if (inp) inp.focus();
      });
    }

    document.addEventListener("mouseout", function (e) {
      if (e.relatedTarget || e.clientY > 8) return;
      open();
    });
  })();

  /* -------------------------------------------------------------------------
     NEXT DROP — countdown + pre-save. Renders nothing unless drop.active.
     Flips itself from "pre-save" to "out now" the second the clock runs out,
     so it can't be left saying the wrong thing.
     ---------------------------------------------------------------------- */
  (function drop() {
    var slot = $("#drop");
    if (!slot) return;
    var D = E.drop || {};
    if (!D.active || !D.title) { slot.remove(); return; }

    var when = new Date(D.date).getTime();
    var valid = !isNaN(when);

    slot.innerHTML =
      '<div class="wrap drop__inner">' +
        '<div class="drop__meta">' +
          '<span class="eyebrow drop__kick"></span>' +
          '<p class="display drop__title">' + esc(D.title) + "</p>" +
          (D.kind ? '<span class="drop__kind">' + esc(D.kind) + "</span>" : "") +
        "</div>" +
        '<div class="drop__right">' +
          '<div class="drop__clock" aria-live="off"></div>' +
          '<div class="drop__cta"></div>' +
        "</div>" +
      "</div>";
    slot.hidden = false;

    var kick  = $(".drop__kick", slot);
    var clock = $(".drop__clock", slot);
    var ctaBox = $(".drop__cta", slot);

    function ctaLive() {
      ctaBox.innerHTML = "";
      var live = !valid || Date.now() >= when;
      kick.textContent = live ? (D.liveKicker || "OUT NOW") : (D.kicker || "NEXT");
      if (D.url) {
        var a = el("a", "btn btn--solid", "<span>" + esc(live ? (D.liveCta || "PLAY IT") : (D.cta || "PRE-SAVE")) + "</span>");
        a.href = D.url; a.target = "_blank"; a.rel = "noopener";
        a.addEventListener("click", function () { track("drop_cta", { live: live }); });
        ctaBox.appendChild(a);
      }
      if (!live && !isMember()) {
        var b = el("button", "btn btn--ghost", "<span>" + esc(D.joinCta || "TEXT ME WHEN IT DROPS") + "</span>");
        b.type = "button";
        b.addEventListener("click", function () {
          track("drop_join");
          var sec = document.getElementById("list");
          if (sec) sec.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
          setTimeout(function () {
            var f = sec && sec.querySelector("input[type=email]");
            if (f) f.focus({ preventScroll: true });
          }, reduced ? 0 : 800);
        });
        ctaBox.appendChild(b);
      }
      return live;
    }

    function tick() {
      if (!valid) { clock.remove(); return; }
      var left = when - Date.now();
      if (left <= 0) {
        clock.textContent = D.note ? "" : "";
        clock.remove();
        ctaLive();
        clearInterval(iv);
        return;
      }
      var s = Math.floor(left / 1000);
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
          m = Math.floor(s % 3600 / 60), sec = s % 60;
      clock.innerHTML =
        unit(d, "days") + unit(h, "hrs") + unit(m, "min") + unit(sec, "sec");
    }
    function unit(v, l) {
      return '<span class="drop__u"><b>' + String(v).padStart(2, "0") + "</b><i>" + l + "</i></span>";
    }

    var live = ctaLive();
    if (!live) { tick(); var iv = setInterval(tick, 1000); }
    else if (clock) clock.remove();
    JOIN.onJoin(ctaLive);
  })();

  /* -------------------------------------------------------------------------
     STAT COUNT-UP — small bit of life on the numbers
     ---------------------------------------------------------------------- */
  (function counters() {
    if (reduced || !("IntersectionObserver" in window)) return;
    var nodes = [].slice.call(document.querySelectorAll(".bio__stat b"));
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var full = en.target.textContent;
        var m = full.match(/^([\d.]+)(.*)$/);
        if (!m) return;
        var target = parseFloat(m[1]), suffix = m[2], dec = (m[1].split(".")[1] || "").length;
        var t0 = null, dur = 900;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          en.target.textContent = (target * eased).toFixed(dec) + suffix;
          if (k < 1) requestAnimationFrame(step);
          else en.target.textContent = full;
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  })();


  /* -------------------------------------------------------------------------
     SKIN SWITCHER — "tape" (default) <-> "win" (dark Windows)
     The choice is remembered per device.
     ---------------------------------------------------------------------- */
  (function skins() {
    var btn = $("#skinBtn");
    var KEY = "prxdjay.skin";
    var SKINS = {
      tape: { label: "TAPE",   next: "win"  },
      win:  { label: "SYSTEM", next: "tape" }
    };

    var start = X.defaultSkin === "win" ? "win" : "tape";
    try { var saved = localStorage.getItem(KEY); if (SKINS[saved]) start = saved; } catch (e) {}
    apply(start);

    if (!btn) return;
    if (X.skinSwitcher === false) { btn.remove(); return; }

    function apply(s) {
      root.setAttribute("data-skin", s);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", s === "win" ? "#1b1915" : "#121110");
      if (btn) {
        btn.innerHTML = "<i aria-hidden='true'></i><span>" + SKINS[SKINS[s].next].label + "</span>";
        btn.setAttribute("aria-pressed", String(s === "win"));
        btn.setAttribute("aria-label", "Switch to the " + SKINS[SKINS[s].next].label + " skin");
        btn.title = "Switch skin";
      }
    }
    apply(root.getAttribute("data-skin") || start);

    btn.addEventListener("click", function () {
      var cur = root.getAttribute("data-skin") === "win" ? "win" : "tape";
      var nxt = SKINS[cur].next;
      apply(nxt);
      try { localStorage.setItem(KEY, nxt); } catch (e) {}
    });
  })();

})();
