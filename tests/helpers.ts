import { expect, type Page } from '@playwright/test';

export const STORAGE_KEY = 'pike.db.v1';

/** Open the app fresh — it seeds itself with the starter recipes — and
    collect any error it throws. */
export async function openFresh(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.tabbar');
  return errors;
}

/** A real tap (touch events), then a moment for the screen to update. */
export async function tap(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await element.tap();
  await page.waitForTimeout(100);
}

/** Everything saved, as the app sees it. */
export async function saved(page: Page): Promise<Record<string, Record<string, unknown>>> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}').collections ?? {},
    STORAGE_KEY,
  );
}

export async function expectNoErrors(errors: string[]): Promise<void> {
  expect(errors).toEqual([]);
}
