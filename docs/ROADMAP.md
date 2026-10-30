# Pike — roadmap

## Firebase

Not built yet.

1. **Hosting**: this app's `dist/` on its own Firebase Hosting site.
2. **Sign-in and sync**: Google sign-in (optional); data in Firestore under
   `users/{uid}/apps/pike/`, same documents as today, so the
   shopping list on the phone is the one edited on the computer. Implement
   `FirebaseDatabase` in `src/lib/db/firebase.ts`.
3. **Moving in**: on first sign-in, upload what is in this browser.
4. Later, maybe: the starter recipes as a shared, read-only collection
   instead of a copy per user.

## Backlog (asked for, to build later)

Not to be implemented until asked.

1. **Timers**: start a countdown from a recipe step ("bake 15–18 min"),
   from the recipe sheet; several can run at once, and they keep running
   while you look at another tab.
2. **Notifications**: when a timer ends, a phone notification (with sound
   or vibration), even with the app in the background or the screen off.
   Needs the browser's notification permission, asked the first time a
   timer starts.
3. **Continue cooking**: from the log (Stats tab), reopen a recipe you are
   in the middle of, at the step you were on, with its portions and any
   timers still running.

## Changed during the port

- In the original, every tab was drawn inside the "Loading…" box, which
  centred all text, made it smaller and greyed it out. The port draws the
  screens as the stylesheet intended: left-aligned, full-size, full colour.
- A fresh install starts with the starter recipes and ingredients (the
  original got them from claude.ai's database).
- Adding a recipe's missing items to the shopping list no longer adds the
  same ingredient twice when a recipe lists it twice.
- The on-page debug log, heartbeat and 20-second watchdog (claude.ai
  connection troubleshooting) are gone.

## Changed since the port

- The week plan (four batch dishes over the week, today's meals and the
  calorie bar) is gone. Home now has two buttons: "Cook with what I have",
  a random recipe the pantry covers (or the closest, when none is fully in
  stock), and "Hit it", a random recipe from the whole library.
- New look, after the Star Trek: Strange New Worlds bridge (navy, cyan,
  gold, Oxanium), a new icon, and light Trek wording: "Hit it", Stores for
  the pantry tab, Log for stats, a stardate under the title.

## Ideas, not decided

- Linking to Macro Lens: "I made this" could log a portion there (Macro
  Lens already holds these recipes as saved meals).
- Prices per ingredient instead of per-recipe cost tiers.
- Unit tests for `kitchen.ts` and `quantity.ts` (pure functions).
