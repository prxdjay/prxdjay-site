
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = mqReduce.matches;
  const ALBUM_EMBED = "https://open.spotify.com/embed/album/7reVqpxCzqE0df6fGIobVw?utm_source=generator&theme=0";
  const plainClick = e => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button && e.button !== 0));
  const announce = msg => { const n = $("#announce"); n.textContent = ""; setTimeout(() => { n.textContent = msg; }, 30); };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  /* ---------- Original clips: loaded only when needed ---------- */
  const FMT = (() => {
    const v = document.createElement("video");
    if (v.canPlayType('video/mp4; codecs="avc1.4D401F"')) return "mp4";
    if (v.canPlayType('video/webm; codecs="vp9"')) return "webm";
    return null;
  })();
  function clipURL(id) {
    if (!FMT) return Promise.reject(new Error("no playable format"));
    return Promise.resolve((FMT === "mp4" ? "/assets/img/clips/" : "/assets/artist/clips/") + id + "." + FMT);
  }

  /* Live YouTube stills: labelled fallback when offline */
  $$(".vplane img").forEach(img => {
    if (!/^https?:/.test(img.getAttribute("src") || "")) return;
    const box = img.closest(".vplane");
    const fail = () => box.classList.add("is-missing");
    img.addEventListener("error", fail);
    img.addEventListener("load", () => { if (img.naturalWidth && img.naturalWidth <= 120) fail(); });
    if (img.complete && img.naturalWidth === 0) fail();
  });
  $$(".js-cover").forEach(img => {
    const holder = img.closest("[data-cover]") || img.parentElement;
    const fail = () => holder.classList.add("is-missing");
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---------- Player dock: the Spotify embed is created only on click and never autoplays ---------- */
  const dock = $("#dock"), slot = $("#dockSlot");
  let dockTrigger = null;
  function openPlayer(trigger) {
    dockTrigger = trigger || null;
    if (!slot.firstElementChild) {
      const f = document.createElement("iframe");
      f.title = "Spotify player: PRXDIGY VXL.1";
      f.src = ALBUM_EMBED;
      f.setAttribute("allow", "clipboard-write; encrypted-media; fullscreen; picture-in-picture");
      f.setAttribute("loading", "eager");
      slot.appendChild(f);
    }
    if (dock.hidden) { dock.hidden = false; dock.classList.remove("is-in"); void dock.offsetWidth; dock.classList.add("is-in"); }
    caseApi.setOpen(true);
    $("#dockClose").focus({ preventScroll: true });
    announce("Spotify player opened at the bottom of the page. Press play in the player to listen.");
  }
  function closePlayer() {
    slot.replaceChildren();
    dock.hidden = true;
    caseApi.setOpen(false);
    if (dockTrigger && document.contains(dockTrigger) && dockTrigger.offsetParent !== null) dockTrigger.focus({ preventScroll: true });
    announce("Player closed.");
  }
  $$(".js-play").forEach(a => a.addEventListener("click", e => { if (!plainClick(e)) return; e.preventDefault(); openPlayer(a); }));
  $("#dockClose").addEventListener("click", closePlayer);

  /* ---------- Video overlay: YouTube loads on click, no autoplay ---------- */
  const modal = $("#vmodal"), frame = $("#vmodalFrame");
  function openVideo(id, title, credit, href) {
    if (!modal || typeof modal.showModal !== "function") { window.open(href || ("https://www.youtube.com/watch?v=" + id), "_blank", "noopener"); return; }
    $("#vmodalTitle").textContent = title || "";
    $("#vmodalCredit").textContent = credit || "";
    $("#vmodalOut").href = "https://www.youtube.com/watch?v=" + id;
    const f = document.createElement("iframe");
    f.title = "YouTube video: " + (title || "");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&playsinline=1&modestbranding=1";
    f.setAttribute("allow", "encrypted-media; picture-in-picture; fullscreen");
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.replaceChildren(f);
    modal.showModal();
    $("#vmodalClose").focus();
    if (reelApi) reelApi.hold(true);
    stopPreviews();
  }
  $$(".js-video").forEach(a => a.addEventListener("click", e => { if (!plainClick(e)) return; e.preventDefault(); openVideo(a.dataset.id, a.dataset.title, a.dataset.credit, a.href); }));
  $("#vmodalClose").addEventListener("click", () => modal.close());
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", () => { frame.replaceChildren(); if (reelApi) reelApi.hold(false); });

  /* ---------- Copy email ---------- */
  const copyBtn = $("#copyEmail"), copyStatus = $("#copyStatus");
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("prxd.jay@gmail.com"); copyStatus.textContent = "Email copied"; }
    catch (err) { copyStatus.textContent = "Copy blocked here. Select the address above."; }
    setTimeout(() => { copyStatus.textContent = ""; }, 2800);
  });

  /* ---------- Clip reel: each clip plays once, then cross-fades; only one clip is preloaded ahead ---------- */
  const CLIPS = [
    { id: "wrist", title: "WRIST", video: "tE0BXfeUcWo", credit: "Music video" },
    { id: "sponsored", title: "SPONSORED", video: "zkoz1tAjeEA", credit: "with Kayeandre" },
    { id: "findyou", title: "FIND YOU", video: "Se1q1ejP65g", credit: "with Kayeandre" },
    { id: "toomany", title: "TOO MANY", video: "e7SS51HBa5c", credit: "Music video" }
  ];
  const reelApi = (() => {
    const screen = $("#reelScreen"); if (!screen) return null;
    const vids = $$(".reel__v", screen), segs = $$(".reel__seg"), watch = $("#reelWatch"), toggle = $("#reelToggle");
    const FADE = 0.5;
    let front = 0, idx = 0, inView = false, held = false, userPaused = reduced, started = false, fading = false, raf = 0;
    if (!FMT) { toggle.hidden = true; }
    const A = () => vids[front], B = () => vids[1 - front];
    function setLabel() {
      segs.forEach((s, i) => { s.classList.toggle("is-on", i === idx); s.classList.toggle("is-done", i < idx); if (i !== idx) s.querySelector("i").style.setProperty("--fill", i < idx ? 1 : 0); });
      const c = CLIPS[idx];
      if (c.video) { watch.hidden = false; watch.textContent = "Watch " + c.title; } else watch.hidden = true;
      screen.classList.toggle("no-link", !c.video);
    }
    async function load(v, i) {
      if (v.dataset.i === String(i) && v.src) return;
      v.dataset.i = String(i);
      try { v.src = await clipURL(CLIPS[i].id); v.preload = "auto"; v.load(); } catch (e) {}
    }
    function shouldPlay() { return started && inView && !held && !userPaused && !document.hidden; }
    async function ensure() {
      if (started || !FMT) return;
      started = true;
      await load(A(), idx);
      load(B(), (idx + 1) % CLIPS.length);
      sync();
    }
    function sync() {
      const a = A();
      if (shouldPlay()) { a.play().then(() => { screen.classList.add("is-live"); }).catch(() => {}); tick(); }
      else { vids.forEach(v => v.pause()); }
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.querySelector("span").textContent = userPaused ? "Play clips" : "Pause clips";
      toggle.querySelector("path").setAttribute("d", userPaused ? "M8 5.2v13.6L19 12z" : "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z");
    }
    async function go(next) {
      if (fading) return;
      fading = true;
      const b = B(), a = A();
      await load(b, next);
      try { b.currentTime = 0; } catch (e) {}
      if (shouldPlay()) b.play().catch(() => {});
      b.classList.add("is-on"); a.classList.remove("is-on");
      idx = next; setLabel();
      setTimeout(() => {
        a.pause(); front = 1 - front; fading = false; sync();
        load(B(), (idx + 1) % CLIPS.length);
      }, FADE * 1000 + 40);
    }
    function tick() {
      cancelAnimationFrame(raf);
      const step = () => {
        const a = A();
        if (a.duration) {
          const f = clamp(a.currentTime / a.duration);
          segs[idx].querySelector("i").style.setProperty("--fill", f.toFixed(3));
          if (!fading && a.duration - a.currentTime < FADE + 0.05) go((idx + 1) % CLIPS.length);
        }
        if (!a.paused || fading) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    vids.forEach(v => { v.muted = true; v.defaultMuted = true; v.addEventListener("playing", tick); });
    segs.forEach(s => s.addEventListener("click", async () => { await ensure(); const i = +s.dataset.i; if (i !== idx) go(i); else { try { A().currentTime = 0; } catch (e) {} } if (userPaused) { userPaused = false; sync(); } }));
    toggle.addEventListener("click", async () => { userPaused = !userPaused; await ensure(); sync(); });
    watch.addEventListener("click", () => { const c = CLIPS[idx]; if (c.video) openVideo(c.video, c.title, c.credit); });
    screen.addEventListener("click", () => { const c = CLIPS[idx]; if (c.video) openVideo(c.video, c.title, c.credit); });
    document.addEventListener("visibilitychange", sync);
    setLabel();
    return {
      setInView(v) { if (v === inView) return; inView = v; if (v && !reduced) ensure(); sync(); },
      hold(v) { held = v; sync(); },
      setReduced(v) { if (v) { userPaused = true; sync(); } }
    };
  })();

  /* ---------- Clip previews on the video screens (hover or focus, muted) ---------- */
  const previews = [];
  function stopPreviews() { previews.forEach(p => p.stop()); }
  $$("[data-clip]").forEach(card => {
    const plane = card.querySelector(".vplane"); let v = null, on = false;
    const start = async () => {
      if (reduced || !FMT) return;
      stopPreviews(); on = true;
      if (!v) { v = document.createElement("video"); v.className = "vplane__clip"; v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true"); try { v.src = await clipURL(card.dataset.clip); } catch (e) { return; } plane.insertBefore(v, plane.querySelector(".vplane__play")); }
      if (!on) return;
      try { v.currentTime = 0; } catch (e) {}
      v.play().then(() => { if (on) plane.classList.add("is-previewing"); }).catch(() => {});
    };
    const stop = () => { on = false; plane.classList.remove("is-previewing"); if (v) v.pause(); };
    previews.push({ stop });
    card.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") start(); });
    card.addEventListener("pointerleave", stop);
    card.addEventListener("focus", () => { if (card.matches(":focus-visible")) start(); });
    card.addEventListener("blur", stop);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopPreviews(); });

  /* ---------- Navigation: active section, fast travel ---------- */
  const nav = $("#topnav"), navPlay = $(".navplay");
  const jumpLinks = $$("[data-jump]");
  let scrollAnim = 0;
  function animateScroll(to, done) {
    cancelAnimationFrame(scrollAnim);
    const from = scrollY, d = to - from;
    if (reduced || Math.abs(d) < 2) { scrollTo(0, to); done(); return; }
    const dur = Math.min(620, 260 + Math.abs(d) * 0.06), t0 = performance.now();
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const stop = () => { cancelAnimationFrame(scrollAnim); off(); };
    const off = () => { removeEventListener("wheel", stop); removeEventListener("touchstart", stop); };
    addEventListener("wheel", stop, { passive: true }); addEventListener("touchstart", stop, { passive: true });
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + d * ease(t));
      if (t < 1) scrollAnim = requestAnimationFrame(step); else { off(); done(); }
    };
    scrollAnim = requestAnimationFrame(step);
  }
  function arrive(el) { if (!el) return; el.classList.remove("is-arriving"); void el.offsetWidth; el.classList.add("is-arriving"); setTimeout(() => el.classList.remove("is-arriving"), 1100); }
  function jumpTo(id) {
    if (id === "top") { animateScroll(0, () => { const h = $("#hero-name"); }); return; }
    const sec = document.getElementById(id); if (!sec) return;
    const head = sec.querySelector(".arrive");
    const y = Math.max(0, Math.round(sec.getBoundingClientRect().top + scrollY - nav.offsetHeight - 6));
    animateScroll(y, () => { if (head) { head.focus({ preventScroll: true }); arrive(head); } setActive(id); try { history.replaceState(null, "", "#" + id); } catch (e) {} });
  }
  jumpLinks.forEach(a => a.addEventListener("click", e => { if (!plainClick(e)) return; e.preventDefault(); jumpTo(a.dataset.jump); }));
  function setActive(id) { $$(".navlinks a").forEach(a => { if (a.dataset.jump === id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); }
  if ("IntersectionObserver" in window) {
    const inBand = new Map();
    const bandIO = new IntersectionObserver(entries => {
      entries.forEach(en => inBand.set(en.target.id, en.isIntersecting));
      setActive(["music", "videos", "follow", "contact"].find(id => inBand.get(id)) || null);
    }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });
    ["music", "videos", "follow", "contact"].forEach(id => { const s = document.getElementById(id); if (s) bandIO.observe(s); });
  }

  /* ---------- Hero name: one line, sized to stay clear of Jay's face ---------- */
  const heroName = $("#hero-name"), heroImg = $("#heroImg"), portrait = $("#opPortrait"), copy = $("#opCopy"), stageOp = $("#stageOp");
  let nameRatio = 0;
  function measureRatio() {
    const s = document.createElement("span");
    s.textContent = heroName.textContent;
    s.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-family:" + getComputedStyle(heroName).fontFamily + ";font-weight:900;font-stretch:62%;font-size:100px;letter-spacing:-.5px;text-transform:uppercase";
    document.body.appendChild(s); nameRatio = s.getBoundingClientRect().width / 100; s.remove();
  }
  function wideLayout() { return !matchMedia("(orientation: portrait) and (max-width: 1100px)").matches; }
  function fitName() {
    if (!nameRatio) measureRatio();
    let f;
    if (!wideLayout()) {
      const avail = portrait.clientWidth - copy.offsetLeft * 2;
      f = avail / nameRatio;
    } else {
      const W = portrait.clientWidth, H = portrait.clientHeight;
      const pos = getComputedStyle(heroImg).objectPosition.split(" ").map(v => parseFloat(v) / 100);
      const s = Math.max(W / 2048, H / 878), dw = 2048 * s;
      const hairX = (W - dw) * (isNaN(pos[0]) ? 0.5 : pos[0]) + 0.372 * dw;
      f = (hairX - copy.offsetLeft - Math.max(20, W * 0.028)) / nameRatio;
      const restH = copy.offsetHeight - heroName.offsetHeight;
      const room = H - restH - parseFloat(getComputedStyle(copy).marginBottom || 0) - 96;
      f = Math.min(f, (room / 0.8));
    }
    f = clamp(f, 54, 260);
    root.style.setProperty("--nameF", f.toFixed(1) + "px");
  }

  /* ---------- Spatial engine: one camera, planes at depth, driven by normal scrolling ---------- */
  const opening = $(".opening"), shade = $("#opShade"), dim = $("#opDim"), reelEl = $("#opReel"), cap = $("#opCap");
  const depthEls = $$("[data-depth]").map(el => ({ el, depth: parseFloat(el.dataset.depth) || 0, top: 0, h: 0 }));
  const tiltEls = $$("[data-tilt]").map(el => ({ el, wrap: el.parentElement, tilt: parseFloat(el.dataset.tilt) || 0, top: 0, h: 0 }));
  const docTop = el => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
  let ticking = false, openTop = 0, openTravel = 1, ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  function measure() {
    openTop = docTop(opening);
    openTravel = Math.max(1, opening.offsetHeight - stageOp.offsetHeight);
    depthEls.forEach(m => { m.top = docTop(m.el); m.h = m.el.offsetHeight; });
    tiltEls.forEach(m => { m.top = docTop(m.wrap); m.h = m.wrap.offsetHeight; });
  }
  function setOpening(p) {
    const W = stageOp.clientWidth, H = stageOp.clientHeight, e = smooth(clamp(p / 0.72));
    const r = smooth(clamp((p - 0.05) / 0.67));
    const px = ptr.x * (1 - clamp(p * 8)), py = ptr.y * (1 - clamp(p * 8));
    if (wideLayout()) {
      portrait.style.transform = "translate3d(" + (0.29 * W * e + px * 10).toFixed(1) + "px," + (-0.02 * H * e + py * 6).toFixed(1) + "px," + (-170 * e).toFixed(1) + "px) rotateY(" + (-26 * e).toFixed(2) + "deg) scale(" + (1 - 0.6 * e + 0.02 * (1 - e)).toFixed(4) + ")";
      reelEl.style.transform = "translate(-50%,-50%) translate3d(" + lerp(-0.04 * W, -0.17 * W, r).toFixed(1) + "px," + lerp(0.62 * H, -0.015 * H, r).toFixed(1) + "px," + lerp(-520, 0, r).toFixed(1) + "px) rotateY(" + lerp(18, 7, r).toFixed(2) + "deg) scale(" + lerp(0.86, 1, r).toFixed(4) + ")";
      dim.style.opacity = "0";
    } else {
      portrait.style.transform = "translate3d(" + (px * 6).toFixed(1) + "px," + (-0.15 * H * e).toFixed(1) + "px," + (-60 * e).toFixed(1) + "px) rotateX(" + (11 * e).toFixed(2) + "deg) scale(" + (1 - 0.3 * e).toFixed(4) + ")";
      reelEl.style.transform = "translate(-50%,-50%) translate3d(0," + lerp(0.62 * H, 0.1 * H, r).toFixed(1) + "px," + lerp(-420, 30, r).toFixed(1) + "px) rotateX(" + lerp(-16, 0, r).toFixed(2) + "deg)";
      dim.style.opacity = (0.42 * e).toFixed(3);
    }
    shade.style.opacity = (1 - e * 0.85).toFixed(3);
    reelEl.style.opacity = clamp(r * 1.7).toFixed(3);
    const co = 1 - clamp((p - 0.03) / 0.3);
    copy.style.opacity = co.toFixed(3);
    copy.style.transform = "translate3d(0," + (-0.1 * H * p).toFixed(1) + "px,0)";
    copy.style.pointerEvents = co < 0.3 ? "none" : "";
    const ca = clamp((p - 0.7) / 0.14);
    cap.style.opacity = ca.toFixed(3);
    cap.style.visibility = "visible";
    cap.style.pointerEvents = ca < 0.3 ? "none" : "";
    if (reelApi) reelApi.setInView(p > 0.22 && scrollY < openTop + openTravel + H * 0.8);
  }
  function setPlanes() {
    const vh = innerHeight, sy = scrollY;
    for (const m of depthEls) {
      const top = m.top - sy;
      if (top + m.h < -vh * 0.3 || top > vh * 1.3) continue;
      const v = clamp(((top + m.h / 2) - vh / 2) / (vh / 2 + m.h / 2), -1, 1);
      m.el.style.transform = "translate3d(0," + (-v * m.depth * vh * 0.16).toFixed(1) + "px,0)";
    }
    for (const m of tiltEls) {
      const top = m.top - sy;
      if (top + m.h < -vh * 0.3 || top > vh * 1.3) continue;
      const v = clamp(((top + m.h / 2) - vh / 2) / (vh / 2 + m.h / 2), -1, 1);
      m.wrap.style.perspectiveOrigin = "50% " + (vh / 2 - top).toFixed(0) + "px";
      m.el.style.transform = "translateZ(" + (-Math.abs(v) * 80).toFixed(1) + "px) rotateX(" + (v * m.tilt).toFixed(2) + "deg)";
    }
  }
  function frameUpdate() {
    ticking = false;
    const motion = root.classList.contains("motion");
    if (motion) {
      ptr.x += (ptr.tx - ptr.x) * 0.12; ptr.y += (ptr.ty - ptr.y) * 0.12;
      const p = clamp((scrollY - openTop) / openTravel);
      setOpening(p);
      setPlanes();
      nav.classList.toggle("is-solid", p > 0.32 || scrollY > openTop + openTravel);
      if (Math.abs(ptr.tx - ptr.x) + Math.abs(ptr.ty - ptr.y) > 0.002) request();
    } else {
      nav.classList.toggle("is-solid", scrollY > stageOp.offsetHeight * 0.5);
      if (reelApi) { const r = reelEl.getBoundingClientRect(); reelApi.setInView(r.bottom > 0 && r.top < innerHeight); }
    }
    navPlay.tabIndex = nav.classList.contains("is-solid") ? 0 : -1;
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frameUpdate); } }
  addEventListener("scroll", request, { passive: true });
  let rto = 0;
  addEventListener("resize", () => { clearTimeout(rto); rto = setTimeout(() => { fitName(); measure(); request(); }, 80); });
  stageOp.addEventListener("pointermove", e => {
    if (reduced || e.pointerType !== "mouse" || !wideLayout()) return;
    const r = stageOp.getBoundingClientRect();
    ptr.tx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    request();
  });
  stageOp.addEventListener("pointerleave", () => { ptr.tx = 0; ptr.ty = 0; request(); });
  /* Keyboard users tabbing into a faded layer: bring that layer into view first */
  copy.addEventListener("focusin", () => { if (root.classList.contains("motion") && scrollY > openTop + openTravel * 0.2) scrollTo(0, openTop); });
  cap.addEventListener("focusin", () => { if (!root.classList.contains("motion")) return; const p = (scrollY - openTop) / openTravel; if (p < 0.86 || p > 1) scrollTo(0, Math.round(openTop + openTravel * 0.92)); });
  function clearMotion() {
    portrait.style.transform = ""; reelEl.style.transform = ""; reelEl.style.opacity = ""; copy.style.opacity = ""; copy.style.transform = ""; copy.style.pointerEvents = "";
    cap.style.opacity = ""; cap.style.visibility = ""; cap.style.pointerEvents = ""; shade.style.opacity = ""; dim.style.opacity = "";
    depthEls.forEach(m => { m.el.style.transform = ""; }); tiltEls.forEach(m => { m.el.style.transform = ""; m.wrap.style.perspectiveOrigin = ""; });
  }
  const start = () => { fitName(); measure(); request(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { nameRatio = 0; start(); });
  start();

  /* ---------- The steel case ---------- */
  const caseApi = (() => {
    const stage = $("#stage"), c3 = $("#case3d"), lid = $("#lid"), disc = $("#disc"), hit = $("#caseHit");
    const noop = { setOpen() {} };
    if (!stage || !c3 || !lid) return noop;
    hit.hidden = false;
    const faces = $$("[data-n]", c3).map(el => ({ el, n: el.dataset.n.split(",").map(Number), lid: !!el.closest("#lid") }));
    const D = Math.PI / 180, LID = 158;
    const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / l); };
    const L = nrm([-0.48, -0.74, 0.56]);
    const HV = nrm([L[0], L[1], L[2] + 1]);
    const POSE = { rx: -11, ry: -23 }, POSE_OPEN = { rx: -5, ry: -15 };
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const st = { rx: POSE.rx, ry: POSE.ry, open: 0, ty: 0, sc: 1, lift: 0 };
    const tg = { ...st };
    let vOpen = 0, raf = 0, isOpen = false, drag = null, swallowClick = false, homeTimer = 0;
    const base = () => (isOpen ? POSE_OPEN : POSE);

    function light() {
      const ax = st.rx * D, ay = st.ry * D, ao = st.open * LID * D;
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), co = Math.cos(ao), so = Math.sin(ao);
      for (const f of faces) {
        let x = f.n[0], y = f.n[1], z = f.n[2];
        if (f.lid) { const y1 = y * co - z * so, z1 = y * so + z * co; y = y1; z = z1; }
        const x2 = x * cy + z * sy, z2 = -x * sy + z * cy; x = x2; z = z2;
        const y3 = y * cx - z * sx, z3 = y * sx + z * cx; y = y3; z = z3;
        const d = Math.max(0, x * L[0] + y * L[1] + z * L[2]);
        const s = Math.pow(Math.max(0, x * HV[0] + y * HV[1] + z * HV[2]), 26);
        f.el.style.setProperty("--lum", (0.3 + 0.7 * d).toFixed(3));
        f.el.style.setProperty("--sp", s.toFixed(3));
      }
    }
    function render() {
      c3.style.transform = "translate3d(0," + st.ty.toFixed(2) + "px,0) scale(" + st.sc.toFixed(4) + ") rotateX(" + st.rx.toFixed(2) + "deg) rotateY(" + st.ry.toFixed(2) + "deg)";
      lid.style.transform = "rotateX(" + (st.open * LID).toFixed(2) + "deg)";
      disc.style.transform = "translateZ(calc(var(--tray-z) + " + (1.5 + st.lift * 5).toFixed(2) + "px))";
      c3.style.setProperty("--sx", (st.ry / 45).toFixed(3));
      c3.style.setProperty("--sy", (st.rx / 30).toFixed(3));
      c3.style.setProperty("--gx", (st.ry / 40).toFixed(3));
      c3.style.setProperty("--gy", (st.rx / 30).toFixed(3));
      c3.style.setProperty("--sheen", (st.ry * 3 + st.rx * 2).toFixed(1) + "deg");
      light();
    }
    function step() {
      let moving = false;
      const k = reduced ? 1 : 0.14;
      for (const key of ["rx", "ry", "ty", "sc", "lift"]) {
        const d = tg[key] - st[key];
        if (Math.abs(d) > 0.004) { st[key] += d * k; moving = true; } else st[key] = tg[key];
      }
      if (reduced) { st.open = tg.open; vOpen = 0; }
      else {
        vOpen = (vOpen + (tg.open - st.open) * 0.07) * 0.8;
        st.open += vOpen;
        if (Math.abs(vOpen) > 0.0004 || Math.abs(tg.open - st.open) > 0.001) moving = true; else { st.open = tg.open; vOpen = 0; }
      }
      render();
      raf = moving ? requestAnimationFrame(step) : 0;
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const goHome = () => { const b = base(); tg.rx = b.rx; tg.ry = b.ry; kick(); };

    function setOpen(v) {
      isOpen = !!v;
      const H = c3.offsetHeight, phone = innerWidth < 760;
      tg.open = isOpen ? 1 : 0;
      tg.sc = isOpen ? (phone ? 0.66 : 0.7) : 1;
      tg.ty = isOpen ? H * 0.33 : 0;
      tg.lift = isOpen ? 1 : 0;
      c3.classList.toggle("is-open", isOpen);
      hit.setAttribute("aria-pressed", String(isOpen));
      goHome();
    }

    /* Pointer tilt (mouse/pen hover) */
    stage.addEventListener("pointermove", e => {
      if (drag || reduced || e.pointerType === "touch") return;
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const b = base();
      tg.ry = b.ry + (px - 0.5) * 36;
      tg.rx = b.rx + (0.5 - py) * 22;
      kick();
    });
    stage.addEventListener("pointerleave", () => { if (!drag) goHome(); });

    /* Drag to turn (touch, mouse or pen) */
    hit.addEventListener("pointerdown", e => {
      swallowClick = false; clearTimeout(homeTimer);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, rx: tg.rx, ry: tg.ry, moved: false };
    });
    window.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 7) { drag.moved = true; try { hit.setPointerCapture(drag.id); } catch (err) {} }
      if (drag.moved) { tg.ry = clamp(drag.ry + dx * 0.5, -80, 80); tg.rx = clamp(drag.rx - dy * 0.3, -40, 40); kick(); }
    });
    const endDrag = e => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      if (drag.moved) { swallowClick = true; homeTimer = setTimeout(goHome, 1400); }
      drag = null;
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", e => { endDrag(e); goHome(); });

    /* Click / Enter / Space plays (opens the case and the player). Arrow keys turn it. */
    hit.addEventListener("click", e => {
      if (swallowClick) { swallowClick = false; e.preventDefault(); return; }
      if (isOpen) closePlayer(); else openPlayer(hit);
    });
    hit.addEventListener("keydown", e => {
      const big = e.shiftKey ? 24 : 12;
      let used = true;
      switch (e.key) {
        case "ArrowLeft": tg.ry = clamp(tg.ry - big, -80, 80); break;
        case "ArrowRight": tg.ry = clamp(tg.ry + big, -80, 80); break;
        case "ArrowUp": tg.rx = clamp(tg.rx - 8, -40, 40); break;
        case "ArrowDown": tg.rx = clamp(tg.rx + 8, -40, 40); break;
        case "Home": goHome(); break;
        default: used = false;
      }
      if (used) { e.preventDefault(); kick(); }
    });
    hit.addEventListener("blur", () => { if (!drag) goHome(); });

    /* One entrance turn when the case first scrolls into view (skipped with reduced motion). */
    render();
    if (!reduced && "IntersectionObserver" in window) {
      st.rx = -26; st.ry = -68; render();
      const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); kick(); } }, { threshold: 0.35 });
      io.observe(stage);
    }
    mqReduce.addEventListener && mqReduce.addEventListener("change", e => { reduced = e.matches; goHome(); });
    addEventListener("resize", () => { if (isOpen) { tg.ty = c3.offsetHeight * 0.33; kick(); } });
    return { setOpen };
  })();

  mqReduce.addEventListener && mqReduce.addEventListener("change", e => {
    reduced = e.matches;
    root.classList.toggle("motion", !reduced);
    if (reduced) { clearMotion(); if (reelApi) reelApi.setReduced(true); stopPreviews(); }
    fitName(); measure(); request();
  });
})();
