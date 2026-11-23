import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/paged";

export type Direction = "in" | "out" | "note";
export type Channel = "email" | "phone" | "whatsapp" | "in_person" | "other";

export interface ThreadItem {
  id: string;
  /** "form" = sent through a website form (an enquiry); "recorded" = written down by staff. */
  origin: "form" | "recorded";
  direction: Direction;
  channel: Channel | "website";
  subject: string | null;
  body: string;
  at: string;
  enquiryRef: string | null;
  by: string | null;
  /** A website enquiry that has been closed or converted: it no longer waits for an answer. */
  handled: boolean;
}

export interface Thread {
  customerId: string;
  name: string;
  email: string | null;
  items: ThreadItem[];
  lastAt: string;
  /** The last thing in the conversation came from them and has not been dealt with, so it is waiting for an answer. */
  needsReply: boolean;
}

export interface PickPerson { id: string; name: string; email: string | null }

/** What the person writing picks, in plain words, mapped to how it is stored. */
export const ENTRY_KINDS: Array<{ id: string; label: string; direction: Direction; channel: Channel }> = [
  { id: "email-out", label: "Email I sent", direction: "out", channel: "email" },
  { id: "email-in", label: "Email they sent", direction: "in", channel: "email" },
  { id: "phone-out", label: "Phone call I made", direction: "out", channel: "phone" },
  { id: "phone-in", label: "Phone call they made", direction: "in", channel: "phone" },
  { id: "whatsapp-out", label: "WhatsApp I sent", direction: "out", channel: "whatsapp" },
  { id: "whatsapp-in", label: "WhatsApp they sent", direction: "in", channel: "whatsapp" },
  { id: "in_person", label: "Spoke in person", direction: "note", channel: "in_person" },
  { id: "note", label: "Note to the team", direction: "note", channel: "other" },
];

interface EnquiryRow { id: string; enquiry_ref: string; customer_id: string | null; topic: string | null; category: string; message: string; received_at: string; status: string }
interface MessageRow { id: string; customer_id: string; direction: Direction; channel: Channel; subject: string | null; body: string; occurred_at: string; created_by: string | null }
interface PersonRow { id: string; display_name: string; primary_email_normalized: string | null }

const MESSAGE_COLUMNS = "id, customer_id, direction, channel, subject, body, occurred_at, created_by";

const fromMessage = (row: MessageRow): ThreadItem => ({
  id: row.id, origin: "recorded", direction: row.direction, channel: row.channel, subject: row.subject, body: row.body, at: row.occurred_at, enquiryRef: null, by: row.created_by, handled: false,
});
const fromEnquiry = (row: EnquiryRow): ThreadItem => ({
  id: row.id, origin: "form", direction: "in", channel: "website", subject: row.topic || row.category, body: row.message, at: row.received_at, enquiryRef: row.enquiry_ref, by: null,
  handled: row.status === "closed" || row.status === "converted",
});

/** Puts a conversation in time order and works out when it was last active and whether it is waiting for an answer. */
export function summarise(items: ThreadItem[]): { items: ThreadItem[]; lastAt: string; needsReply: boolean } {
  const sorted = [...items].sort((a, b) => a.at.localeCompare(b.at));
  const last = [...sorted].reverse().find((item) => item.direction !== "note");
  return { items: sorted, lastAt: sorted[sorted.length - 1]!.at, needsReply: last?.direction === "in" && !last.handled };
}

