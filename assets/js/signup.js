(() => {
  "use strict";

  const section = document.querySelector("#updates");
  const form = document.querySelector("#signupForm");
  if (!section || !form) return;

  const endpoint = String(window.PRXD_SIGNUP_ENDPOINT || "");
  const endpointOk = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
  if (!endpointOk) return;

  const input = form.querySelector("#signupEmail");
  const button = form.querySelector(".signup__submit");
  const status = form.querySelector("#signupStatus");
  const started = form.elements.form_started_at;
  const links = document.querySelectorAll("[data-signup-link]");
  let timer = 0;

  form.action = endpoint;
  started.value = String(Date.now());
  section.hidden = false;
  links.forEach((link) => { link.hidden = false; });

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function finish(message, isError, clearEmail) {
    clearTimeout(timer);
    button.disabled = false;
    setStatus(message, isError);
    if (clearEmail) {
      input.value = "";
      started.value = String(Date.now());
    }
  }

  form.addEventListener("submit", (event) => {
    input.value = input.value.trim();
    if (!form.checkValidity()) {
      event.preventDefault();
      input.setAttribute("aria-invalid", "true");
      setStatus("Enter a valid email address.", true);
      input.focus();
      return;
    }

    input.removeAttribute("aria-invalid");
    button.disabled = true;
    setStatus("Adding you to the list…");
    clearTimeout(timer);
    timer = setTimeout(() => {
      finish("That did not finish. Please try again.", true, false);
    }, 15000);
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "prxd-signup-result") return;

    switch (event.data.status) {
      case "saved":
      case "resubscribed":
        input.removeAttribute("aria-invalid");
        finish("You're on the list. Thank you.", false, true);
        break;
      case "duplicate":
        input.removeAttribute("aria-invalid");
        finish("You're already on the list.", false, true);
        break;
      case "invalid":
        finish("Enter a valid email address.", true, false);
        input.setAttribute("aria-invalid", "true");
        input.focus();
        break;
      default:
        input.removeAttribute("aria-invalid");
        finish("That did not save. Please try again.", true, false);
    }
  });
})();
