# Pike

Batch cooking on a budget: a library of recipes with
macros and cost tiers, a pantry checklist, a shopping list, and two buttons
on Home that pick a recipe at random — one your pantry already covers, or
any at all.

It began as a single-file claude.ai artifact and
was ported to TypeScript and Svelte. It lives in the `apps` workspace with the other phone apps, which
installs the tools for all of them at once (see `apps/README.md`).

## Running it

You need Node.js. Install once in the `apps` folder (`npm install`
there), then in this folder:

```
npm run dev        a local server with instant reload
```

`npm run dev` prints two addresses. `localhost` works on this computer. The
`Network` one works on your phone too, if it is on the same Wi-Fi.

A fresh install starts with the 42 recipes and 96 ingredients from the
original. Your own pantry, shopping list, cook log and recipe
edits live in the browser you use the app in (until Firebase is set up). To
move them, use **Log → Your data → Save backup**, then **Restore backup…**
on the other device. The file exported from the original artifact
restores the same way.

## Checking it

```
npm run check      TypeScript and Svelte type checking
npm run lint       code problems (ESLint); lint:fix repairs what it can
npm run format     tidy the layout of every file (Prettier)
npm test           builds the app and drives it in a headless phone-sized
                   browser (first time: npx playwright install chromium)
npm run icons      re-draw the PNG icons after changing public/icon.svg
```

## Building and deploying

`npm run build` writes `dist/` — plain files, the whole app. Uploading that
folder anywhere that serves https makes it installable on Android: open the
address in Chrome, then *Add to Home screen*. With Firebase Hosting, once the
project exists:

```
npx firebase login
npx firebase init hosting      public directory: dist, single-page app: yes
npm run build && npx firebase deploy
```

## What's where

```
src/
  main.ts              starts the app
  App.svelte           the tab bar, one tab at a time, and the recipe sheet
  app.css              the one stylesheet (colours as tokens, light and dark)
  screens/             one file per tab: Home, Recipes, Pantry (shown as
                       Stores), Shopping, Stats (shown as Log)
  components/          the recipe sheet, the edit and add-ingredient forms,
                       the backup card
  data/starter.json    the recipes and ingredients a fresh install starts with
  lib/
    types.ts           what is saved, collection by collection
    kitchen.ts         macros, pantry rules, random picks
    quantity.ts        scaled amounts as a cook reads them (½, ⅓, 250g)
    dates.ts           local calendar days
    state.svelte.ts    everything on screen, kept live from the database,
                       and every action that changes it
    db/                the database: local (today), Firebase (stub), backups
public/                icons for the home screen
tests/                 end-to-end tests
```
