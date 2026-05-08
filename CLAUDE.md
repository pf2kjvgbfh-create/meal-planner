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
npm test                 # Run vitest unit tests
npx tsc --noEmit         # Type-check only
npx gh-pages -d dist     # Deploy to GitHub Pages after build
```

## Architecture

**Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + Dexie (IndexedDB) + date-fns + HashRouter + Vitest

**No backend.** All data lives in browser IndexedDB via Dexie. PWA service worker (vite-plugin-pwa) caches assets for offline use.

### Data flow

- `src/types/recipe.ts` — all domain types. All dates are ms timestamps. Weeks start **Sunday** (`weekStartsOn: 0`). 4 meal slots: breakfast, lunch, dinner, snack. `SLOT_CATEGORIES` maps each slot to allowed recipe categories. Each slot holds `number[]` (multiple dishes allowed). `CustomShoppingItem` for free-form shopping entries.
- `src/db/database.ts` — Dexie schema v2 (4 tables: recipes, weeklyMenus, cookHistory, customShoppingItems) + CRUD + `exportAllData()`/`importAllData()` for JSON backup + `getAllIngredientNames()` for autocomplete.
- `src/utils/menuUtils.ts` — `normalizeDayMenu()` migrates legacy `number` slot values → `number[]` on load. `getSlotIds()` collects all recipe IDs across all days/slots.
- `src/algorithm/suggest.ts` — scoring: 40% days-since-cooked + 30% rating + 20% variety-bonus + 10% random. Accepts `priorityIds` set (yesterday's same-slot dish appears first). Accepts `excludeIds` set.
- Pages use `useEffect` + `useState` for data (NOT `useLiveQuery` — causes infinite loops).

### Key conventions

- `SLOT_CATEGORIES` in types/recipe.ts controls which recipe categories appear per meal slot
- `MEAL_SLOTS` constant in utils/menuUtils.ts — use this to iterate slots, not inline arrays
- Tailwind-only, mobile-first (640px max), soft green/stone palette
- `font-size: 16px !important` on inputs to prevent iOS zoom (use `style={{ fontSize: '16px' }}` on custom inputs)
- `HashRouter` for GitHub Pages (no server-side routing)
- `base: '/meal-planner/'` in vite.config.ts for GH Pages subpath
- Ingredient autocomplete: `RecipeForm` loads all known ingredient names and shows dropdown hints on 2+ chars
- Recipe photos stored as base64 dataURL in `recipe.photo` (optional field)
- DB schema migration: bump version in `database.ts` constructor, add new `.version(N).stores({...})`

## Development principles

### Think before coding
- State assumptions explicitly. Multiple interpretations → present options, don't pick silently.
- Simpler approach exists → say so.

### Simplicity first
- Minimum code that solves the problem. No speculative features.
- No abstractions for single-use code.
- If 200 lines could be 50 — rewrite.

### Surgical changes
- Touch only what the task requires. Don't improve adjacent code.
- Match existing style.
- Clean up only orphans YOUR changes created.

### TDD workflow
- Write failing tests first, then implement.
- Tests live alongside source: `src/algorithm/suggest.test.ts`, `src/utils/menuUtils.test.ts`
- `npm test` must pass before committing.

### Git hygiene
- Feature branch per change group for clean rollback.
- `npm test && npm run build` before merge.
