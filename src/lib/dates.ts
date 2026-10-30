/* Dates as the app saves them: local calendar days, 'YYYY-MM-DD'. */

/** Now, as a full timestamp (what updatedAt / addedAt fields hold). */
export const nowISO = (): string => new Date().toISOString();

/** A 'YYYY-MM-DD' day as a local Date at midnight. */
export const fromISODate = (iso: string): Date => new Date(iso + 'T00:00:00');

/** First stardate year: stardates count 1000 per year from here, so that
    2026 falls in the 80000s. Made up, for fun — not canon. */
const STARDATE_YEAR_ZERO = 1946;
const STARDATE_UNITS_PER_YEAR = 1000;

/** "80829.6" for 30 Oct 2026: the year's thousand plus how far into the
    year the moment is. */
export function stardate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const yearStart = new Date(year, 0, 1).getTime();
  const nextYearStart = new Date(year + 1, 0, 1).getTime();
  const fraction = (date.getTime() - yearStart) / (nextYearStart - yearStart);
  return ((year - STARDATE_YEAR_ZERO + fraction) * STARDATE_UNITS_PER_YEAR).toFixed(1);
}

/** "Oct 12" (in the browser's language). */
export function formatDateShort(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
