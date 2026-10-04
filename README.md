# Marketplace Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS. Agent-driven generative UI
with a first-class non-agent ("Classic") fallback — see
`_recovered/frontend_system_design.md` and
`_recovered/frontend_development_plan.md` for the authoritative design docs.

## Quick start

```bash
npm install
cp _recovered/.env .env.local   # or edit .env.local directly
npm run dev                     # http://localhost:8443 (matches backend CORS)
npm run typecheck               # tsc --noEmit
npm run build                   # production build
```

**Build: 2026-09-23 · .env.local** — production build passing (Next 14.2.35,
TypeScript type-check clean, no type errors).

Requires: backend (FastAPI) on `:8000`, Agent Gateway on `:8001`.

## Architecture

```
src/
├── app/            Next.js App Router (layout.tsx, page.tsx, globals.css tokens)
├── App.tsx         Shell: Landing → Sign-in → [Agent canvas | Classic view]
├── components/     Registry components the agent may render:
│   ├── catalog/    ProductGrid, ProductCard, ProductDetail
│   ├── cart/       CartSummary
│   ├── orders/     OrderList, OrderConfirmation
│   ├── merchant/   MerchantBalanceCard, LedgerTable
│   ├── fulfillment/FulfillmentTracker
│   ├── system/     ConfirmationDialog, SignInPrompt, ErrorMessage
│   ├── auth/       LoginForm
│   └── landing/    LandingPage
├── lib/
│   ├── api/client.ts      Typed REST client — Bearer auth, 401→refresh→retry,
│   │                      Idempotency-Key on financial mutations, 429 backoff
│   └── agent-gateway.ts   Agent Gateway SSE client (POST /sse per turn)
├── types/components.ts    UiDirective envelope + ComponentName allowlist
└── env.ts                 Zod-validated NEXT_PUBLIC_* config (fails loudly)
```

## Open decisions (dev plan §12) — resolved defaults

1. **SSE vs WebSocket** → SSE. The Gateway's only streaming endpoint is
   `POST /sse` (one turn per POST, `session_id` resumes conversations). Native
   `EventSource` cannot POST, so `agent-gateway.ts` parses the stream manually.
2. **Token propagation** → access token in memory, refresh token in
   `sessionStorage`. The backend currently returns tokens in the login body
   (it does not yet set an httpOnly cookie); when it does, only
   `lib/api/client.ts` changes.
3. **Component library ownership** → lives in this repo under `src/components/`,
   mirrored from `Agent/schemas/` (Pydantic) — extract to a shared package only
   when a second consumer appears.
4. **Canvas persistence** → none in v1; the Gateway session is the source of
   truth and the session id survives reloads via `sessionStorage`.
5. **Breakpoints** → Tailwind defaults (sm/md/lg), matching the prototype.
6. **Accessibility** → semantic HTML, labeled inputs, keyboard-operable
   controls; full audit deferred.
7. **Error boundaries** → Next.js global error boundary plus per-directive
   fallback: an invalid/unknown directive renders `ErrorMessage`, never a crash.
8. **Analytics** → none in v1.

## Deviations from the original prototype (documented)

- The original `index.css` design tokens were unrecoverable; `globals.css`
  reconstructs them (indigo primary / violet agent accent / slate neutrals).
  Adjust tokens there — components never hardcode colors.
- `ClassicCatalog`/`ClassicOrders` map backend DTOs (`title`, minor-unit
  prices, `merchant_id`) onto the UI view models in `App.tsx` mappers.
- Registry components `CategoryList`, `VariantSelector`, `PaymentCapturePanel`,
  `OrderDetail`, `MerchantProfile` are allowlisted but not yet implemented
  (they render the generic fallback) — the backend endpoints they need are
  wired in `lib/api/client.ts`.

## Prototype & recovery artifacts

- `design-prototype/` — original Figma Make Vite export (not built).
- `_recovered/` — originals recovered from editor history (App.tsx, LoginForm,
  env.ts, .env, design docs). Safe to archive once the app is verified.
