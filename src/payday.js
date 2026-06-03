// ─── Payday.is API client ───────────────────────────────────────────────────
//
// Two auth modes, picked automatically at build time:
//
//   DEV (vite dev server)
//     - Reads VITE_PAYDAY_CLIENT_ID / VITE_PAYDAY_CLIENT_SECRET from .env
//     - Exchanges them for a bearer token client-side
//     - Sends Authorization: Bearer <token> on each request
//     - Requests still go to /payday-api/* (vite.config.js proxies to
//       https://api.payday.is/* so CORS is satisfied)
//
//   PROD (built bundle behind Netlify)
//     - Client makes plain requests to /payday-api/* with no Authorization
//       header and no VITE_ credentials in the bundle
//     - netlify.toml redirects /payday-api/* to a Netlify Function
//       (netlify/functions/payday.js) that holds the credentials in its
//       server-side env (PAYDAY_CLIENT_ID / PAYDAY_CLIENT_SECRET, no
//       VITE_ prefix), exchanges them for a token, and proxies the call.
//     - This keeps the OAuth secret off the public JS bundle.

const IS_DEV = !!import.meta.env.DEV;
const PAYDAY_CLIENT_ID = import.meta.env.VITE_PAYDAY_CLIENT_ID || "";
const PAYDAY_CLIENT_SECRET = import.meta.env.VITE_PAYDAY_CLIENT_SECRET || "";
const BASE = "/payday-api";
const API_VERSION = "alpha";

// ─── Token cache ─────────────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(`${BASE}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Version": API_VERSION,
    },
    body: JSON.stringify({
      clientId: PAYDAY_CLIENT_ID,
      clientSecret: PAYDAY_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Payday token exchange failed:", res.status, err);
    cachedToken = null;
    tokenExpiresAt = 0;
    return null;
  }

  const data = await res.json();
  // Payday may return token in different shapes — handle common patterns
  cachedToken = data.access_token || data.accessToken || data.token || null;
  const expiresIn = data.expires_in || data.expiresIn || 3600; // default 1h
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  return cachedToken;
}

// ─── Core request function ───────────────────────────────────────────────────

async function paydayRequest(endpoint, { method = "GET", params = {}, body = null } = {}) {
  // In dev the client handles auth; in prod the Netlify Function handles it.
  // See header comment for the full architecture.
  let token = null;
  if (IS_DEV) {
    token = await getAccessToken();
    if (!token) {
      return { ok: false, data: null, page: null, error: { message: "Auth failed — no token" } };
    }
  }

  // Build query string from params
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const url = `${BASE}${endpoint}${qs ? "?" + qs : ""}`;

  // Two body modes:
  //   FormData → multipart upload (attachments). Don't set Content-Type
  //   manually — browser fetch derives the multipart boundary itself.
  //   anything else → JSON body, with Content-Type: application/json.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = { "Api-Version": API_VERSION };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  try {
    let res = await fetch(url, options);

    // Auto-retry once on 401 — only meaningful in dev where we hold the
    // token; in prod the function refreshes its own cache transparently.
    if (res.status === 401 && IS_DEV) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const freshToken = await getAccessToken();
      if (freshToken) {
        headers.Authorization = `Bearer ${freshToken}`;
        // Re-send the same body — FormData is reusable, JSON gets restringified.
        const retryBody = isFormData ? body : (body ? JSON.stringify(body) : undefined);
        res = await fetch(url, { method, headers, body: retryBody });
      }
    }

    if (!res.ok) {
      // Capture as much as Payday gives us. Some 4xx responses come back
      // with an empty body, in which case the HTTP status itself is the
      // diagnostic. Read the body as text first so we can fall back to a
      // string when JSON parsing fails (e.g. HTML error pages).
      const rawBody = await res.text().catch(() => "");
      let parsed = null;
      try { parsed = rawBody ? JSON.parse(rawBody) : null; } catch { /* not JSON */ }
      const error = {
        status: res.status,
        statusText: res.statusText,
        url,
        method,
        // Surface a useful message even when the body is empty.
        message: parsed?.message
              || parsed?.error
              || parsed?.title
              || (rawBody ? rawBody.slice(0, 500) : `HTTP ${res.status} ${res.statusText}`),
        body: parsed ?? rawBody,
      };
      // Log the full diagnostic to the console so the developer can copy it.
      console.error("Payday API error:", error);
      return { ok: false, data: null, page: null, error };
    }

    if (res.status === 204) {
      return { ok: true, data: null, page: null, error: null };
    }

    const json = await res.json();
    // Payday wraps arrays in named keys: { customers: [...], page: 1, pages: N, total: N }
    // Extract the first array value, and build a page object from top-level fields.
    const arrayKey = Object.keys(json).find(k => Array.isArray(json[k]));
    const data = arrayKey ? json[arrayKey] : (json.data || json);
    const page = json.pages != null ? { page: json.page, pages: json.pages, total: json.total, perPage: json.perPage } : null;
    return { ok: true, data, page, error: null };
  } catch (err) {
    return { ok: false, data: null, page: null, error: { message: err.message } };
  }
}

