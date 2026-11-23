import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/paged";

/** South Africa is UTC+2 all year, so a local calendar day is the UTC time shifted by two hours. */
const SA_OFFSET_MS = 2 * 3600_000;
const saDate = (iso: string) => new Date(new Date(iso).getTime() + SA_OFFSET_MS);
const pad = (n: number) => String(n).padStart(2, "0");

/** The Monday of the week a moment falls in, as YYYY-MM-DD in Johannesburg time. */
export function weekStart(iso: string): string {
  const d = saDate(iso);
  const back = (d.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
}

/** The calendar month a moment falls in, as YYYY-MM in Johannesburg time. */
export function monthKey(iso: string): string {
  const d = saDate(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export interface Bar { label: string; value: number }

/** The last `count` weeks ending with the week of `now`, oldest first, with zero for quiet weeks. */
export function weeklyBars(timestamps: string[], now: Date, count: number): Bar[] {
  const counts = new Map<string, number>();
  for (const at of timestamps) counts.set(weekStart(at), (counts.get(weekStart(at)) ?? 0) + 1);
  const bars: Bar[] = [];
  const thisWeek = weekStart(now.toISOString());
  const [y, m, d] = thisWeek.split("-").map(Number) as [number, number, number];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(y, m - 1, d - i * 7));
    const key = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;
    const label = new Intl.DateTimeFormat("en-ZA", { timeZone: "UTC", day: "2-digit", month: "short" }).format(start);
    bars.push({ label: `Week of ${label}`, value: counts.get(key) ?? 0 });
  }
  return bars;
}

/** The last `count` months ending with the month of `now`, oldest first. */
export function monthlyBars(timestamps: string[], now: Date, count: number): Bar[] {
  const counts = new Map<string, number>();
  for (const at of timestamps) counts.set(monthKey(at), (counts.get(monthKey(at)) ?? 0) + 1);
  const sa = saDate(now.toISOString());
  const bars: Bar[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(sa.getUTCFullYear(), sa.getUTCMonth() - i, 1));
    const key = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`;
    const label = new Intl.DateTimeFormat("en-ZA", { timeZone: "UTC", month: "long", year: "numeric" }).format(start);
    bars.push({ label, value: counts.get(key) ?? 0 });
  }
  return bars;
}

/** Counts of each value, largest first, with friendly labels. */
export function tally(values: string[], labels: Record<string, string>): Bar[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([key, value]) => ({ label: labels[key] ?? key, value })).sort((a, b) => b.value - a.value);
}

export interface InsightsData {
  generatedAt: string;
  enquiries: { total90d: number; weekly: Bar[]; byCategory: Bar[]; byStatus: Bar[] };
  customers: { total: number; monthly: Bar[]; bySource: Bar[] };
  subscribers: { total: number; monthly: Bar[] };
  bookings: { total: number; byStatus: Bar[] };
  catalogue: { published: number; draft: number; scheduled: number; retired: number };
}

export const CATEGORY_LABELS: Record<string, string> = { availability: "Availability", general: "General", commission: "Commission", photography: "Photography" };
export const ENQUIRY_STATUS_LABELS: Record<string, string> = { new: "New", in_progress: "In progress", qualified: "Qualified", converted: "Converted", closed: "Closed" };
export const SOURCE_LABELS: Record<string, string> = { storefront: "Website enquiry", newsletter: "Newsletter", manual: "Added by hand" };
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: "Requested", review: "In review", quoted: "Quoted", awaiting_deposit: "Awaiting deposit", confirmed: "Confirmed", scheduled: "Scheduled",
  in_progress: "In progress", editing: "Editing", delivered: "Delivered", completed: "Completed", cancelled: "Cancelled", expired: "Expired",
};

/** Everything the live Insights screen shows, computed from your own records in one round of parallel queries. */
export async function fetchInsights(db: SupabaseClient, workspaceId: string, now: Date = new Date()): Promise<InsightsData> {
  const weeksBack = new Date(now.getTime() - 12 * 7 * 86_400_000).toISOString();
  const monthsBack = new Date(now.getTime() - 190 * 86_400_000).toISOString();
  const ninetyDays = new Date(now.getTime() - 90 * 86_400_000).toISOString();

  // Every list is read page by page: the database returns at most 1,000 rows per request and does not say when it stops.
  const [enq, cust, subs, books, works, customerTotal, subscriberTotal] = await Promise.all([
    fetchAllRows<{ received_at: string; category: string; status: string }>((from, to) =>
      db.from("enquiries").select("received_at, category, status").eq("workspace_id", workspaceId).gte("received_at", weeksBack).order("id").range(from, to)),
    fetchAllRows<{ created_at: string; source: string | null }>((from, to) =>
      db.from("customers").select("created_at, source").eq("workspace_id", workspaceId).is("archived_at", null).gte("created_at", monthsBack).order("id").range(from, to)),
    // consents has no workspace column; row-level security already limits it to this workspace's staff
    fetchAllRows<{ recorded_at: string }>((from, to) =>
      db.from("consents").select("recorded_at").eq("purpose", "marketing_email").eq("granted", true).is("revoked_at", null).gte("recorded_at", monthsBack).order("id").range(from, to)),
    fetchAllRows<{ status: string }>((from, to) => db.from("booking_requests").select("status").eq("workspace_id", workspaceId).order("id").range(from, to)),
    fetchAllRows<{ release_status: string }>((from, to) => db.from("artworks").select("release_status").eq("workspace_id", workspaceId).order("id").range(from, to)),
    db.from("customers").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).is("archived_at", null),
    db.from("consents").select("id", { count: "exact", head: true }).eq("purpose", "marketing_email").eq("granted", true).is("revoked_at", null),
  ]).catch((problem: unknown) => {
    throw new Error(`Could not load insights: ${problem instanceof Error ? problem.message : "database error"}`);
  });
  for (const res of [customerTotal, subscriberTotal]) {
    if (res.error) throw new Error(`Could not load insights: ${res.error.message || res.error.code || "database error"}`);
  }

  const countWorks = (status: string) => works.filter((w) => w.release_status === status).length;

  return {
    generatedAt: now.toISOString(),
    enquiries: {
      total90d: enq.filter((e) => e.received_at >= ninetyDays).length,
      weekly: weeklyBars(enq.map((e) => e.received_at), now, 12),
      byCategory: tally(enq.map((e) => e.category), CATEGORY_LABELS),
      byStatus: tally(enq.map((e) => e.status), ENQUIRY_STATUS_LABELS),
    },
    customers: { total: customerTotal.count ?? 0, monthly: monthlyBars(cust.map((c) => c.created_at), now, 6), bySource: tally(cust.map((c) => c.source ?? "unknown"), SOURCE_LABELS) },
    subscribers: { total: subscriberTotal.count ?? 0, monthly: monthlyBars(subs.map((s) => s.recorded_at), now, 6) },
    bookings: { total: books.length, byStatus: tally(books.map((b) => b.status), BOOKING_STATUS_LABELS) },
    catalogue: { published: countWorks("published"), draft: countWorks("draft"), scheduled: countWorks("scheduled"), retired: countWorks("retired") },
  };
}
