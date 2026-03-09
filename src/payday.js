// ─── Payday.is API client (via Vite dev proxy) ──────────────────────────────
//
// All requests go through /payday-api/* which Vite proxies to api.payday.is.
// OAuth token is obtained via POST /auth/token with clientId + clientSecret.

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
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, data: null, page: null, error: { message: "Auth failed — no token" } };
  }

  // Build query string from params
  const qs = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const url = `${BASE}${endpoint}${qs ? "?" + qs : ""}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Api-Version": API_VERSION,
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    let res = await fetch(url, options);

    // Auto-retry once on 401 (token may have expired)
    if (res.status === 401) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const freshToken = await getAccessToken();
      if (freshToken) {
        headers.Authorization = `Bearer ${freshToken}`;
        res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
      }
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { ok: false, data: null, page: null, error: errBody };
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
  // Connection test
  connected: () => !!PAYDAY_CLIENT_ID && !!PAYDAY_CLIENT_SECRET,

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
