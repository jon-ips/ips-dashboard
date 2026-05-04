# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on localhost:5173 (PORT env var overrides)
npm run build     # Production build → dist/
npm run preview   # Serve production build locally
```

No lint, test, or typecheck scripts exist.

## Architecture

React 18 SPA (Vite, no TypeScript). The codebase is split into module-level files, each a self-contained React component:

| File | Purpose |
|------|---------|
| `src/main.jsx` | Entry — manages `accessLevel` state (`null` → auth gate, `"team"` or `"ceo"` → dashboard) |
| `src/AuthGate.jsx` | PIN authentication (`VITE_TEAM_PIN`, `VITE_CEO_PIN`) |
| `src/App.jsx` | Shell — fixed sidebar, module routing, Supabase data load on mount |
| `src/MarketIntel.jsx` | Port call analytics, equipment forecasting, crunch calendar |
| `src/Workspace.jsx` | Task management (JH/TH shared), Supabase-backed with localStorage fallback |
| `src/CFOWorkspace.jsx` | Contracts, invoices (Payday live), expenses, staff payroll — CEO only |
| `src/constants.js` | Hardcoded 2026 season port calls (226 entries), color palette, ship config |
| `src/shared.jsx` | Reusable UI components and icons |
| `src/supabase.js` | Custom Supabase REST wrapper (no SDK) |
| `src/payday.js` | Payday.is OAuth client with in-memory token cache |

**Access levels:** `team` sees Market Intel + Workspace; `ceo` sees all three modules including CFO Workspace.

## Key Patterns

**Custom Supabase REST wrapper** (`src/supabase.js`): Mimics SDK chainable syntax (`supabase.from().select().eq()...`) but uses raw `fetch()` against the PostgREST REST API. The `SUPABASE_ANON_KEY` is the publishable key, hardcoded in the file alongside the URL.

**Payday API proxy**: All calls go through `/payday-api/*`. In dev, Vite proxies this to `https://api.payday.is`; in production, `vercel.json` rewrites it. Never call `api.payday.is` directly — CORS would block it. Credentials live in `VITE_PAYDAY_CLIENT_ID` / `VITE_PAYDAY_CLIENT_SECRET`.

**Data fallback chain**: `App.jsx` fetches port calls from Supabase on mount; if the table is empty or unreachable, it falls back to the `SHIPS` constant in `constants.js`. Downstream components receive `portCalls` as a prop and should not import `SHIPS` directly.

**All styles are inline** — `<style>` tags injected in each component, no CSS files, no CSS modules, no Tailwind. Colors are hardcoded (no CSS custom properties). Fonts (Satoshi, Inter, JetBrains Mono) are loaded from CDN in `index.html`.

**Tiered ship weighting** (`constants.js`): Ships are bucketed by PAX capacity (< 300 → 1×, 300–600 → 3×, 600–1200 → 6×, 1200+ → 11×) for operational complexity calculations. This affects equipment counts, crew estimates, and pallet projections in Market Intel.

**Turnaround vs. non-turnaround ops date logic**: Turnarounds ≥ 2 nights schedule operations on the middle day; single-day turnarounds and non-turnarounds schedule ops on arrival day. This governs the crunch calendar display.

## External Services

- **Supabase** (`hszrtbjewapkgetfxnrk`): tables — `port_calls`, `tasks`, `task_notes`, `task_drafts`, `contracts`, `ships`, `cruise_lines`, `staff`, `expenses`
- **Payday.is**: live invoice/expense data for CFO Workspace; read-mostly via OAuth client credentials
- **Vercel**: hosting + edge rewrites (SPA routing + Payday proxy)

## Environment Variables

```
VITE_TEAM_PIN          # Default: ips2026
VITE_CEO_PIN           # Default: ceo2026
VITE_PAYDAY_CLIENT_ID
VITE_PAYDAY_CLIENT_SECRET
```

## Deployment

Push to `main` → Vercel auto-deploys. The `vercel.json` rewrites handle both SPA routing and the Payday API proxy, so no serverless functions are needed.
