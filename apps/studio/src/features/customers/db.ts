import type { SupabaseClient } from "@supabase/supabase-js";

export interface CustomerEnquiry {
  id: string;
  ref: string;
  topic: string | null;
  category: string;
  status: string;
  receivedAt: string;
}

export interface LiveCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  /** storefront (website enquiry), newsletter, manual */
  source: string | null;
  segment: string | null;
  notes: string;
  createdAt: string;
  archived: boolean;
  /** Has an active marketing-email consent. Staff who cannot read consents (finance) always see false. */
  subscribed: boolean;
  subscribedAt: string | null;
  enquiries: CustomerEnquiry[];
}

const SELECT =
  "id, display_name, primary_email_normalized, phone_e164, company, source, segment, notes, created_at, archived_at, " +
  "enquiries(id, enquiry_ref, topic, category, status, received_at), consents(purpose, granted, revoked_at, recorded_at)";

interface Row {
  id: string; display_name: string; primary_email_normalized: string | null; phone_e164: string | null; company: string | null;
  source: string | null; segment: string | null; notes: string | null; created_at: string; archived_at: string | null;
  enquiries: Array<{ id: string; enquiry_ref: string; topic: string | null; category: string; status: string; received_at: string }> | null;
  consents: Array<{ purpose: string; granted: boolean; revoked_at: string | null; recorded_at: string }> | null;
}

const toCustomer = (row: Row): LiveCustomer => {
  const consent = (row.consents ?? []).filter((c) => c.purpose === "marketing_email" && c.granted && !c.revoked_at).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  return {
    id: row.id,
    name: row.display_name,
    email: row.primary_email_normalized,
    phone: row.phone_e164,
    company: row.company,
    source: row.source,
    segment: row.segment,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    archived: row.archived_at !== null,
    subscribed: Boolean(consent),
    subscribedAt: consent?.recorded_at ?? null,
    enquiries: (row.enquiries ?? [])
      .map((e) => ({ id: e.id, ref: e.enquiry_ref, topic: e.topic, category: e.category, status: e.status, receivedAt: e.received_at }))
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
  };
};

/** Customers with their enquiries and marketing consent in ONE trip. Row-level security decides who may read them. */
export async function fetchCustomers(db: SupabaseClient, workspaceId: string): Promise<LiveCustomer[]> {
  const { data, error } = await db.from("customers").select(SELECT).eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(1000);
  if (error) throw new Error(`Could not load customers: ${error.message}`);
  return ((data ?? []) as unknown as Row[]).map(toCustomer);
}

/** Phone numbers are stored in international form so they work with WhatsApp, calls and later SMS. */
export function normalisePhone(value: string): { ok: true; phone: string | null } | { ok: false } {
  const raw = value.replace(/[\s\-().]/g, "");
  if (!raw) return { ok: true, phone: null };
  if (/^0\d{9}$/.test(raw)) return { ok: true, phone: `+27${raw.slice(1)}` }; // a South African local number
  if (/^\+\d{7,15}$/.test(raw)) return { ok: true, phone: raw };
  return { ok: false };
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function friendly(error: { code?: string; message: string }): string {
  if (error.code === "23505" || /duplicate key|unique/i.test(error.message)) return "A customer with that email address already exists.";
  if (error.code === "42501" || /row-level security|permission/i.test(error.message)) return "You don't have permission to change customers. Ask the studio owner.";
  return error.message;
}

export async function createCustomer(
  db: SupabaseClient,
  workspaceId: string,
  input: { name: string; email: string; phone: string; company: string; notes: string },
): Promise<{ customer: LiveCustomer } | { error: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: "Enter the customer's name." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." };
  const phone = normalisePhone(input.phone);
  if (!phone.ok) return { error: "Enter the phone number in international form, for example +27 82 000 0000, or a 10-digit South African number." };

  const { data, error } = await db
    .from("customers")
    .insert({
      workspace_id: workspaceId, display_name: name, primary_email_normalized: email, phone_e164: phone.phone,
      company: input.company.trim() || null, notes: input.notes.trim() || null, source: "manual",
      customer_type: input.company.trim() ? "company" : "individual",
    })
    .select(SELECT)
    .single();
  if (error) return { error: friendly(error) };
  return { customer: toCustomer(data as unknown as Row) };
}

export async function saveCustomerNotes(db: SupabaseClient, id: string, notes: string): Promise<string | null> {
  const { error } = await db.from("customers").update({ notes: notes.trim() || null }).eq("id", id);
  return error ? friendly(error) : null;
}

/** Customers are archived, never deleted: orders and invoices must keep pointing at someone. */
export async function setCustomerArchived(db: SupabaseClient, id: string, archived: boolean): Promise<string | null> {
  const { error } = await db.from("customers").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
  return error ? friendly(error) : null;
}
