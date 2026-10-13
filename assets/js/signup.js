(() => {
  "use strict";

  const section = document.querySelector("#updates");
  const forms = [...document.querySelectorAll("[data-signup-form]")];
  const prompt = document.querySelector("#signupPrompt");
  const promptForm = document.querySelector("#promptSignupForm");
  const promptOpen = document.querySelector("#signupPromptOpen");
  const promptClose = document.querySelector("#signupPromptClose");
  if (!section || !forms.length) return;

  const endpoint = String(window.PRXD_SIGNUP_ENDPOINT || "");
  const endpointOk = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
  if (!endpointOk) return;

  const links = document.querySelectorAll("[data-signup-link]");
  const dismissalKey = "prxd-signup-prompt-dismissed";
  const dismissalAge = 7 * 24 * 60 * 60 * 1000;
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

  function openPrompt() {
    if (!prompt || !promptOpen || prompt.open) return;
    prompt.showModal();
    promptOpen.hidden = true;
    promptForm?.elements.email.focus();
  }

  function closePrompt() {
    if (!prompt?.open) return;
    rememberDismissal();
    prompt.close();
  }

  if (prompt && promptOpen && promptClose) {
    promptOpen.hidden = false;
    promptOpen.addEventListener("click", openPrompt);
    promptClose.addEventListener("click", closePrompt);
    prompt.addEventListener("cancel", (event) => {
      event.preventDefault();
      closePrompt();
    });
    prompt.addEventListener("click", (event) => {
      if (event.target === prompt) closePrompt();
    });
    prompt.addEventListener("close", () => { promptOpen.hidden = false; });
    if (!wasRecentlyDismissed()) openPrompt();
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "prxd-signup-result") return;

    switch (event.data.status) {
      case "saved":
      case "resubscribed":
        activeForm?.elements.email.removeAttribute("aria-invalid");
        finish(activeForm, "You're on the list. Thank you.", false, true);
        if (activeForm === promptForm) rememberDismissal();
        break;
      case "duplicate":
        activeForm?.elements.email.removeAttribute("aria-invalid");
        finish(activeForm, "You're already on the list.", false, true);
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
