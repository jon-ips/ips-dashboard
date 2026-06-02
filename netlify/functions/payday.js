// ─── Payday API proxy (Netlify Function) ───────────────────────────────────
//
// Holds Payday OAuth credentials server-side so they never reach the browser
// bundle. The client makes plain requests to /payday-api/<endpoint>;
// netlify.toml rewrites those to /.netlify/functions/payday/<endpoint>; this
// function exchanges credentials for a bearer token, retries on 401, and
// proxies the response back unchanged.
//
// Required environment variables (set in Netlify UI → Site settings →
// Environment variables — NOT prefixed with VITE_, since these stay
// server-side):
//   PAYDAY_CLIENT_ID
//   PAYDAY_CLIENT_SECRET
//
// The token cache lives in module scope so it survives between invocations
// while the Lambda is warm. Cold starts re-exchange — fine for our volumes.

const PAYDAY_API = "https://api.payday.is";
const API_VERSION = "alpha";
const CLIENT_ID = process.env.PAYDAY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYDAY_CLIENT_SECRET || "";

// Token cache — warm-only.
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }
  const res = await fetch(`${PAYDAY_API}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Version": API_VERSION },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Payday auth failed: ${res.status} ${errBody}`);
  }
  const data = await res.json();
  cachedToken = data.access_token || data.accessToken || data.token || null;
  const ttl = data.expires_in || data.expiresIn || 3600;
  tokenExpiresAt = Date.now() + ttl * 1000;
  if (!cachedToken) throw new Error("Payday auth response did not contain a token");
  return cachedToken;
}

// Strip our routing prefix off the incoming path so we can forward what's
// left to Payday. Handles both the post-redirect form
// (/.netlify/functions/payday/...) and the direct-invocation form
// (/payday-api/...) — defensive against either route working.
function payloadPath(eventPath) {
  if (!eventPath) return "";
  const cleaned = eventPath
    .replace(/^\/\.netlify\/functions\/payday/, "")
    .replace(/^\/payday-api/, "");
  return cleaned || "/";
}

export const handler = async (event) => {
  // Reject the auth/token endpoint explicitly — the function manages auth on
  // its own; an external caller has no business hitting that path.
  const path = payloadPath(event.path);
  if (path === "/auth/token") {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Auth is handled server-side; do not call /auth/token directly." }),
    };
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Payday credentials are not configured on the Netlify Function (PAYDAY_CLIENT_ID / PAYDAY_CLIENT_SECRET).",
      }),
    };
  }

  // Forward query string verbatim — Netlify gives us rawQuery for this.
  const url = `${PAYDAY_API}${path}${event.rawQuery ? "?" + event.rawQuery : ""}`;

  const callPayday = async (token) => fetch(url, {
    method: event.httpMethod || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Api-Version": API_VERSION,
    },
    body: ["GET", "HEAD"].includes((event.httpMethod || "GET").toUpperCase())
      ? undefined
      : (event.body || undefined),
  });

  try {
    let token = await getAccessToken();
    let res = await callPayday(token);

    // 401 → refresh + retry once. Mirrors the old client-side behaviour.
    if (res.status === 401) {
      token = await getAccessToken(true);
      res = await callPayday(token);
    }

    const body = await res.text();
    return {
      statusCode: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
      body: body || "",
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Payday proxy error: ${err.message}` }),
    };
  }
};