function build(people: PersonRow[], enquiries: EnquiryRow[], messages: MessageRow[]): Thread[] {
  const items = new Map<string, ThreadItem[]>();
  const add = (customerId: string, item: ThreadItem) => items.set(customerId, [...(items.get(customerId) ?? []), item]);
  for (const row of enquiries) if (row.customer_id) add(row.customer_id, fromEnquiry(row));
  for (const row of messages) add(row.customer_id, fromMessage(row));
  const byId = new Map(people.map((p) => [p.id, p]));
  const threads: Thread[] = [];
  for (const [customerId, list] of items) {
    const person = byId.get(customerId);
    threads.push({ customerId, name: person?.display_name ?? "Unknown customer", email: person?.primary_email_normalized ?? null, ...summarise(list) });
  }
  return threads.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

/**
 * Every conversation. Each list is read page by page, because the database stops at 1,000 rows per request without
 * saying so. Row-level security limits this to the owner and studio managers.
 */
export async function fetchInbox(db: SupabaseClient, workspaceId: string): Promise<{ threads: Thread[]; people: PickPerson[] }> {
  let people: PersonRow[];
  let enquiries: EnquiryRow[];
  let messages: MessageRow[];
  try {
    [people, enquiries, messages] = await Promise.all([
      fetchAllRows<PersonRow>((from, to) => db.from("customers").select("id, display_name, primary_email_normalized").eq("workspace_id", workspaceId).order("display_name").order("id").range(from, to)),
      fetchAllRows<EnquiryRow>((from, to) => db.from("enquiries").select("id, enquiry_ref, customer_id, topic, category, message, received_at, status").eq("workspace_id", workspaceId).order("received_at", { ascending: false }).order("id").range(from, to)),
      fetchAllRows<MessageRow>((from, to) => db.from("customer_messages").select(MESSAGE_COLUMNS).eq("workspace_id", workspaceId).order("occurred_at", { ascending: false }).order("id").range(from, to)),
    ]);
  } catch (problem) {
    throw new Error(`Could not load the inbox: ${problem instanceof Error ? problem.message : "database error"}`);
  }
  return {
    threads: build(people, enquiries, messages),
    people: people.map((p) => ({ id: p.id, name: p.display_name, email: p.primary_email_normalized })),
  };
}

/**
 * Writes one line into a customer's record. It only records: nothing is sent to anyone. Lines cannot be edited or removed
 * afterwards (the database refuses), so a mistake is corrected by adding another line.
 *
 * `occurredAt` is optional: a local date and time ("2026-11-20T14:30", South African time) for something that happened
 * earlier. Left empty, the line is stamped with the moment it is saved.
 */
export async function recordMessage(
  db: SupabaseClient,
  workspaceId: string,
  input: { customerId: string; kindId: string; subject: string; body: string; occurredAt?: string },
): Promise<{ item: ThreadItem } | { error: string }> {
  const kind = ENTRY_KINDS.find((k) => k.id === input.kindId);
  if (!kind) return { error: "Choose what kind of entry this is." };
  if (!input.customerId) return { error: "Choose a customer." };
  if (!input.body.trim()) return { error: "Write what was said." };
  if (input.body.length > 10000) return { error: "That is too long. Keep it under 10,000 characters." };

  let occurred: string | null = null;
  if (input.occurredAt) {
    const moment = new Date(`${input.occurredAt}:00+02:00`); // South Africa has no daylight saving, so local time is always UTC+2
    if (Number.isNaN(moment.getTime())) return { error: "That date and time is not valid." };
    if (moment.getTime() > Date.now() + 5 * 60_000) return { error: "An entry cannot be dated in the future." };
    occurred = moment.toISOString();
  }

  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { error: "Sign in again." };

  const { data, error } = await db
    .from("customer_messages")
    .insert({
      workspace_id: workspaceId, customer_id: input.customerId, direction: kind.direction, channel: kind.channel,
      subject: input.subject.trim() || null, body: input.body.trim(), created_by: auth.user.id,
      ...(occurred ? { occurred_at: occurred } : {}),
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) {
    if (error.code === "42501" || /row-level security|permission/i.test(error.message)) return { error: "You don't have permission to record messages. Ask the studio owner." };
    return { error: error.message || error.code || "database error" };
  }
  return { item: fromMessage(data as unknown as MessageRow) };
}
