import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/paged";

export type Audience = "all_subscribers" | "subscribed_enquirers";
export const AUDIENCE_LABEL: Record<Audience, string> = {
  all_subscribers: "Everyone subscribed to the newsletter",
  subscribed_enquirers: "Subscribers who have also sent an enquiry",
};

export interface Draft {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  body: string;
  audience: Audience;
  archived: boolean;
  updatedAt: string;
}

export interface Subscriber { id: string; name: string; email: string; since: string; hasEnquired: boolean }

interface DraftRow { id: string; name: string; subject: string | null; preview_text: string | null; body: string; audience: Audience; status: string; updated_at: string }
interface ConsentRow { recorded_at: string; customers: { id: string; display_name: string; primary_email_normalized: string | null; archived_at: string | null } | null }

const toDraft = (row: DraftRow): Draft => ({
  id: row.id, name: row.name, subject: row.subject ?? "", previewText: row.preview_text ?? "", body: row.body, audience: row.audience, archived: row.status === "archived", updatedAt: row.updated_at,
});
const DRAFT_COLUMNS = "id, name, subject, preview_text, body, audience, status, updated_at";

/**
 * Who would receive a campaign: customers with an active marketing-email consent, an email address and no archive.
 * A person who unsubscribed (consent revoked) is not counted. Each person is counted once, however many consents they hold.
 */
export async function fetchCampaigns(db: SupabaseClient, workspaceId: string): Promise<{ drafts: Draft[]; subscribers: Subscriber[] }> {
  // Subscribers and enquiries are read page by page: the database stops at 1,000 rows per request without saying so.
  const [drafts, consentRows, enquiryRows] = await Promise.all([
    db.from("campaigns").select(DRAFT_COLUMNS).eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(500),
    fetchAllRows<ConsentRow>((from, to) =>
      db.from("consents").select("recorded_at, customers!inner(id, display_name, primary_email_normalized, archived_at)").eq("purpose", "marketing_email").eq("granted", true).is("revoked_at", null).eq("customers.workspace_id", workspaceId).order("id").range(from, to)),
    fetchAllRows<{ customer_id: string }>((from, to) =>
      db.from("enquiries").select("customer_id").eq("workspace_id", workspaceId).not("customer_id", "is", null).order("id").range(from, to)),
  ]).catch((problem: unknown) => {
    throw new Error(`Could not load campaigns: ${problem instanceof Error ? problem.message : "database error"}`);
  });
  if (drafts.error) throw new Error(`Could not load campaigns: ${drafts.error.message || drafts.error.code || "database error"}`);

  const enquirers = new Set(enquiryRows.map((row) => row.customer_id));
  const seen = new Map<string, Subscriber>();
  for (const row of consentRows) {
    const customer = row.customers;
    if (!customer || customer.archived_at || !customer.primary_email_normalized) continue;
    const existing = seen.get(customer.id);
    if (!existing || row.recorded_at < existing.since) {
      seen.set(customer.id, { id: customer.id, name: customer.display_name, email: customer.primary_email_normalized, since: row.recorded_at, hasEnquired: enquirers.has(customer.id) });
    }
  }
  return {
    drafts: ((drafts.data ?? []) as unknown as DraftRow[]).map(toDraft),
    subscribers: [...seen.values()].sort((a, b) => b.since.localeCompare(a.since)),
  };
}

export const audienceSize = (subscribers: Subscriber[], audience: Audience) =>
  audience === "all_subscribers" ? subscribers.length : subscribers.filter((s) => s.hasEnquired).length;

function friendly(error: { code?: string; message: string }): string {
  if (error.code === "PGRST116") return "You don't have permission to change campaigns, or this draft no longer exists. Refresh and try again.";
  if (error.code === "42501" || /row-level security|permission/i.test(error.message)) return "You don't have permission to change campaigns. Ask the studio owner.";
  if (/check constraint/i.test(error.message)) return "The name cannot be empty, and the text is too long.";
  return error.message || error.code || "database error";
}

export interface DraftInput { name: string; subject: string; previewText: string; body: string; audience: Audience }

export async function saveDraft(db: SupabaseClient, workspaceId: string, id: string | null, input: DraftInput): Promise<{ draft: Draft } | { error: string }> {
  if (!input.name.trim()) return { error: "Give the draft a name." };
  const fields = { name: input.name.trim(), subject: input.subject.trim() || null, preview_text: input.previewText.trim() || null, body: input.body, audience: input.audience };
  if (id) {
    const { data, error } = await db.from("campaigns").update(fields).eq("id", id).select(DRAFT_COLUMNS).single();
    return error ? { error: friendly(error) } : { draft: toDraft(data as unknown as DraftRow) };
  }
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { error: "Sign in again." };
  const { data, error } = await db.from("campaigns").insert({ ...fields, workspace_id: workspaceId, created_by: auth.user.id }).select(DRAFT_COLUMNS).single();
  return error ? { error: friendly(error) } : { draft: toDraft(data as unknown as DraftRow) };
}

/** Drafts are archived, never deleted. */
export async function setDraftArchived(db: SupabaseClient, id: string, archived: boolean): Promise<string | null> {
  const { error } = await db.from("campaigns").update({ status: archived ? "archived" : "draft" }).eq("id", id);
  return error ? friendly(error) : null;
}
