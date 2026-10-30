# CLAUDE.md — Pike (recipes)

Batch-cooking recipes, pantry, shopping list and a random recipe pick,
priced in Serbian dinars. Tabs: Home, Recipes, Stores (the pantry),
Shopping, Log (stats). Dev server port 5182, test preview port 4182.

Named after Captain Pike of Star Trek, who cooks for his crew. The look is
a Strange New Worlds bridge: navy (#0B1622 dark / #E9EEF3 light), cyan for
information, gold for command; Oxanium for headings, labels and buttons,
Karla for text. The Trek wording is kept light: "Hit it", "Stores", the
captain's log, a stardate (made up, see `dates.ts`). Recipe names and
steps stay plain. Code keeps the plain names (`pantry`, `stats`), and so
does the saved format.

It began as a single-file claude.ai artifact (~1,600 lines) and was ported
to TypeScript and Svelte, matching its screens and behaviour. Since then
the week plan was dropped and the look and wording changed (see
`docs/ROADMAP.md`). The original's on-page debug log and connection
watchdog were for claude.ai's database and were dropped.

## The workspace (read this first)

This repo is developed inside an npm workspace: a parent folder, not in any
repo, whose `package.json` lists this project with a few others and holds
the one shared install. The app stands alone and shares no code with them.

- Some files are deliberately the same in sibling apps of the workspace
  and are kept in step by hand: `eslint.config.js`, `.prettierrc.json`,
  `src/lib/db/` (the database layer, except `index.ts`), `scripts/icons.mjs`.
- Install only from the workspace root: `npm install` there. Never run
  `npm install` inside a project (it would create a stray lock file and a
  local `node_modules` that shadows the shared one).
- Every project pins the same tool versions (exact versions in each
  `package.json`). An upgrade is done in all of them at once, then
  everything is tested: `npm test` from the workspace root.
- Machine-specific and personal notes live in the workspace's own
  CLAUDE.md, outside the repos. Keep this file free of them.

## Environment and tools

- Node 22. Editor settings (`.vscode/`) are git-ignored and machine-specific.
- Svelte 5 with runes; shared reactive state in `.svelte.ts` modules.
  TypeScript 6, Vite 8, svelte-check 4.
  Playwright is pinned to 1.56.1; first run needs
  `npx playwright install chromium`.

## Code style

- **Prettier** (100 columns, single quotes) and **ESLint** (`curly: all`,
  `one-var: never`, `prefer-const`, unused names only with a leading `_`,
  `no-nested-ternary` as a warning — there are none).
- Before finishing a change: `npm run format`, `npm run lint` (0 errors),
  `npm run check` (0 warnings), `npm test`.
- Spelled-out names, named constants, small functions. Pure logic lives in
  plain `.ts` files (`kitchen.ts`, `dates.ts`, `quantity.ts`);
  `state.svelte.ts` only holds state and calls them. (ESLint's
  `svelte/prefer-svelte-reactivity` flags `new Date()`/`new Set()` in
  `.svelte.ts` files — another reason to keep logic out of them.)
- Values saved to the database go through JSON (`db/local.ts`), which also
  copes with Svelte's reactive proxies.

## Data

Saved through `src/lib/db` — a small Firestore-shaped API. Today it is
`LocalDatabase`: one localStorage key, `pike.db.v1`, holding the
backup-file format. A brand-new (empty) database is seeded from
`src/data/starter.json` (ingredients and recipes only).

The saved format must not break (`src/lib/types.ts` documents every field):

- `ingredients/{id}`: macros per 100 g / 100 ml — or, for `unit: 'piece'`,
  per 100 pieces (the form takes per-piece values and multiplies by 100), so
  a recipe line's `qty / 100` works for every unit.
- `recipes/{id}`, `pantry/{ingredientId}` (`none|low|plenty`),
  `shoppingList/{random id}`, `stats/{recipeId}`.
- `weekPlan/current` held the week plan, removed on 2026-10-30. Older
  databases and backups may still contain it; the app ignores it and a
  restore carries it along untouched. Don't reuse the name.
- Screen choices (tab, filters) are not saved, as in the original.

## Project notes

- Target is an Android phone: an installable PWA, later Firebase Hosting.
  Firebase is deliberately not implemented yet — only a stub.

- The starter recipes are vegetarian (eggs and dairy).

## Commands (in this folder; install happens in the workspace root)

```
npm run dev        dev server with live reload
npm run check      svelte-check
npm run lint       ESLint (lint:fix fixes what it can)
npm run format     Prettier
npm test           builds, serves on the preview port, runs Playwright
npm run build      dist/ — the finished PWA
npm run icons      PNG icons from public/icon.svg
```

## Google backend: Firebase (planned, not started)

Not to be implemented until asked. `src/lib/db/firebase.ts` is
the stub. The design: one Firebase project shared with the sibling apps; one
Hosting site per app; optional Google sign-in; data in Firestore under
`users/{uid}/apps/pike/…` with the same collection and document
names as today; offline persistence on; rules so a user reads and writes
only their own subtree; on first sign-in, offer to upload what is in the
browser.

See `docs/ROADMAP.md` for what is planned.
