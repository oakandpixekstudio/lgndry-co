import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows } from "@/lib/supabase/paged";

export type BookingStatus =
  | "requested" | "review" | "quoted" | "awaiting_deposit" | "confirmed" | "scheduled"
  | "in_progress" | "editing" | "delivered" | "completed" | "cancelled" | "expired";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Requested", review: "In review", quoted: "Quoted", awaiting_deposit: "Awaiting deposit", confirmed: "Confirmed",
  scheduled: "Scheduled", in_progress: "In progress", editing: "Editing", delivered: "Delivered", completed: "Completed",
  cancelled: "Cancelled", expired: "Expired",
};
export const STATUS_TONE: Record<BookingStatus, string> = {
  requested: "warning", review: "warning", quoted: "info", awaiting_deposit: "info", confirmed: "success", scheduled: "success",
  in_progress: "info", editing: "info", delivered: "success", completed: "success", cancelled: "neutral", expired: "neutral",
};
/**
 * The stages staff can move a booking to by hand. "Quoted" and "Awaiting deposit" are left out on purpose: they belong to
 * quotes and deposit payments, which wait for the studio's pricing and payment decisions (docs/17 D5).
 */
export const MOVABLE: BookingStatus[] = ["requested", "review", "confirmed", "scheduled", "in_progress", "editing", "delivered", "completed", "cancelled", "expired"];

export interface LiveBooking {
  id: string;
  ref: string;
  title: string;
  serviceType: string | null;
  status: BookingStatus;
  location: string | null;
  brief: string;
  budgetNote: string | null;
  notes: string;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  enquiryRef: string | null;
}

export interface PickCustomer { id: string; name: string; email: string | null }
export interface PickEnquiry { id: string; ref: string; name: string; topic: string | null; message: string; customerId: string | null }

const SELECT =
  "id, booking_ref, title, service_type, status, location_text, brief, budget_note, internal_notes, preferred_start_at, preferred_end_at, created_at, " +
  "customers(id, display_name, primary_email_normalized, phone_e164), enquiries(enquiry_ref)";

interface Row {
  id: string; booking_ref: string; title: string; service_type: string | null; status: BookingStatus; location_text: string | null;
  brief: string | null; budget_note: string | null; internal_notes: string | null; preferred_start_at: string | null; preferred_end_at: string | null; created_at: string;
  customers: { id: string; display_name: string; primary_email_normalized: string | null; phone_e164: string | null } | null;
  enquiries: { enquiry_ref: string } | null;
}

const toBooking = (row: Row): LiveBooking => ({
  id: row.id, ref: row.booking_ref, title: row.title, serviceType: row.service_type, status: row.status, location: row.location_text,
  brief: row.brief ?? "", budgetNote: row.budget_note, notes: row.internal_notes ?? "", startAt: row.preferred_start_at, endAt: row.preferred_end_at, createdAt: row.created_at,
  customer: row.customers ? { id: row.customers.id, name: row.customers.display_name, email: row.customers.primary_email_normalized, phone: row.customers.phone_e164 } : null,
  enquiryRef: row.enquiries?.enquiry_ref ?? null,
});

/** Bookings with their customer in one trip. Row-level security decides who sees which (a photographer only sees their own shoots). */
export async function fetchBookings(db: SupabaseClient, workspaceId: string): Promise<LiveBooking[]> {
  try {
    const rows = await fetchAllRows<Row>((from, to) => db.from("booking_requests").select(SELECT).eq("workspace_id", workspaceId).order("created_at", { ascending: false }).order("id").range(from, to));
    return rows.map(toBooking);
  } catch (problem) {
    throw new Error(`Could not load bookings: ${problem instanceof Error ? problem.message : "database error"}`);
  }
}

