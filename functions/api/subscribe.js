const RESPONSE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: RESPONSE_HEADERS });
}

function isEmail(value) {
  return typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

async function verifyTurnstile(token, request, secret) {
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);

  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.set("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );

  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && (!result.action || result.action === "subscribe");
}

async function handlePost(context) {
  const { request, env } = context;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  const allowedOrigins = new Set(
    [requestUrl.origin, env.SITE_ORIGIN].filter(Boolean),
  );

  if (!origin || !allowedOrigins.has(origin)) {
    return json(403, { ok: false, message: "Request not allowed." });
  }

  const type = request.headers.get("Content-Type") || "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, message: "Invalid request." });
  }

  let raw;
  let body;
  try {
    raw = await request.text();
    if (new TextEncoder().encode(raw).length > 8192) {
      return json(413, { ok: false, message: "Invalid request." });
    }
    body = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, message: "Invalid request." });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json(400, { ok: false, message: "Invalid request." });
  }

  // Bots tend to fill this hidden field. Return the normal success shape so
  // the endpoint does not teach them how the trap works.
  if (body.website) {
    return json(202, { ok: true, message: "Check your inbox to confirm." });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const token = String(body.turnstileToken || "");
  const stage = String(body.stage || "email");

  if (stage !== "email" || !isEmail(email)) {
    return json(400, { ok: false, message: "Enter a valid email address." });
  }

  const listId = positiveInteger(env.BREVO_LIST_ID);
  const templateId = positiveInteger(env.BREVO_DOI_TEMPLATE_ID);
  const redirectUrl = env.BREVO_REDIRECT_URL || env.SITE_ORIGIN;

  if (!env.TURNSTILE_SECRET_KEY || !env.BREVO_API_KEY || !listId ||
      !templateId || !redirectUrl) {
    return json(503, {
      ok: false,
      message: "The email list is temporarily unavailable. Please try again later.",
    });
  }

  let human = false;
  try {
    human = await verifyTurnstile(token, request, env.TURNSTILE_SECRET_KEY);
  } catch {
    human = false;
  }

  if (!human) {
    return json(400, {
      ok: false,
      message: "The security check expired. Please try again.",
    });
  }

  const source = ["section", "prompt", "exit", "drop", "dock", "site"]
    .includes(body.source) ? body.source : "site";

  let response;
  try {
    response = await fetch(
      "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          email,
          includeListIds: [listId],
          redirectionUrl: redirectUrl,
          templateId,
          attributes: { SIGNUP_SOURCE: source },
        }),
      },
    );
  } catch {
    return json(502, {
      ok: false,
      message: "That did not send. Please try again.",
    });
  }

  if (!response.ok) {
    console.error("Brevo subscription request failed", response.status);
    return json(502, {
      ok: false,
      message: "That did not send. Please try again.",
    });
  }

  return json(202, { ok: true, message: "Check your inbox to confirm." });
}

export function onRequest(context) {
  if (context.request.method !== "POST") {
    return json(405, { ok: false, message: "Method not allowed." });
  }
  return handlePost(context);
}
