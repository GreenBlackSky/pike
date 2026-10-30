import { expect, test } from '@playwright/test';
import { expectNoErrors, openFresh, saved, STORAGE_KEY, tap } from './helpers';

/* Every tab draws on a fresh install (which starts with the 42 starter
   recipes), and the main things you do work end to end. */

const TABS = ['home', 'recipes', 'pantry', 'shopping', 'stats'];

test('every tab draws, with the starter recipes', async ({ page }) => {
  const errors = await openFresh(page);
  for (const tab of TABS) {
    await tap(page, `[data-tab="${tab}"]`);
    await expect(page.locator(`#screen-${tab}`)).toBeVisible();
  }
  await tap(page, '[data-tab="recipes"]');
  await expect(page.locator('.recipe-card')).toHaveCount(42);
  await expectNoErrors(errors);
});

test('Hit it picks a recipe, and a new one when asked again', async ({ page }) => {
  const errors = await openFresh(page);
  await expect(page.locator('#randomResult')).toHaveCount(0);
  await tap(page, '[data-action="pick-any"]');
  const result = page.locator('#randomResult h2');
  const first = await result.textContent();
  expect(first).toBeTruthy();
  await tap(page, '[data-action="pick-again"]');
  await expect(result).not.toHaveText(first ?? '');
  await tap(page, '[data-action="open-pick"]');
  await expect(page.locator('.modal-sheet h2')).toHaveText((await result.textContent()) ?? '');
  await expectNoErrors(errors);
});

test('Cook with what I have follows the pantry', async ({ page }) => {
  const errors = await openFresh(page);
  /* fresh install: the pantry is empty, so the pick comes with a warning */
  await tap(page, '[data-action="pick-cookable"]');
  await expect(page.locator('.pick-warning')).toBeVisible();

  /* stock everything banana bread needs, and it can be cooked as it is */
  await page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    const lines = stored.collections.recipes.banana_bread.ingredients as Array<{
      ingredientId: string;
    }>;
    stored.collections.pantry = Object.fromEntries(
      lines.map((line) => [line.ingredientId, { status: 'plenty', updatedAt: '' }]),
    );
    localStorage.setItem(key, JSON.stringify(stored));
  }, STORAGE_KEY);
  await page.reload();
  await tap(page, '[data-action="pick-cookable"]');
  await expect(page.locator('#randomResult .slot')).toHaveText('From ship’s stores');
  await expect(page.locator('.pick-warning')).toHaveCount(0);
  await expectNoErrors(errors);
});

test('add a recipe’s missing items and tick one off', async ({ page }) => {
  const errors = await openFresh(page);
  await tap(page, '[data-tab="recipes"]');
  await page.locator('#recipeSearch').fill('banana bread');
  await tap(page, '.recipe-card');
  await tap(page, '[data-action="add-missing"]');
  await expect(page.locator('.toast')).toContainText('added to shopping list');
  await page.locator('.modal-close').click();

  await tap(page, '[data-tab="shopping"]');
  const count = await page.locator('.shop-item').count();
  expect(count).toBeGreaterThan(0);
  await tap(page, '.shop-check');
  await expect(page.locator('.shop-item')).toHaveCount(count - 1);
  const pantry = (await saved(page)).pantry as Record<string, { status: string }>;
  expect(Object.values(pantry).some((doc) => doc.status === 'plenty')).toBe(true);
  await expectNoErrors(errors);
});

test('a recipe scales and logs a cook', async ({ page }) => {
  const errors = await openFresh(page);
  await tap(page, '[data-tab="recipes"]');
  await page.locator('#recipeSearch').fill('banana bread');
  await tap(page, '.recipe-card');
  await expect(page.locator('.pc-count')).toHaveText('10 portions');
  await tap(page, '[data-step="1"]');
  await expect(page.locator('.pc-count')).toHaveText('11 portions');

  await tap(page, '[data-action="mark-cooked"]');
  await expect(page.locator('.toast')).toHaveText('Entered in the captain’s log.');
  expect(
    ((await saved(page)).stats as Record<string, { cookCount: number }>).banana_bread.cookCount,
  ).toBe(1);
  await expectNoErrors(errors);
});

test('the pantry cycles none → low → plenty', async ({ page }) => {
  const errors = await openFresh(page);
  await tap(page, '[data-tab="pantry"]');
  const first = page.locator('.pantry-status-btn').first();
  await expect(first).toHaveText('none');
  await tap(page, '.pantry-status-btn');
  await expect(first).toHaveText('low');
  await tap(page, '.pantry-status-btn');
  await expect(first).toHaveText('plenty');
  await expectNoErrors(errors);
});

test('edit a recipe and add an ingredient', async ({ page }) => {
  const errors = await openFresh(page);
  await tap(page, '[data-tab="recipes"]');
  await page.locator('#recipeSearch').fill('banana bread');
  await tap(page, '.recipe-card');
  await tap(page, '[data-action="edit-recipe"]');
  await page.locator('#editName').fill('Banana Loaf');
  await tap(page, '[data-action="edit-add-ingredient"]');
  await tap(page, '[data-action="save-recipe-edit"]');
  const recipes = (await saved(page)).recipes as Record<
    string,
    { name: string; ingredients: unknown[] }
  >;
  expect(recipes.banana_bread.name).toBe('Banana Loaf');
  expect(recipes.banana_bread.ingredients).toHaveLength(8);

  await tap(page, '[data-tab="pantry"]');
  await tap(page, '[data-action="add-ingredient"]');
  await page.locator('#newIngName').fill('Pear');
  await page.locator('#newIngUnit').selectOption('piece');
  await page.locator('#newIng_kcalPer100').fill('100');
  await tap(page, '[data-action="save-new-ingredient"]');
  const ingredients = (await saved(page)).ingredients as Record<string, { kcalPer100: number }>;
  expect(ingredients.pear.kcalPer100).toBe(10000);
  await expectNoErrors(errors);
});

test('a backup saves and restores', async ({ page }) => {
  const errors = await openFresh(page);
  await tap(page, '[data-tab="pantry"]');
  await tap(page, '.pantry-status-btn');
  await tap(page, '[data-tab="stats"]');
  const download = page.waitForEvent('download');
  await tap(page, '[data-export]');
  const file = await (await download).path();

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await tap(page, '[data-tab="stats"]');
  await page.locator('input[type=file]').setInputFiles(file);
  await tap(page, '[data-replace]');
  const pantry = (await saved(page)).pantry as Record<string, { status: string }>;
  expect(Object.values(pantry).map((doc) => doc.status)).toEqual(['low']);
  await expectNoErrors(errors);
});
