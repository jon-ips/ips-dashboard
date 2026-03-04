// ─── Supabase REST API thin wrapper (no SDK dependency) ──────────────────────

export const SUPABASE_URL = "https://hszrtbjewapkgetfxnrk.supabase.co";
export const SUPABASE_ANON_KEY =
  "sb_publishable_h-_YX9FOC5J3SRnk_dxqgA_DxpoM61H";

export const SUPABASE_CONFIGURED = !SUPABASE_URL.includes("YOUR_PROJECT");

export const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// ─── Query-builder factory ───────────────────────────────────────────────────

function createQueryBuilder(table) {
  const state = {
    table,
    filters: [],     // e.g. ["status=eq.pending", "id=eq.5"]
    orderClause: null, // e.g. "created_at.desc"
    method: "GET",
    body: null,
    returnSingle: false,
    columns: null,
  };

  // Build the final URL from accumulated state
  function buildUrl() {
    const params = [];

    if (state.columns) {
      params.push(`select=${encodeURIComponent(state.columns)}`);
    }
    state.filters.forEach((f) => params.push(f));
    if (state.orderClause) {
      params.push(`order=${state.orderClause}`);
    }

    const qs = params.length ? `?${params.join("&")}` : "";
    return `${SUPABASE_URL}/rest/v1/${state.table}${qs}`;
  }

  // Execute the built-up query
  async function execute() {
    const url = buildUrl();
    const headers = { ...supabaseHeaders };

    // For insert/update, ask Supabase to return the resulting rows
    if (state.method === "POST" || state.method === "PATCH") {
      headers["Prefer"] = "return=representation";
    }

    // For single-row responses, tell PostgREST to return an object
    if (state.returnSingle) {
      headers["Accept"] = "application/vnd.pgrst.object+json";
    }

    const options = { method: state.method, headers };
    if (state.body !== null) {
      options.body = JSON.stringify(state.body);
    }

    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return { data: null, error: errBody };
      }
      // DELETE with no content
      if (res.status === 204) {
        return { data: null, error: null };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // The builder object — every method returns `builder` so calls can be chained.
  // It also exposes `.then()` so the chain is directly awaitable.
  const builder = {
    // ── Verb methods (pick one) ──────────────────────────────────────────

    select(columns = "*") {
      state.method = "GET";
      state.columns = columns;
      return builder;
    },

    insert(rows) {
      state.method = "POST";
      state.body = rows;
      return builder;
    },

    update(values) {
      state.method = "PATCH";
      state.body = values;
      return builder;
    },

    delete() {
      state.method = "DELETE";
      return builder;
    },

    // ── Filter / modifier methods ────────────────────────────────────────

    eq(column, value) {
      state.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
      return builder;
    },

    order(column, { ascending = true } = {}) {
      state.orderClause = `${encodeURIComponent(column)}.${ascending ? "asc" : "desc"}`;
      return builder;
    },

    single() {
      state.returnSingle = true;
      return builder;
    },

    // ── Thenable interface — makes the builder directly awaitable ─────

    then(resolve, reject) {
      return execute().then(resolve, reject);
    },
  };

  return builder;
}

// ─── Public helper object ────────────────────────────────────────────────────

export const supabase = {
  from(table) {
    return createQueryBuilder(table);
  },
};