// ─── Paginated fetch (all pages) ─────────────────────────────────────────────

async function fetchAllPages(endpoint, params = {}) {
  let allData = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await paydayRequest(endpoint, {
      params: { ...params, page, perpage: 500 },
    });
    if (!result.ok) return result;
    allData = allData.concat(result.data || []);
    // Payday pagination: { page: 1, pages: N, total: N, perPage: N }
    const pg = result.page;
    hasNext = pg ? (typeof pg === "object" ? (pg.page || page) < (pg.pages || 1) : false) : false;
    page++;
  }

  return { ok: true, data: allData, page: null, error: null };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const payday = {
  // Connection test. In dev we can introspect the local VITE_ vars; in
  // prod the credentials live server-side on the Netlify Function, so the
  // best the browser can do is "probably configured" — actual failures
  // surface via a clear 500 from the function if it's missing creds.
  connected: () => IS_DEV ? (!!PAYDAY_CLIENT_ID && !!PAYDAY_CLIENT_SECRET) : true,

  company: {
    get: () => paydayRequest("/company"),
  },

  customers: {
    list: (params) => fetchAllPages("/customers", params),
    get: (id) => paydayRequest(`/customers/${id}`),
    get_list_page: (params) => paydayRequest("/customers", { params }),
  },

  invoices: {
    list: (params) => fetchAllPages("/invoices", params),
    get: (id, params) => paydayRequest(`/invoices/${id}`, { params }),
    create: (body) => paydayRequest("/invoices", { method: "POST", body }),
    update: (id, body) => paydayRequest(`/invoices/${id}`, { method: "PATCH", body }),
    // Attach a binary file (e.g. our cost-breakdown PDF) to an existing
    // invoice. Posts multipart/form-data — the FormData branch in
    // paydayRequest lets fetch set the Content-Type boundary itself.
    //
    // Endpoint is a guess based on REST conventions (/invoices/{id}/
    // attachments). If Payday rejects with 404 we'll try /attachments
    // with the invoiceId in the body next.
    attachFile: (invoiceId, blob, filename = "attachment.pdf") => {
      const fd = new FormData();
      fd.append("file", blob, filename);
      return paydayRequest(`/invoices/${invoiceId}/attachments`, { method: "POST", body: fd });
    },
    // Read-only probe: does GET /invoices/{id}/attachments resolve at all?
    // Used as a pre-flight check before creating a new invoice so a wrong
    // URL guess doesn't leave a stray finalized invoice on the books.
    listAttachments: (invoiceId) => paydayRequest(`/invoices/${invoiceId}/attachments`),
  },

  expenses: {
    list: (params) => fetchAllPages("/expenses", params),
  },

  payments: {
    list: (params) => fetchAllPages("/payments", params),
    types: () => paydayRequest("/payment-types"),
  },

  accounts: {
    list: () => paydayRequest("/accounts"),
    statement: (params) => paydayRequest("/account-statement", { params }),
    expenseAccounts: () => paydayRequest("/expense-accounts"),
  },

  bankTransactions: {
    list: (params) => paydayRequest("/bank-transactions", { params }),
  },

  salesOrders: {
    list: (params) => fetchAllPages("/sales-orders", params),
  },

  journalEntries: {
    list: (params) => fetchAllPages("/journal-entries", params),
    create: (body) => paydayRequest("/journal-entries", { method: "POST", body }),
    update: (id, body) => paydayRequest(`/journal-entries/${id}`, { method: "PATCH", body }),
  },
};
