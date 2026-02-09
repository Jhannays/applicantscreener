/**
 * Deterministic month-counting utilities for experience calculation.
 *
 * "Oct 2023 – Dec 2023" = 3 months (Oct, Nov, Dec)
 * "Present" counts up to the current month.
 */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const MONTH_ABBREV: Record<string, number> = {};
MONTHS.forEach((m, i) => {
  MONTH_ABBREV[m] = i;
  MONTH_ABBREV[m.slice(0, 3)] = i;
});

export interface MonthYear {
  month: number; // 0-11
  year: number;
}

/**
 * Parse a date string like "Oct 2023", "October 2023", "2023", or "Present".
 * Returns { month, year } where month is 0-indexed.
 */
export function parseMonthYear(raw: string): MonthYear | null {
  const s = raw.trim().toLowerCase();

  if (s === "present" || s === "current" || s === "now") {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  }

  // Try "Month YYYY" or "Mon YYYY"
  const match = s.match(/^([a-z]+)\s+(\d{4})$/);
  if (match) {
    const monthIdx = MONTH_ABBREV[match[1]];
    if (monthIdx !== undefined) {
      return { month: monthIdx, year: parseInt(match[2], 10) };
    }
  }

  // Try "YYYY" only
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) {
    return { month: 0, year: parseInt(yearOnly[1], 10) };
  }

  // Try "MM/YYYY"
  const slashMatch = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return {
      month: parseInt(slashMatch[1], 10) - 1,
      year: parseInt(slashMatch[2], 10),
    };
  }

  return null;
}

/**
 * Inclusive month count between two MonthYear values.
 * "Oct 2023 – Dec 2023" => 3 months.
 */
export function monthsBetweenInclusive(
  start: MonthYear,
  end: MonthYear
): number {
  const months = (end.year - start.year) * 12 + (end.month - start.month) + 1;
  return Math.max(months, 0);
}

/**
 * Convert total months into { years, months }.
 */
export function monthsToYearsMonths(totalMonths: number): {
  years: number;
  months: number;
} {
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

/**
 * Format MonthYear back to "Month YYYY" string.
 */
export function formatMonthYear(my: MonthYear): string {
  const monthName =
    MONTHS[my.month].charAt(0).toUpperCase() + MONTHS[my.month].slice(1, 3);
  return `${monthName} ${my.year}`;
}
