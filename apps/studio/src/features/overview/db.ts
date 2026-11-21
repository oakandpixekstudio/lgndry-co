import type { SupabaseClient } from "@supabase/supabase-js";

export interface OverviewData {
  newEnquiries: number;
  openEnquiries: number;
  customers: number;
  newCustomers30d: number;
  subscribers: number;
  published: number;
  drafts: number;
  recentEnquiries: Array<{ id: string; ref: string; name: string; topic: string | null; category: string; status: string; receivedAt: string }>;
  recentCustomers: Array<{ id: string; name: string; email: string | null; source: string | null; createdAt: string }>;
  draftWorks: Array<{ id: string; title: string; slug: string }>;
}

/** Everything the live Overview shows, in one round of parallel queries. Row-level security decides what each role can see. */
export async function fetchOverview(db: SupabaseClient, workspaceId: string): Promise<OverviewData> {
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const count = (table: string) => db.from(table).select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);

  const [newEnq, openEnq, customers, newCust, subs, published, drafts, recentEnq, recentCust, draftWorks] = await Promise.all([
    count("enquiries").eq("status", "new"),
    count("enquiries").neq("status", "closed"),
    count("customers").is("archived_at", null),
    count("customers").is("archived_at", null).gte("created_at", monthAgo),
    count("consents").eq("purpose", "marketing_email").eq("granted", true).is("revoked_at", null),
    count("artworks").eq("release_status", "published"),
    count("artworks").eq("release_status", "draft"),
    db.from("enquiries").select("id, enquiry_ref, contact_name, topic, category, status, received_at").eq("workspace_id", workspaceId).order("received_at", { ascending: false }).limit(5),
    db.from("customers").select("id, display_name, primary_email_normalized, source, created_at").eq("workspace_id", workspaceId).is("archived_at", null).order("created_at", { ascending: false }).limit(5),
    db.from("artworks").select("id, title, slug").eq("workspace_id", workspaceId).eq("release_status", "draft").order("created_at", { ascending: false }).limit(5),
  ]);

  const failed = [newEnq, openEnq, customers, newCust, subs, published, drafts, recentEnq, recentCust, draftWorks].find((r) => r.error);
  if (failed?.error) throw new Error(`Could not load the overview: ${failed.error.message}`);

  return {
    newEnquiries: newEnq.count ?? 0,
    openEnquiries: openEnq.count ?? 0,
    customers: customers.count ?? 0,
    newCustomers30d: newCust.count ?? 0,
    subscribers: subs.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    recentEnquiries: (recentEnq.data ?? []).map((r) => ({ id: r.id, ref: r.enquiry_ref, name: r.contact_name, topic: r.topic, category: r.category, status: r.status, receivedAt: r.received_at })),
    recentCustomers: (recentCust.data ?? []).map((r) => ({ id: r.id, name: r.display_name, email: r.primary_email_normalized, source: r.source, createdAt: r.created_at })),
    draftWorks: (draftWorks.data ?? []).map((r) => ({ id: r.id, title: r.title, slug: r.slug })),
  };
}
