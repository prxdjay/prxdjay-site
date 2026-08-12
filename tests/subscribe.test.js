import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/api/subscribe.js";

const env = {
  SITE_ORIGIN: "https://prxdjay.com",
  TURNSTILE_SECRET_KEY: "turnstile-secret",
  BREVO_API_KEY: "brevo-secret",
  BREVO_LIST_ID: "12",
  BREVO_DOI_TEMPLATE_ID: "34",
  BREVO_REDIRECT_URL: "https://prxdjay.com/?confirmed=1#list",
};

function context(body, overrides = {}) {
  const request = new Request("https://prxdjay.com/api/subscribe", {
    method: overrides.method || "POST",
    headers: {
      Origin: overrides.origin || "https://prxdjay.com",
      "Content-Type": overrides.contentType || "application/json",
    },
    body: (overrides.method || "POST") === "GET" ? undefined : JSON.stringify(body),
  });
  return { request, env: overrides.env || env };
}

test("rejects requests from another origin", async () => {
  const response = await onRequest(context({}, { origin: "https://example.com" }));
  assert.equal(response.status, 403);
});

test("rejects requests without an origin", async () => {
  const request = new Request("https://prxdjay.com/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "fan@example.com" }),
  });
  const response = await onRequest({ request, env });
  assert.equal(response.status, 403);
});

test("rejects invalid email before external calls", async () => {
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async () => { called = true; return new Response(); };
  try {
    const response = await onRequest(context({ email: "not-an-email", stage: "email" }));
    assert.equal(response.status, 400);
    assert.equal(called, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fails closed when secrets are missing", async () => {
  const response = await onRequest(context(
    { email: "fan@example.com", stage: "email" },
    { env: { SITE_ORIGIN: "https://prxdjay.com" } },
  ));
  assert.equal(response.status, 503);
});

test("rejects oversized requests", async () => {
  const response = await onRequest(context({
    email: "fan@example.com",
    stage: "email",
    padding: "x".repeat(9000),
  }));
  assert.equal(response.status, 413);
});

test("requires a valid Turnstile result", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => Response.json({ success: false });
  try {
    const response = await onRequest(context({
      email: "fan@example.com",
      stage: "email",
      turnstileToken: "bad-token",
    }));
    assert.equal(response.status, 400);
  } finally {
    global.fetch = originalFetch;
  }
});

test("starts Brevo double confirmation after Turnstile passes", async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "subscribe" });
    }
    return new Response("{}", { status: 201, headers: { "Content-Type": "application/json" } });
  };
  try {
    const response = await onRequest(context({
      email: " Fan@Example.com ",
      stage: "email",
      source: "section",
      turnstileToken: "valid-token",
    }));
    assert.equal(response.status, 202);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, "https://api.brevo.com/v3/contacts/doubleOptinConfirmation");
    const body = JSON.parse(calls[1].options.body);
    assert.equal(body.email, "fan@example.com");
    assert.deepEqual(body.includeListIds, [12]);
    assert.equal(body.attributes.SIGNUP_SOURCE, "section");
  } finally {
    global.fetch = originalFetch;
  }
});

test("rejects unsupported methods", async () => {
  const response = await onRequest(context(null, { method: "GET" }));
  assert.equal(response.status, 405);
});
