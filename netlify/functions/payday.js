// ─── Payday API proxy (Netlify Function v2) ────────────────────────────────
//
// Holds Payday OAuth credentials server-side so they never reach the browser
// bundle. The client makes plain requests to /payday-api/<endpoint>;
// netlify.toml rewrites those to /.netlify/functions/payday/<endpoint>; this
// function exchanges credentials for a bearer token, retries on 401, and
// proxies the response back unchanged.
//
// Why v2 (export default + Request/Response objects) rather than v1
// (event.body strings + isBase64Encoded flag):
// v1 passed request bodies as STRINGS, and binary content (like the PDF
// bytes inside a multipart/form-data invoice create) only survived intact
// if Netlify chose to base64-encode it — a heuristic we couldn't control
// or audit. v2's req.arrayBuffer() gives us the raw bytes directly, with
// no encoding round-trip, so multipart uploads forward to Payday byte-
// for-byte regardless of the inner Content-Type.
//
// Required environment variables (set in Netlify UI → Site settings →
// Environment variables — NOT prefixed with VITE_, since these stay
// server-side):
//   PAYDAY_CLIENT_ID
//   PAYDAY_CLIENT_SECRET

const PAYDAY_API = "https://api.payday.is";
const API_VERSION = "alpha";

// Token cache lives in module scope — survives between invocations on a
// warm function instance. Cold starts re-exchange the token, which is
// fine at our volume.
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken(clientId, clientSecret, forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }
  const res = await fetch(`${PAYDAY_API}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Version": API_VERSION },
    body: JSON.stringify({ clientId, clientSecret }),
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

// Strip the routing prefix off the incoming path so we can forward
// what's left to Payday. Handles both possible inbound shapes:
//   /.netlify/functions/payday/<path>   (post-redirect)
//   /payday-api/<path>                  (direct invocation)
function payloadPath(pathname) {
  if (!pathname) return "/";
  const cleaned = pathname
    .replace(/^\/\.netlify\/functions\/payday/, "")
    .replace(/^\/payday-api/, "");
  return cleaned || "/";
}

export default async (req) => {
  const clientId     = process.env.PAYDAY_CLIENT_ID     || "";
  const clientSecret = process.env.PAYDAY_CLIENT_SECRET || "";

  const url = new URL(req.url);
  const path = payloadPath(url.pathname);

  // Reject /auth/token explicitly — the function manages auth on its own
  // and the credentials never need to be exposed to the browser.
  if (path === "/auth/token") {
    return new Response(
      JSON.stringify({ message: "Auth is handled server-side; do not call /auth/token directly." }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({
        message: "Payday credentials are not configured on the Netlify Function (PAYDAY_CLIENT_ID / PAYDAY_CLIENT_SECRET).",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const upstreamUrl = `${PAYDAY_API}${path}${url.search || ""}`;
  const method = (req.method || "GET").toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  // Read body as raw bytes. This is the whole point of the v2 migration:
  // multipart bodies (and any other binary content) come through
  // unmangled, with the multipart boundary intact.
  const bodyBytes = hasBody ? await req.arrayBuffer() : undefined;

  // Preserve the inbound Content-Type verbatim — for multipart this
  // includes the boundary parameter, which must match the bytes in the
  // body or the upstream parser will reject the request.
  const contentType = req.headers.get("content-type") || "application/json";

  const callPayday = async (token) => fetch(upstreamUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
      "Api-Version": API_VERSION,
    },
    body: bodyBytes,
  });

  try {
    let token = await getAccessToken(clientId, clientSecret);
    let res = await callPayday(token);

    // 401 → refresh + retry once.
    if (res.status === 401) {
      token = await getAccessToken(clientId, clientSecret, true);
      res = await callPayday(token);
    }

    // Forward an allow-list of upstream response headers that matter for
    // client-side diagnostics. Allow is required on 405 responses
    // (RFC 9110 §15.5.6) and tells us which method to use. Allow-listed
    // rather than passed through wholesale so server-internal headers
    // don't leak.
    const outHeaders = new Headers();
    outHeaders.set("Content-Type", res.headers.get("content-type") || "application/json");
    for (const name of ["allow", "www-authenticate", "retry-after", "location"]) {
      const v = res.headers.get(name);
      if (v) outHeaders.set(name, v);
    }

    const body = await res.text();
    return new Response(body || "", { status: res.status, headers: outHeaders });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: `Payday proxy error: ${err.message}` }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
};
