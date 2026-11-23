import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOverview } from "@/features/overview/db";
import { fetchAllRows } from "@/lib/supabase/paged";
import type { IntelligenceSnapshot, Kpi, Shoot, Signal } from "../types";

/**
 * The Intelligence Center filled from the studio's own records. It uses the same designed panels as the sample
 * snapshot; only the numbers are real. Where the studio has nothing to report (sales, edition production, deliveries,
 * featured works) the panel shows zeros or stays empty. No figure is invented and no period is compared to a
 * "previous period", because none is recorded.
 *
 * Built only for the Overview page. The layout does NOT call this, so no other page pays for these queries.
 */

const SA_OFFSET_MS = 2 * 3_600_000; // South Africa has no daylight saving
const saDate = (iso: string) => new Date(new Date(iso).getTime() + SA_OFFSET_MS).toISOString().slice(0, 10);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface BookingRow { status: string; preferred_start_at: string | null; title: string; customers: { display_name: string } | null }

export async function buildLiveSnapshot(db: SupabaseClient, workspaceId: string, now: Date = new Date()): Promise<IntelligenceSnapshot> {
  const [overview, bookings, qualified] = await Promise.all([
    fetchOverview(db, workspaceId),
    fetchAllRows<BookingRow>((from, to) => db.from("booking_requests").select("status, preferred_start_at, title, customers(display_name)").eq("workspace_id", workspaceId).order("id").range(from, to)),
    db.from("enquiries").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "qualified"),
  ]);

  const today = saDate(now.toISOString());
  const open = bookings.filter((b) => !["completed", "cancelled", "expired"].includes(b.status));
  const confirmed = bookings.filter((b) => ["confirmed", "scheduled"].includes(b.status) && b.preferred_start_at && saDate(b.preferred_start_at) >= today);
  const pending = bookings.filter((b) => b.status === "requested").length;
  const shoots: Shoot[] = confirmed
    .sort((a, b) => a.preferred_start_at!.localeCompare(b.preferred_start_at!))
    .slice(0, 3)
    .map((b) => ({ title: b.title, client: b.customers?.display_name ?? "Client", date: saDate(b.preferred_start_at!), status: "confirmed" as const }));

  const kpis: Kpi[] = [
    { id: "enquiries", label: "New enquiries", value: String(overview.newEnquiries), icon: "mail", href: "/enquiries", note: `${overview.openEnquiries} open in total` },
    { id: "customers", label: "Customers", value: String(overview.customers), icon: "users", href: "/customers", note: `${overview.newCustomers30d} new in 30 days` },
    { id: "subscribers", label: "Newsletter subscribers", value: String(overview.subscribers), icon: "megaphone", href: "/campaigns", note: "With marketing consent" },
    { id: "requests", label: "Booking requests", value: String(pending), icon: "calendar", href: "/bookings", note: "Waiting for review" },
    { id: "shoots", label: "Upcoming shoots", value: String(confirmed.length), icon: "camera", href: "/bookings", note: "Confirmed and still to come" },
    { id: "published", label: "Works on the website", value: String(overview.published), icon: "image", href: "/editions/catalogue", note: "Published" },
    { id: "drafts", label: "Draft works", value: String(overview.drafts), icon: "pencil", href: "/editions/catalogue", note: overview.drafts ? "Not yet public" : "Nothing waiting" },
  ];

  const signal = (id: string, icon: Signal["icon"], title: string, detail: string, href: string, basis: string): Signal => ({ id, icon, title, detail, href, basis });
  const collectorSignals: Signal[] = [];
  if (overview.newEnquiries > 0) collectorSignals.push(signal("new-enquiries", "mail", `${plural(overview.newEnquiries, "new enquiry", "new enquiries")} to answer`, "Nobody has responded yet.", "/enquiries", "Counts enquiries with the status New."));
  if ((qualified.count ?? 0) > 0) collectorSignals.push(signal("qualified", "star", `${plural(qualified.count ?? 0, "qualified enquiry", "qualified enquiries")} ready to follow up`, "Marked as worth pursuing.", "/enquiries", "Counts enquiries with the status Qualified."));
  if (collectorSignals.length === 0) collectorSignals.push(signal("none", "users", "No signals yet", "They appear here as enquiries and customers arrive.", "/customers", "A signal is raised from real enquiry statuses."));

  const insights: Signal[] = [];
  if (overview.drafts > 0) insights.push(signal("drafts", "image", `${plural(overview.drafts, "work is", "works are")} still a draft`, "Finish and publish to show them on the website.", "/editions/catalogue", "Counts works with the status Draft."));
  if (pending > 0) insights.push(signal("pending", "calendar", `${plural(pending, "booking request", "booking requests")} waiting for review`, "Confirm, quote or decline.", "/bookings", "Counts bookings with the status Requested."));
  insights.push(signal("subs", "megaphone", `${plural(overview.subscribers, "person has", "people have")} agreed to marketing email`, "Campaigns can be drafted, but sending is switched off.", "/campaigns", "Counts active marketing-email consents."));

  return {
    mode: "live",
    generatedAt: now.toISOString(),
    kpis,
    sales: { series: Array.from({ length: 12 }, (_, i) => ({ label: `P${i + 1}`, revenueCents: 0, orders: 0 })), monthLabels: [], periodRevenueCents: 0, periodDeltaPct: 0 },
    collectorSignals,
    bookings: { upcoming: confirmed.length, pipeline: open.length, pending, shoots },
    edition: { lowEditionAlerts: 0, inProduction: 0, inTransit: 0, delivered30d: 0, top: [] },
    featured: [],
    insights,
    notes: {
      growth: overview.newCustomers30d > 0 ? `${plural(overview.newCustomers30d, "new customer", "new customers")} joined in the last 30 days.` : "No new customers in the last 30 days yet.",
      opportunity: overview.newEnquiries > 0 ? `${plural(overview.newEnquiries, "enquiry is", "enquiries are")} waiting for a first reply.` : "Every enquiry has had a response.",
      nextFocus: overview.drafts > 0 ? `Finish and publish ${plural(overview.drafts, "draft work", "draft works")}.` : "Nothing is waiting to be published.",
    },
    navCounts: {},
  };
}
