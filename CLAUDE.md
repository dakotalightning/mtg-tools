# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn dev` — run the dev server (http://localhost:3000)
- `yarn build` — production build
- `yarn start` — serve the production build
- `yarn lint` — Next.js/ESLint (`next/core-web-vitals`)

Package manager is **yarn** (`yarn@1.22.19`). There is no test runner configured.

## Architecture

Next.js 13 **Pages Router** app (`src/pages/`), TypeScript. It is a single-purpose "Card Cloud — Workshop" collection tool with a fixed dark sidebar and five routes:

- `/` — **Card Finder** (`pages/index.tsx`): live card search against Scryfall, card preview + printings comparison table, filters, select-a-printing.
- `/labels` — **Label Studio** (`pages/labels.tsx`): divider editor with live preview and client-side SVG export.
- `/tokens` — **Token Library** (`pages/tokens.tsx`): three low-ink token templates, add to shared print queue.
- `/counters` — **Counter Kit** (`pages/counters.tsx`): four-player life counters (local state).
- `/design` — **Design System** (`pages/design.tsx`): swatches, typography, styling guidance.

### Shared shell and state

- `_app.tsx` wraps every page in `WorkshopProvider` (`lib/workshop.tsx`) then `WorkshopLayout` (`components/layouts/WorkshopLayout.tsx`). Because navigation uses client-side `next/link`, provider state persists across route changes.
- **`useWorkshop()`** is the single global store: `queue` (print queue, shared across Token Library + Label Studio + the topbar badge/dialog), `saved`/`toggleSaved`/`isSaved` (the session "collection" the Card Finder's "In my collection" filter reads), and `toast()`/`toastMessage` (transient bottom-center notice).
- `WorkshopLayout` owns the sidebar nav (active state derived from `router.pathname`), the topbar breadcrumb, the print-queue `<dialog>`, the toast, and the `/` keyboard shortcut to focus search. Cross-page actions pass data via the router query — e.g. Card Finder's "Make label" does `router.push('/labels?text=…&code=…')` and Label Studio reads it once `router.isReady`.

### Card Finder data flow (Scryfall)

Client-side only. On submit (and preloaded with "Sol Ring" on mount) it calls `cards/named?fuzzy=` for the canonical card, then follows that card's `prints_search_uri` for all printings; digital and `art_series` layouts are filtered out. There is no API-route proxy and no collection backend — "saved" printings live only in `useWorkshop` for the session.

### Icons and visual direction

- All icons are original line marks defined once in `components/Icon.tsx` (`IconSprite` is rendered by the layout; `<Icon name>` uses `<use href="#name">`). **No official MTG set symbols** — set symbols are intentionally rendered as a generic diamond (◇). Keep it that way.
- The entire look lives in `src/styles/globals.css`: a `:root` palette (parchment canvas, midnight sidebar, brass accent, per-color families), Georgia serif headings, system-sans UI text, monospace identifiers, fine borders, paper surfaces. **Tailwind's `@tailwind` directives were intentionally removed** — the design is hand-written CSS classes (`.card-preview`, `.divider`, `.token`, `.player`, `.swatch`, etc.) and Tailwind's preflight reset conflicted with them. Prefer these existing classes (or inline styles referencing the CSS vars) over reintroducing Tailwind utilities.

## Conventions

- Path aliases (tsconfig): `@/*` → `src/*`, plus `@hooks/*`, `@data/*`, `@config/*`, and `@components` → `src/components` (barrel in `components/index.ts`).
- `src/data/`, `src/fonts/`, `src/imgs/`, and `src/types/` are leftovers from the previous version and are currently unused by the five pages.
