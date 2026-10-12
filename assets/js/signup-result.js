(() => {
  "use strict";
  const allowed = new Set(["saved", "duplicate", "resubscribed", "invalid", "error"]);
  const value = new URLSearchParams(location.search).get("status") || "error";
  const status = allowed.has(value) ? value : "error";
  if (window.parent !== window) {
    window.parent.postMessage({ type: "prxd-signup-result", status }, location.origin);
  } else {
    location.replace("/?signup=" + encodeURIComponent(status) + "#updates");
  }
})();
