/**
 * Display formatting. Money is held as integer ZAR cents everywhere; it is only
 * converted for display here (docs/02_TECHNICAL_REQUIREMENTS.md section 5).
 */

const TZ = "Africa/Johannesburg";

/** "R 184,260" (whole rand, thousands grouped with commas to avoid locale-specific spaces). */
export function formatZar(cents: number): string {
  const rand = Math.round(cents / 100);
  return "R " + String(rand).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatPercent(value: number, digits = 1): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function parts(date: Date, options: Intl.DateTimeFormatOptions) {
  const out: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, ...options }).formatToParts(date)) {
    out[p.type] = p.value;
  }
  return out;
}

/** "WED / 19 NOV 2026" (topbar). */
export function formatTopbarDate(date: Date): string {
  const p = parts(date, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  return `${p.weekday} / ${p.day} ${p.month} ${p.year}`.toUpperCase();
}

/** "19 NOVEMBER 2026" (hero eyebrow). */
export function formatLongDate(date: Date): string {
  const p = parts(date, { day: "numeric", month: "long", year: "numeric" });
  return `${p.day} ${p.month} ${p.year}`.toUpperCase();
}

/** Calendar year/month/day in Africa/Johannesburg, so "today" never depends on the server's own zone. */
export function johannesburgYmd(date: Date): { year: number; month: number; day: number } {
  const p = parts(date, { year: "numeric", month: "numeric", day: "numeric" });
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: "UTC", month: "short", year: "numeric" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .toUpperCase();
}
