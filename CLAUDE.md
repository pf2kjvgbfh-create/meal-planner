# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Offline-first PWA meal planner ("Планировщик меню") for weekly menu creation, recipe management, and shopping list generation. All UI is in Russian. Targets iPhone (Safari PWA) and Windows desktop browsers.

**Live:** https://pf2kjvgbfh-create.github.io/meal-planner/
**Repo:** https://github.com/pf2kjvgbfh-create/meal-planner

## Commands

```bash
npm run dev              # Start dev server (localhost:5173)
npm run dev -- --host    # Expose on LAN (for iPhone testing)
npm run build            # TypeScript check + production build
npx tsc --noEmit         # Type-check only
npx gh-pages -d dist     # Deploy to GitHub Pages after build
```

## Architecture

**Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Dexie (IndexedDB) + date-fns + HashRouter

**No backend.** All data lives in browser IndexedDB via Dexie. PWA service worker (vite-plugin-pwa) caches assets for offline use.

### Data flow

- `src/types/recipe.ts` — all domain types. All dates are ms timestamps. Weeks start Monday. 4 meal slots: breakfast, lunch, dinner, snack. `SLOT_CATEGORIES` maps each slot to allowed recipe categories.
- `src/db/database.ts` — Dexie schema (3 tables) + CRUD + `exportAllData()`/`importAllData()` for JSON backup + `getAllIngredientNames()` for autocomplete.
- `src/algorithm/suggest.ts` — scoring: 40% days-since-cooked + 30% rating + 20% variety-bonus + 10% random. Accepts `categories[]` array and `excludeIds` set.
- Pages use `useEffect` + `useState` for data (NOT `useLiveQuery` — causes infinite loops).

### Key conventions

- `SLOT_CATEGORIES` in types/recipe.ts controls which recipe categories appear per meal slot
- Tailwind-only, mobile-first (640px max), soft green/stone palette
- `font-size: 16px !important` on inputs to prevent iOS zoom
- `HashRouter` for GitHub Pages (no server-side routing)
- `base: '/meal-planner/'` in vite.config.ts for GH Pages subpath
- Ingredient autocomplete: `RecipeForm` loads all known ingredient names and shows dropdown hints on 2+ chars
