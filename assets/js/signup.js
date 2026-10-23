(() => {
  "use strict";

  const section = document.querySelector("#updates");
  const forms = [...document.querySelectorAll("[data-signup-form]")];
  const prompt = document.querySelector("#signupPrompt");
  const promptForm = document.querySelector("#promptSignupForm");
  const promptOpen = document.querySelector("#signupPromptOpen");
  const promptClose = document.querySelector("#signupPromptClose");
  const ndaPreviewLocked = document.querySelector("#ndaPreviewLocked");
  const ndaPreviewPlayer = document.querySelector("#ndaPreviewPlayer");
  const ndaPreviewAudio = document.querySelector("#ndaPreviewAudio");
  const ndaPreviewJoin = document.querySelector("#ndaPreviewJoin");
  const ndaPreviewStatus = document.querySelector("#ndaPreviewStatus");
  if (!section || !forms.length) return;

  const endpoint = String(window.PRXD_SIGNUP_ENDPOINT || "");
  const endpointOk = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
  if (!endpointOk) return;

  const links = document.querySelectorAll("[data-signup-link]");
  const dismissalKey = "prxd-signup-prompt-dismissed";
  const dismissalAge = 7 * 24 * 60 * 60 * 1000;
  const ndaUnlockKey = "prxd-nda-preview-unlocked";
  const ndaPreviewSource = "/assets/releases/nda-first-half-preview.mp3";
  const ndaPreviewMaximum = 97.2975;
  const timers = new WeakMap();
  let activeForm = null;

  forms.forEach((form) => {
    form.action = endpoint;
    form.elements.form_started_at.value = String(Date.now());
  });
  section.hidden = false;
  links.forEach((link) => { link.hidden = false; });

  function setStatus(form, message, isError = false) {
    const status = form.querySelector("[data-signup-status]");
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function finish(form, message, isError, clearEmail) {
    if (!form) return;
    clearTimeout(timers.get(form));
    const input = form.elements.email;
    const button = form.querySelector(".signup__submit");
    button.disabled = false;
    setStatus(form, message, isError);
    if (clearEmail) {
      input.value = "";
      form.elements.form_started_at.value = String(Date.now());
    }
  }

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      const input = form.elements.email;
      const button = form.querySelector(".signup__submit");
      input.value = input.value.trim();
      if (!form.checkValidity()) {
        event.preventDefault();
        input.setAttribute("aria-invalid", "true");
        setStatus(form, "Enter a valid email address.", true);
        input.focus();
        return;
      }

      activeForm = form;
      input.removeAttribute("aria-invalid");
      button.disabled = true;
      setStatus(form, "Adding you to the list.");
      clearTimeout(timers.get(form));
      const timer = setTimeout(() => {
        finish(form, "That did not finish. Please try again.", true, false);
      }, 15000);
      timers.set(form, timer);
    });
  });

  function rememberDismissal() {
    try { localStorage.setItem(dismissalKey, String(Date.now())); } catch (ignored) {}
  }

  function wasRecentlyDismissed() {
    try {
      const dismissedAt = Number(localStorage.getItem(dismissalKey) || 0);
      const age = Date.now() - dismissedAt;
      return dismissedAt > 0 && age >= 0 && age < dismissalAge;
    } catch (ignored) { return false; }
  }

  function setNdaPreviewStatus(message, isError = false) {
    if (!ndaPreviewStatus) return;
    ndaPreviewStatus.textContent = message;
    ndaPreviewStatus.classList.toggle("is-error", isError);
  }

  function rememberNdaUnlock() {
    try { localStorage.setItem(ndaUnlockKey, "1"); } catch (ignored) {}
  }

  function forgetNdaUnlock() {
    try { localStorage.removeItem(ndaUnlockKey); } catch (ignored) {}
  }

  function ndaWasUnlocked() {
    try { return localStorage.getItem(ndaUnlockKey) === "1"; } catch (ignored) { return false; }
  }

  function unlockNdaPreview(announce = false) {
    if (!ndaPreviewLocked || !ndaPreviewPlayer || !ndaPreviewAudio) return;
    rememberNdaUnlock();
    ndaPreviewLocked.hidden = true;
    ndaPreviewPlayer.hidden = false;
    if (!ndaPreviewAudio.getAttribute("src")) ndaPreviewAudio.setAttribute("src", ndaPreviewSource);
    if (announce) setNdaPreviewStatus("Preview unlocked. Press play when you're ready.");
  }

  function openPrompt(shouldFocus = false) {
    if (!prompt || !promptOpen || !prompt.hidden) return;
    prompt.hidden = false;
    promptOpen.hidden = true;
    promptOpen.setAttribute("aria-expanded", "true");
    if (shouldFocus) promptForm?.elements.email.focus();
  }

  function closePrompt(restoreFocus = true, remember = true) {
    if (!prompt || prompt.hidden) return;
    if (remember) rememberDismissal();
    prompt.hidden = true;
    promptOpen.hidden = false;
    promptOpen.setAttribute("aria-expanded", "false");
    if (restoreFocus) promptOpen.focus();
  }

  if (prompt && promptOpen && promptClose) {
    promptOpen.hidden = false;
    promptOpen.addEventListener("click", () => openPrompt(true));
    promptClose.addEventListener("click", () => closePrompt());
    prompt.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePrompt();
      }
    });
    document.querySelectorAll('[data-jump="follow"]').forEach((link) => {
      link.addEventListener("click", () => closePrompt(false, false));
    });
    // Let the NDA launch message lead; visitors can open this panel when they choose.
  }

  if (ndaPreviewAudio) {
    ndaPreviewAudio.addEventListener("loadedmetadata", () => {
      if (!Number.isFinite(ndaPreviewAudio.duration) || ndaPreviewAudio.duration > ndaPreviewMaximum) {
        ndaPreviewAudio.pause();
        ndaPreviewAudio.removeAttribute("src");
        ndaPreviewAudio.load();
        if (ndaPreviewPlayer) ndaPreviewPlayer.hidden = true;
        if (ndaPreviewLocked) ndaPreviewLocked.hidden = false;
        forgetNdaUnlock();
        setNdaPreviewStatus("The preview is temporarily unavailable.", true);
      }
    });
    ndaPreviewAudio.addEventListener("seeking", () => {
      if (ndaPreviewAudio.currentTime > ndaPreviewMaximum) {
        ndaPreviewAudio.pause();
        ndaPreviewAudio.currentTime = Math.min(ndaPreviewMaximum, ndaPreviewAudio.duration || ndaPreviewMaximum);
      }
    });
  }

  ndaPreviewJoin?.addEventListener("click", () => {
    setNdaPreviewStatus("Complete the email signup to unlock the preview.");
    if (prompt && promptOpen) openPrompt(true);
    else {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector("#signupEmail")?.focus({ preventScroll: true });
    }
  });

  if (ndaWasUnlocked()) unlockNdaPreview(false);

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "prxd-signup-result") return;

    switch (event.data.status) {
      case "saved":
      case "resubscribed":
        activeForm?.elements.email.removeAttribute("aria-invalid");
        finish(activeForm, "You're on the list. Thank you.", false, true);
        unlockNdaPreview(true);
        if (activeForm === promptForm) rememberDismissal();
        break;
      case "duplicate":
        activeForm?.elements.email.removeAttribute("aria-invalid");
        finish(activeForm, "You're already on the list.", false, true);
        unlockNdaPreview(true);
        if (activeForm === promptForm) rememberDismissal();
        break;
      case "invalid":
        finish(activeForm, "Enter a valid email address.", true, false);
        activeForm?.elements.email.setAttribute("aria-invalid", "true");
        activeForm?.elements.email.focus();
        break;
      default:
        activeForm?.elements.email.removeAttribute("aria-invalid");
        finish(activeForm, "That did not save. Please try again.", true, false);
    }
  });
})();
