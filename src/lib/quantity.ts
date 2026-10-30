import type { IngredientUnit } from './types';

/* Showing scaled amounts the way a cook reads them: "250g", "1 ½", "⅓". */

/** Unicode fractions the display snaps to. */
const FRACTIONS: Array<[number, string]> = [
  [0.166, '⅙'],
  [0.2, '⅕'],
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.5, '½'],
  [0.583, '⅗'],
  [0.667, '⅔'],
  [0.75, '¾'],
  [0.8, '⅘'],
  [0.833, '⅚'],
];
const FRACTION_TOLERANCE = 0.03;
const SMALLEST_AMOUNT = 0.05;

/** Round to what makes sense at that size: to 5 above 20, whole numbers
    above 5, halves above 1, twentieths below. */
export function smartRound(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 20) {
    return Math.round(value / 5) * 5;
  }
  if (value >= 5) {
    return Math.round(value);
  }
  if (value >= 1) {
    return Math.round(value * 2) / 2;
  }
  return Math.max(SMALLEST_AMOUNT, Math.round(value * 20) / 20);
}

export function formatQuantity(value: number): string {
  const rounded = smartRound(value);
  const whole = Math.floor(rounded);
  const fraction = Math.round((rounded - whole) * 1000) / 1000;
  if (fraction === 0) {
    return String(whole);
  }
  for (const [amount, glyph] of FRACTIONS) {
    if (Math.abs(fraction - amount) < FRACTION_TOLERANCE) {
      return (whole > 0 ? whole + ' ' : '') + glyph;
    }
  }
  return String(Math.round(rounded * 100) / 100);
}

/** "g" and "ml" are written after the number; pieces are just a count. */
export function unitSuffix(unit: IngredientUnit): string {
  return unit === 'g' || unit === 'ml' ? unit : '';
}
