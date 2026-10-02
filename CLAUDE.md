# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn dev` — run the dev server (http://localhost:3000)
- `yarn build` — production build
- `yarn start` — serve the production build
- `yarn lint` — Next.js/ESLint (`next/core-web-vitals`)
- `yarn test` — Vitest unit tests (`vitest run`); `yarn test:watch` for watch mode. Specs live beside the code as `*.test.ts(x)` (currently under `src/lib/shopping/`). Test files + `vitest.*.ts` are excluded from `tsconfig` so `next build` ignores them.

Package manager is **yarn** (`yarn@1.22.19`). Tests run on **Vitest + jsdom** (`@testing-library/react`).

## Architecture

Next.js 13 **Pages Router** app (`src/pages/`), TypeScript. It is a single-purpose "Card Cloud — Workshop" collection tool with a fixed dark sidebar and these routes:

- `/` — **Card Finder** (`pages/index.tsx`): live card search against Scryfall, card preview + printings comparison table, filters, select-a-printing.
- `/shopping` — **Shopping lists** (`pages/shopping.tsx`): create lists, add/bulk-import cards, pick printings, check off while shopping. Data is **browser-only** (see below).
- `/labels` — **Label Studio** (`pages/labels.tsx`): divider editor with live preview and client-side SVG export.
- `/tokens` — **Token Library** (`pages/tokens.tsx`): three low-ink token templates, add to shared print queue.
- `/counters` — **Counter Kit** (`pages/counters.tsx`): four-player life counters (local state).
- `/design` — **Design System** (`pages/design.tsx`): swatches, typography, styling guidance.

### Shared shell and state

- `_app.tsx` wraps every page in `WorkshopProvider` (`lib/workshop.tsx`) then `WorkshopLayout` (`components/layouts/WorkshopLayout.tsx`). Because navigation uses client-side `next/link`, provider state persists across route changes.
- **`useWorkshop()`** is the single global store: `queue` (print queue, shared across Token Library + Label Studio + the topbar badge/dialog), `saved`/`toggleSaved`/`isSaved` (the session "collection" the Card Finder's "In my collection" filter reads), and `toast()`/`toastMessage` (transient bottom-center notice).
- `WorkshopLayout` owns the sidebar nav (active state derived from `router.pathname`), the topbar breadcrumb, the print-queue `<dialog>`, the toast, and the `/` keyboard shortcut to focus search. Cross-page actions pass data via the router query — e.g. Card Finder's "Make label" does `router.push('/labels?text=…&code=…')` and Label Studio reads it once `router.isReady`.

### Shopping lists (browser-only persistence)

All code lives in `src/lib/shopping/` (logic) + `src/components/shopping/` (UI). It is deliberately **decoupled from any backend** — no Prisma/GraphQL/endpoints.

- **Persistence is isolated behind one adapter.** `persistence.ts` is the *only* module that touches `localStorage` (SSR-safe, with an in-memory fallback). `store.ts` (`ShoppingStore`, singleton `shoppingStore`) is the single writer: it holds the cache, notifies subscribers synchronously, and persists important changes immediately / rapid ones debounced. Swap the adapter to move to cloud sync later — the UI never calls `localStorage`.
- **Versioned + validated.** Data is a `{ version: 1, lists, updatedAt }` envelope under key **`card-cloud:shopping-lists`**. `schema.ts` type-guards unknown JSON; `migrations.ts#migrateShoppingListStorage` salvages valid lists/items and throws only on unrecoverable/unknown-version data, at which point the store writes a timestamped `…:recovery:<iso>` backup and reinitializes.
- **Model stores references, not card data** (`types.ts`): items keep `cardId`/`oracleCardId`/`cardName` + a tiny `snapshot` (image/type), never full card payloads. Live details are re-fetched from Scryfall via `cards.ts` (`resolveCardByName`, batched `enrichCards` through POST `/cards/collection`, memoized `fetchPrintings`) and surfaced through the `useCardEnrichment` hook.
- **State:** `ShoppingListProvider` (`useShoppingLists`) hydrates after mount (so SSR renders a loading state — no hydration mismatch), tracks the current list + filter/sort/search, and exposes all mutations bound to the store. Pure immutable ops are in `operations.ts`; derived views (`filterItems`/`sortItems`/`groupBySet`/`listProgress`) in `selectors.ts`; deck-list parsing in `parse.ts`.
- Cross-tab edits are picked up via the `storage` event; `prefs.ts` remembers the last-selected list separately.

### Card Finder data flow (Scryfall)

Client-side only. On submit (and preloaded with "Sol Ring" on mount) it calls `cards/named?fuzzy=` for the canonical card, then follows that card's `prints_search_uri` for all printings; digital and `art_series` layouts are filtered out. There is no API-route proxy and no collection backend — "saved" printings live only in `useWorkshop` for the session.

### Icons and visual direction

- All icons are original line marks defined once in `components/Icon.tsx` (`IconSprite` is rendered by the layout; `<Icon name>` uses `<use href="#name">`, and takes an optional `className` to resize/restyle). **No official MTG set symbols** — set symbols are intentionally rendered as a generic diamond (◇). Keep it that way.
- **Styling is Tailwind utilities written inline in the JSX**, not a component stylesheet. The workshop palette (`ink`, `muted`, `canvas`, `paper`, `line`, `night`, `brass`, `gold`, `azure`, `forest`, `rust`) and a Georgia-first `font-serif` are defined in `tailwind.config.js`; one-off colors use arbitrary values (`bg-[#1b2427]`). Responsive parity with the original mockup uses `max-[1100px]:` / `max-[760px]:` / `min-[1600px]:` variants (Tailwind 3.2 `max-*`/arbitrary variants).
- `src/lib/ui.ts` holds shared Tailwind class strings for the repeated primitives — `BTN`, `BTN_PRIMARY`, `EYEBROW`, `SUB`, `CODE`, `H1`/`H2`/`H3`, `PANEL`, `PAGE_HEAD`, `NOTE_BOX` — plus a `cx()` joiner. Reuse these (compose with `cx(..., 'extra classes')`, and `!`-prefix to override a shared value) rather than re-typing long utility runs.
- `src/styles/globals.css` is deliberately tiny: `@tailwind` directives, a small `@layer base` (html/body sizing + body font/bg), the native `dialog::backdrop` (no inline-utility equivalent), reduced-motion, and print `body` background. Use the Tailwind `print:hidden` variant for hiding chrome when printing.

## Conventions

- Path aliases (tsconfig): `@/*` → `src/*`, plus `@hooks/*`, `@data/*`, `@config/*`, and `@components` → `src/components` (barrel in `components/index.ts`).
- `src/data/`, `src/fonts/`, `src/imgs/`, and `src/types/` are leftovers from the previous version and are currently unused by the five pages.
