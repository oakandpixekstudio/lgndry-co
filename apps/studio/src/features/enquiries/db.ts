import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/paged";

export type EnquiryStatus = "new" | "in_progress" | "qualified" | "converted" | "closed";
export type EnquiryCategory = "availability" | "general" | "commission" | "photography";

export const STATUS_ORDER: EnquiryStatus[] = ["new", "in_progress", "qualified", "converted", "closed"];
export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New", in_progress: "In progress", qualified: "Qualified", converted: "Converted", closed: "Closed",
};
export const STATUS_TONE: Record<EnquiryStatus, string> = {
  new: "warning", in_progress: "info", qualified: "success", converted: "success", closed: "neutral",
};
export const CATEGORY_LABEL: Record<EnquiryCategory, string> = {
  availability: "Availability", general: "General", commission: "Commission", photography: "Photography",
};

export interface LiveEnquiry {
  id: string;
  ref: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  category: EnquiryCategory;
  topic: string | null;
  details: Record<string, string>;
  message: string;
  status: EnquiryStatus;
  source: string;
  receivedAt: string;
  artwork: { title: string; slug: string } | null;
}

interface Row {
  id: string; enquiry_ref: string; contact_name: string; contact_email: string; phone: string | null; organisation: string | null;
  category: EnquiryCategory; topic: string | null; details: Record<string, unknown> | null; message: string; status: EnquiryStatus;
  source: string; received_at: string; artworks: { title: string; slug: string } | null;
}

/** The latest enquiries, newest first. Row-level security decides who may see them (owner, studio manager, finance). */
export async function fetchEnquiries(db: SupabaseClient, workspaceId: string): Promise<LiveEnquiry[]> {
  let rows: Row[];
  try {
    rows = await fetchAllRows<Row>((from, to) =>
      db.from("enquiries")
        .select("id, enquiry_ref, contact_name, contact_email, phone, organisation, category, topic, details, message, status, source, received_at, artworks(title, slug)")
        .eq("workspace_id", workspaceId)
        .order("received_at", { ascending: false })
        .order("id")
        .range(from, to));
  } catch (problem) {
    throw new Error(`Could not load enquiries: ${problem instanceof Error ? problem.message : "database error"}`);
  }
  return rows.map((row) => ({
    id: row.id,
    ref: row.enquiry_ref,
    name: row.contact_name,
    email: row.contact_email,
    phone: row.phone,
    organisation: row.organisation,
    category: row.category,
    topic: row.topic,
    details: Object.fromEntries(Object.entries(row.details ?? {}).map(([key, value]) => [key, String(value)])),
    message: row.message,
    status: row.status,
    source: row.source,
    receivedAt: row.received_at,
    artwork: row.artworks,
  }));
}

/** Changes an enquiry's status. Closing or converting stamps the resolved time; reopening clears it. */
export async function setEnquiryStatus(db: SupabaseClient, id: string, status: EnquiryStatus): Promise<string | null> {
  const resolved = status === "closed" || status === "converted";
  const { error } = await db.from("enquiries").update({ status, resolved_at: resolved ? new Date().toISOString() : null }).eq("id", id);
  return error ? error.message : null;
}
