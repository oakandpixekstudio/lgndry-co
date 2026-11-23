import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "Needs your attention" items, worked out from the real records each time a page loads. There is no separate
 * notifications table: an item exists while the thing behind it is still waiting, and disappears on its own once it is
 * dealt with (an enquiry is answered, a booking request is reviewed, a shoot has passed). Nothing is ever "unread" in a
 * way that could drift out of sync with the records.
 */
export type AttentionKind = "enquiry" | "booking" | "shoot";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  title: string;
  body: string;
  /** When it arrived (enquiry, booking) or when the shoot starts. */
  at: string;
  /** The same moment in plain words ("4 minutes ago"), worked out on the server so the browser shows the identical text. */
  when: string;
  href: string;
}

export interface Attention {
  items: AttentionItem[];
  counts: { enquiries: number; bookings: number; shoots: number };
  total: number;
  /** True when this role cannot read the records behind these alerts, so "nothing waiting" would be misleading. */
  restricted?: boolean;
}

/** What roles without access to enquiries and bookings get, instead of a list that looks empty by accident. */
export const RESTRICTED_ATTENTION: Attention = { items: [], counts: { enquiries: 0, bookings: 0, shoots: 0 }, total: 0, restricted: true };

const SA_OFFSET_MS = 2 * 3_600_000; // South Africa has no daylight saving
const DAY_MS = 86_400_000;
/** Midnight at the start of today in Johannesburg, as a UTC moment. */
function startOfSaDay(now: Date): Date {
  return new Date(Math.floor((now.getTime() + SA_OFFSET_MS) / DAY_MS) * DAY_MS - SA_OFFSET_MS);
}

const WEEK_MS = 7 * 86_400_000;

export async function fetchAttention(db: SupabaseClient, workspaceId: string, now: Date = new Date()): Promise<Attention> {
  const [enquiries, bookings, shoots] = await Promise.all([
    db.from("enquiries").select("id, enquiry_ref, contact_name, topic, category, received_at", { count: "exact" })
      .eq("workspace_id", workspaceId).eq("status", "new").order("received_at", { ascending: false }).limit(10),
    db.from("booking_requests").select("id, booking_ref, title, created_at, customers(display_name)", { count: "exact" })
      .eq("workspace_id", workspaceId).eq("status", "requested").order("created_at", { ascending: false }).limit(10),
    db.from("booking_requests").select("id, booking_ref, title, preferred_start_at", { count: "exact" })
      .eq("workspace_id", workspaceId).in("status", ["confirmed", "scheduled"])
      .gte("preferred_start_at", startOfSaDay(now).toISOString()).lte("preferred_start_at", new Date(startOfSaDay(now).getTime() + WEEK_MS).toISOString())
      .order("preferred_start_at", { ascending: true }).limit(10),
  ]);
  for (const res of [enquiries, bookings, shoots]) if (res.error) throw new Error(`Could not load notifications: ${res.error.message || res.error.code || "database error"}`);

  const items: AttentionItem[] = ([
    ...(enquiries.data ?? []).map((row) => ({
      id: `enq-${row.id}`, kind: "enquiry" as const, title: `New enquiry from ${row.contact_name}`,
      body: `${row.topic || row.category} · ${row.enquiry_ref}`, at: row.received_at as string, href: "/enquiries",
    })),
    ...((bookings.data ?? []) as unknown as Array<{ id: string; booking_ref: string; title: string; created_at: string; customers: { display_name: string } | null }>).map((row) => ({
      id: `bk-${row.id}`, kind: "booking" as const, title: "New booking request",
      body: `${row.title}${row.customers ? ` · ${row.customers.display_name}` : ""} · ${row.booking_ref}`, at: row.created_at, href: "/bookings",
    })),
    ...(shoots.data ?? []).map((row) => ({
      id: `shoot-${row.id}`, kind: "shoot" as const, title: "Shoot coming up",
      body: `${row.title} · ${row.booking_ref}`, at: row.preferred_start_at as string, href: "/bookings",
    })),
  ] as Array<Omit<AttentionItem, "when">>).map((item) => ({ ...item, when: item.kind === "shoot" ? shootWhen(item.at, now) : whenLabel(item.at, now) }));
  const counts = { enquiries: enquiries.count ?? 0, bookings: bookings.count ?? 0, shoots: shoots.count ?? 0 };
  return { items, counts, total: counts.enquiries + counts.bookings + counts.shoots };
}

/** "4 minutes ago", "Yesterday", "In 2 days": plain wording for the list. */
export function whenLabel(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const unit = minutes < 1 ? "just now" : minutes < 60 ? `${minutes} minute${minutes === 1 ? "" : "s"}` : hours < 24 ? `${hours} hour${hours === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"}`;
  if (unit === "just now") return unit;
  return diff < 0 ? `${unit} ago` : `in ${unit}`;
}

/**
 * When a shoot is, by calendar day in Johannesburg: "today", "tomorrow", "in 3 days". A shoot saved with a date but no time
 * is stored as midnight, so it must still read "today" all day, not "10 hours ago". The time is added only when one was set.
 */
export function shootWhen(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  const dayDiff = Math.floor((at.getTime() + SA_OFFSET_MS) / DAY_MS) - Math.floor((now.getTime() + SA_OFFSET_MS) / DAY_MS);
  const time = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  const day = dayDiff === 0 ? "today" : dayDiff === 1 ? "tomorrow" : dayDiff > 1 ? `in ${dayDiff} days` : dayDiff === -1 ? "yesterday" : `${-dayDiff} days ago`;
  return time === "00:00" ? day : `${day} at ${time}`;
}

/** Up to `limit` items for the bell, taking one of each kind in turn so a flood of enquiries cannot hide a shoot. */
export function bellItems(items: AttentionItem[], limit = 5): AttentionItem[] {
  const queues = (["enquiry", "booking", "shoot"] as const).map((kind) => items.filter((item) => item.kind === kind));
  const picked: AttentionItem[] = [];
  for (let round = 0; picked.length < limit && queues.some((queue) => queue[round]); round++) {
    for (const queue of queues) if (queue[round] && picked.length < limit) picked.push(queue[round]!);
  }
  return picked;
}
