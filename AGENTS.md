# marketplace-frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS 3 multi-vendor marketplace
frontend with an agent-driven generative UI layer.


## Development Server

```bash
npm install
npm run dev        # next dev -p 8443
```

Port 8443 matches the backend's `BACKEND_CORS_ORIGINS` whitelist.

## Project Structure

- `src/app/` - Next.js App Router (layout, page, globals.css design tokens)
- `src/App.tsx` - Application shell: landing → sign-in → agent canvas / classic view
- `src/components/` - Registry components (catalog, cart, orders, merchant,
  fulfillment, system, auth, landing)
- `src/lib/api/client.ts` - Typed backend API client (Bearer auth, refresh
  rotation, Idempotency-Key injection, 429 backoff)
- `src/lib/agent-gateway.ts` - Agent Gateway SSE client (POST /sse)
- `src/types/components.ts` - Directive envelope + component allowlist types
- `src/env.ts` - Zod-validated `NEXT_PUBLIC_*` environment config (fails loudly)
- `package.json` - Scripts: `dev`, `build`, `start`, `typecheck`
- `.env.local` - Local env (see `_recovered/.env` as reference)

## Backend Contract

- Backend: FastAPI at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8000`),
  API prefix `/api/v1`. Login is OAuth2 form-encoded (`username`/`password`).
- Agent Gateway: `NEXT_PUBLIC_AGENT_GATEWAY_URL` (default `http://localhost:8001`),
  single streaming endpoint `POST /sse` with
  `{ message, session_id?, confirmed_token? }`, events:
  `session` | `text` | `ui_directive` | `error`.

## Styling

Tailwind CSS 3 with design tokens defined as CSS variables in
`src/app/globals.css`. Components reference tokens only
(`bg-[var(--color-primary)]`, etc.) — restyle globally in one file.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`),
  or escape them in single-quoted strings.
- Ensure JSX tags are closed and braces are balanced.
- Export registry components as named exports; pages as default exports.
- No `any` on the directive-rendering path; validate `UiDirective` props before
  rendering and degrade to `ErrorMessage`, never crash.
- No hardcoded URLs/keys/flags — everything goes through `src/env.ts`.
- Use the classic view first — every core flow (browse, product page, cart, checkout,
  order tracking, vendor dashboard) must work without the agent. Agent mode is an
  enhancement layered on top, not a replacement.

## Build Status

**Build: 2026-09-23 · .env.local** — production build passing (Next 14.2.35,
TypeScript type-check clean, no type errors).

