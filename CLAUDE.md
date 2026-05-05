# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Offline-first PWA meal planner ("Планировщик меню") for weekly menu creation, recipe management, and shopping list generation. All UI is in Russian. Targets iPhone (Safari PWA) and Windows desktop browsers.

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run dev -- --host # Expose on LAN (for iPhone testing)
npm run build        # TypeScript check + production build
npx tsc --noEmit     # Type-check only
```

## Architecture

**Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Dexie (IndexedDB) + date-fns

**No backend.** All data lives in browser IndexedDB via Dexie. PWA service worker (vite-plugin-pwa) caches assets for offline use.

### Data flow

- `src/types/recipe.ts` — all domain types (Recipe, WeeklyMenu, CookHistory, Ingredient). All dates are millisecond timestamps, not Date objects. Weeks start on Monday.
- `src/db/database.ts` — Dexie schema (3 tables: recipes, weeklyMenus, cookHistory) and CRUD functions.
- `src/algorithm/suggest.ts` — scoring algorithm: 40% days-since-last-cooked + 30% rating + 20% variety-bonus + 10% random.
- Pages use `useEffect` + `useState` for data loading (NOT `useLiveQuery` — it causes infinite loops with DB writes in StrictMode).

### Key conventions

- Category labels and meal slot labels are Russian constants in `src/types/recipe.ts`
- `MEAL_TO_CATEGORY` mapping in MenuPage controls which recipe categories are suggested per meal slot
- Tailwind-only styling, mobile-first (640px max container), light green palette
- `safe-bottom` CSS class for iPhone notch area
- Shopping list aggregates ingredients case-insensitively, keyed by `name::unit`