/** People and open photography enquiries the "New booking" form can start from. Only the owner and studio manager can add bookings. */
export async function fetchPickers(db: SupabaseClient, workspaceId: string): Promise<{ customers: PickCustomer[]; enquiries: PickEnquiry[] }> {
  const [customers, enquiries] = await Promise.all([
    db.from("customers").select("id, display_name, primary_email_normalized").eq("workspace_id", workspaceId).is("archived_at", null).order("display_name").limit(1000),
    db.from("enquiries").select("id, enquiry_ref, contact_name, topic, message, customer_id").eq("workspace_id", workspaceId).eq("category", "photography").in("status", ["new", "in_progress", "qualified"]).order("received_at", { ascending: false }).limit(50),
  ]);
  if (customers.error) throw new Error(`Could not load customers: ${customers.error.message || customers.error.code || "database error"}`);
  if (enquiries.error) throw new Error(`Could not load enquiries: ${enquiries.error.message || enquiries.error.code || "database error"}`);
  return {
    customers: (customers.data ?? []).map((c) => ({ id: c.id, name: c.display_name, email: c.primary_email_normalized })),
    enquiries: (enquiries.data ?? []).map((e) => ({ id: e.id, ref: e.enquiry_ref, name: e.contact_name, topic: e.topic, message: e.message, customerId: e.customer_id })),
  };
}

/** South Africa has no daylight saving, so a local date and time is always UTC+2. */
const toUtcIso = (date: string, time: string) => new Date(`${date}T${time || "00:00"}:00+02:00`).toISOString();

export interface NewBooking {
  customerId: string; enquiryId: string | null; title: string; serviceType: string; date: string; startTime: string; endTime: string;
  location: string; brief: string; budgetNote: string;
}

function friendly(error: { code?: string; message: string }): string {
  if (error.code === "42501" || /row-level security|permission/i.test(error.message)) return "You don't have permission to change bookings. Ask the studio owner.";
  if (/check constraint/i.test(error.message)) return "The end time must be after the start time, and the title cannot be empty.";
  return error.message || error.code || "database error";
}

export async function createBooking(db: SupabaseClient, workspaceId: string, input: NewBooking): Promise<{ booking: LiveBooking } | { error: string }> {
  if (!input.customerId) return { error: "Choose a customer, or add a new one." };
  if (!input.title.trim()) return { error: "Give the booking a title." };
  if (input.endTime && !input.startTime) return { error: "Add a start time as well as the end time." };
  if ((input.startTime || input.endTime) && !input.date) return { error: "Choose the date of the shoot." };
  if (input.startTime && input.endTime && input.endTime < input.startTime) return { error: "The end time must be after the start time." };

  const start = input.date ? toUtcIso(input.date, input.startTime) : null;
  const end = input.date && input.endTime ? toUtcIso(input.date, input.endTime) : null;
  const { data, error } = await db
    .from("booking_requests")
    .insert({
      workspace_id: workspaceId, customer_id: input.customerId, enquiry_id: input.enquiryId, title: input.title.trim(),
      service_type: input.serviceType.trim() || null, location_text: input.location.trim() || null, brief: input.brief.trim() || null,
      budget_note: input.budgetNote.trim() || null, preferred_start_at: start, preferred_end_at: end,
    })
    .select(SELECT)
    .single();
  if (error) return { error: friendly(error) };
  return { booking: toBooking(data as unknown as Row) };
}

/** Saves the details of an existing booking: its title, shoot type, place, stage and internal notes. */
export async function updateBooking(
  db: SupabaseClient,
  id: string,
  input: { title: string; serviceType: string; location: string; status: BookingStatus; notes: string },
): Promise<{ booking: LiveBooking } | { error: string }> {
  if (!input.title.trim()) return { error: "Give the booking a title." };
  const { data, error } = await db
    .from("booking_requests")
    .update({ title: input.title.trim(), service_type: input.serviceType.trim() || null, location_text: input.location.trim() || null, status: input.status, internal_notes: input.notes.trim() || null })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) return { error: friendly(error) };
  return { booking: toBooking(data as unknown as Row) };
}

export async function setBookingStatus(db: SupabaseClient, id: string, status: BookingStatus): Promise<string | null> {
  const { error } = await db.from("booking_requests").update({ status }).eq("id", id);
  return error ? friendly(error) : null;
}

export async function saveBookingNotes(db: SupabaseClient, id: string, notes: string): Promise<string | null> {
  const { error } = await db.from("booking_requests").update({ internal_notes: notes.trim() || null }).eq("id", id);
  return error ? friendly(error) : null;
}

/** After a booking is made from an enquiry, mark the enquiry converted so it leaves the to-do list. Best effort. */
export async function markEnquiryConverted(db: SupabaseClient, enquiryId: string): Promise<void> {
  await db.from("enquiries").update({ status: "converted" }).eq("id", enquiryId);
}
