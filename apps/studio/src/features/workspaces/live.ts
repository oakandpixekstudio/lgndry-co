import { CATEGORY_LABEL, STATUS_LABEL as ENQUIRY_STATUS_LABEL, STATUS_ORDER, type EnquiryStatus, type LiveEnquiry } from "@/features/enquiries/db";
import { MOVABLE, STATUS_LABEL as BOOKING_STATUS_LABEL, type BookingStatus, type LiveBooking } from "@/features/bookings/db";
import { AUDIENCE_LABEL, audienceSize, type Audience, type Draft, type Subscriber } from "@/features/campaigns/db";
import type { LiveCustomer } from "@/features/customers/db";
import { bookingsWorkspace, campaignsWorkspace, customersWorkspace, enquiriesWorkspace } from "./demo-data";
import type { WorkspaceConfig, WorkspaceRow, WorkspaceTone } from "./types";

/**
 * Turns real records into the shape the designed workspace screens already understand (the same screens the sample
 * data uses). The design, columns, tabs and wording come from the sample configuration; ONLY the numbers and rows are
 * replaced. Nothing here invents a value: where the studio has no figure (prices, orders, response times) the screen
 * shows a dash, and no percentage compares against a "previous period" because none is recorded.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SA_OFFSET_MS = 2 * 3_600_000; // South Africa has no daylight saving

const saParts = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + SA_OFFSET_MS);
  return { day: String(d.getUTCDate()).padStart(2, "0"), month: MONTHS[d.getUTCMonth()]!, year: d.getUTCFullYear(), hh: String(d.getUTCHours()).padStart(2, "0"), mm: String(d.getUTCMinutes()).padStart(2, "0") };
};
/** "20 Nov 2026" in Johannesburg time. The calendar reads this exact shape. */
export const dayLabel = (iso: string) => {
  const p = saParts(iso);
  return `${p.day} ${p.month} ${p.year}`;
};
export const dayTimeLabel = (iso: string) => {
  const p = saParts(iso);
  return `${p.day} ${p.month} ${p.year}, ${p.hh}:${p.mm}`;
};
const timeLabel = (iso: string) => {
  const p = saParts(iso);
  return `${p.hh}:${p.mm}`;
};

const DASH = "—";
const metric = (label: string, value: number | string, change: string, icon: WorkspaceConfig["metrics"][number]["icon"]) => ({ label, value: String(value), change, icon });
const within = (iso: string, days: number) => new Date(iso).getTime() >= Date.now() - days * 86_400_000;

/* ───────── customers ───────── */

const customerBucket = (c: LiveCustomer) => (c.enquiries.length ? "Enquirer" : c.subscribed ? "Subscriber" : c.source === "manual" ? "Added by hand" : "Customer");

export function customerRow(c: LiveCustomer, bookingCount: number): WorkspaceRow {
  const last = [c.createdAt, ...c.enquiries.map((e) => e.receivedAt)].sort().pop()!;
  const bucket = customerBucket(c);
  return {
    id: c.id,
    title: c.name,
    subtitle: c.email ?? "No email",
    bucket,
    status: "Active",
    tone: "success",
    cells: { type: bucket, value: DASH, orders: DASH, bookings: String(bookingCount), activity: dayLabel(last) },
    detail: {
      eyebrow: `Customer since ${dayLabel(c.createdAt)}`,
      metrics: [
        { label: "Lifetime value", value: DASH },
        { label: "Total orders", value: DASH },
        { label: "Total bookings", value: String(bookingCount) },
        { label: "Last activity", value: dayLabel(last) },
      ],
      facts: [
        { label: "Email", value: c.email ?? DASH },
        { label: "Phone", value: c.phone ?? DASH },
        { label: "Company", value: c.company ?? DASH },
        { label: "Customer since", value: dayLabel(c.createdAt) },
      ],
      description: c.notes || undefined,
      secondaryTitle: "Contact history",
      secondaryFacts: [
        { label: "Newsletter", value: c.subscribed ? "Subscribed" : "Not subscribed" },
        { label: "First contact", value: c.source === "storefront" ? "Website enquiry" : c.source === "newsletter" ? "Newsletter sign-up" : c.source === "manual" ? "Added by hand" : DASH },
        { label: "Enquiries", value: String(c.enquiries.length) },
      ],
    },
  };
}

export function customersConfig(customers: LiveCustomer[], bookingCounts: Record<string, number>): WorkspaceConfig {
  const rows = customers.filter((c) => !c.archived).map((c) => customerRow(c, bookingCounts[c.id] ?? 0));
  const count = (bucket: string) => rows.filter((r) => r.bucket === bucket).length;
  return {
    ...customersWorkspace,
    intelligenceLabel: "Customer intelligence (from your records)",
    metrics: [
      metric("Total customers", rows.length, "In the studio's records", "users"),
      metric("Enquirers", count("Enquirer"), "Have sent an enquiry", "mail"),
      metric("Newsletter subscribers", customers.filter((c) => !c.archived && c.subscribed).length, "Agreed to marketing email", "megaphone"),
      metric("New in 30 days", customers.filter((c) => !c.archived && within(c.createdAt, 30)).length, "Joined in the last 30 days", "star"),
      metric("Booking clients", Object.keys(bookingCounts).filter((id) => rows.some((r) => r.id === id)).length, "Have a photography booking", "calendar"),
      metric("Added by hand", count("Added by hand"), "Entered by the team", "layers"),
    ],
    tabs: [
      { label: "All Customers", bucket: "all", count: rows.length },
      { label: "Enquirers", bucket: "Enquirer", count: count("Enquirer") },
      { label: "Subscribers", bucket: "Subscriber", count: count("Subscriber") },
      { label: "Added by hand", bucket: "Added by hand", count: count("Added by hand") },
    ],
    filters: ["Customer type", "Status"],
    rows,
  };
}

/* ───────── enquiries ───────── */

const ENQUIRY_TONE: Record<EnquiryStatus, WorkspaceTone> = { new: "warning", in_progress: "info", qualified: "success", converted: "success", closed: "neutral" };

export function enquiryRow(e: LiveEnquiry): WorkspaceRow {
  const type = CATEGORY_LABEL[e.category];
  const status = ENQUIRY_STATUS_LABEL[e.status];
  return {
    id: e.id,
    title: e.topic || type,
    subtitle: e.email,
    bucket: status,
    status,
    tone: ENQUIRY_TONE[e.status],
    cells: { type, source: e.source === "website" ? "Website" : e.source, received: dayTimeLabel(e.receivedAt), owner: DASH },
    detail: {
      eyebrow: e.ref,
      metrics: [
        { label: "Enquiry type", value: type },
        { label: "Source", value: e.source === "website" ? "Website" : e.source },
        { label: "Received", value: dayLabel(e.receivedAt) },
        { label: "Stage", value: status },
      ],
      facts: [
        { label: "Contact", value: e.name },
        { label: "Email", value: e.email },
        { label: "Phone", value: e.phone ?? DASH },
        { label: "Organisation", value: e.organisation ?? DASH },
      ],
      description: e.message,
      secondaryTitle: "Enquiry details",
      secondaryFacts: [
        ...(e.artwork ? [{ label: "Artwork", value: e.artwork.title }] : []),
        ...(e.topic ? [{ label: "Topic", value: e.topic }] : []),
        ...Object.entries(e.details).filter(([, value]) => value).map(([key, value]) => ({ label: key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()), value })),
      ],
    },
  };
}

export function enquiriesConfig(enquiries: LiveEnquiry[]): WorkspaceConfig {
  const rows = enquiries.map(enquiryRow);
  const by = (s: EnquiryStatus) => enquiries.filter((e) => e.status === s).length;
  const open = enquiries.length - by("closed");
  const rate = enquiries.length ? `${Math.round((by("converted") / enquiries.length) * 100)}%` : DASH;
  return {
    ...enquiriesWorkspace,
    intelligenceLabel: "Enquiry intelligence (all time)",
    metrics: [
      metric("Total enquiries", enquiries.length, "Received through the website", "inbox"),
      metric("New enquiries", by("new"), "Waiting for a first response", "mail"),
      metric("Qualified", by("qualified"), "Worth following up", "trend"),
      metric("Converted", by("converted"), "Turned into work", "layers"),
      metric("Conversion rate", rate, "Converted out of all enquiries", "chart"),
      metric("Open enquiries", open, "Not yet closed", "clock"),
    ],
    tabs: [
      { label: "All Enquiries", bucket: "all", count: enquiries.length },
      ...STATUS_ORDER.map((s) => ({ label: ENQUIRY_STATUS_LABEL[s], bucket: ENQUIRY_STATUS_LABEL[s], count: by(s) })),
    ],
    filters: ["Enquiry type", "Status"],
    rows,
  };
}

/* ───────── bookings ───────── */

const BOOKING_GROUP: Record<BookingStatus, string> = {
  requested: "Requested", review: "Requested", quoted: "Requested", awaiting_deposit: "Requested", confirmed: "Confirmed", scheduled: "Confirmed",
  in_progress: "In Progress", editing: "In Progress", delivered: "In Progress", completed: "Completed", cancelled: "Cancelled", expired: "Cancelled",
};
const BOOKING_TONE: Record<BookingStatus, WorkspaceTone> = {
  requested: "warning", review: "warning", quoted: "info", awaiting_deposit: "info", confirmed: "success", scheduled: "success", in_progress: "info",
  editing: "info", delivered: "success", completed: "success", cancelled: "neutral", expired: "neutral",
};
const BOOKING_STEPS = ["Requested", "In review", "Confirmed", "In progress", "Delivered", "Completed"];
const BOOKING_STEP: Partial<Record<BookingStatus, number>> = { requested: 0, review: 1, quoted: 1, awaiting_deposit: 1, confirmed: 2, scheduled: 2, in_progress: 3, editing: 3, delivered: 4, completed: 5 };

export function bookingRow(b: LiveBooking): WorkspaceRow {
  const date = b.startAt ? dayLabel(b.startAt) : "Date to be agreed";
  const schedule = b.startAt && timeLabel(b.startAt) !== "00:00" ? `${timeLabel(b.startAt)}${b.endAt ? `–${timeLabel(b.endAt)}` : ""}` : DASH;
  const step = BOOKING_STEP[b.status];
  return {
    id: b.id,
    title: b.title,
    subtitle: b.ref,
    bucket: BOOKING_GROUP[b.status],
    status: BOOKING_STATUS_LABEL[b.status],
    tone: BOOKING_TONE[b.status],
    cells: { client: b.customer?.name ?? "Not visible to your role", type: b.serviceType ?? DASH, date, value: DASH, schedule },
    detail: {
      eyebrow: b.ref,
      metrics: [
        { label: "Booking value", value: DASH },
        { label: "Shoot date", value: date },
        { label: "Time", value: schedule },
        { label: "Stage", value: BOOKING_STATUS_LABEL[b.status] },
      ],
      facts: [
        { label: "Client", value: b.customer?.name ?? DASH },
        { label: "Email", value: b.customer?.email ?? DASH },
        { label: "Phone", value: b.customer?.phone ?? DASH },
        { label: "Place", value: b.location ?? DASH },
        { label: "Shoot type", value: b.serviceType ?? DASH },
      ],
      description: b.brief || undefined,
      secondaryTitle: "Notes",
      secondaryFacts: [
        { label: "Their budget", value: b.budgetNote ?? DASH },
        { label: "From enquiry", value: b.enquiryRef ?? DASH },
        { label: "Internal notes", value: b.notes || DASH },
      ],
      progress: step === undefined ? undefined : { current: step, steps: BOOKING_STEPS },
      callout: { title: "Price and deposit not set up", text: "Quotes and deposits arrive once the studio confirms its pricing. Nothing here records or takes money.", tone: "warning" },
    },
  };
}

export function bookingsConfig(bookings: LiveBooking[]): WorkspaceConfig {
  const rows = bookings.map(bookingRow);
  const group = (name: string) => rows.filter((r) => r.bucket === name).length;
  const upcoming = bookings.filter((b) => ["confirmed", "scheduled"].includes(b.status) && b.startAt && new Date(b.startAt).getTime() >= Date.now() - 86_400_000).length;
  return {
    ...bookingsWorkspace,
    intelligenceLabel: "Booking intelligence (from your records)",
    metrics: [
      metric("Total bookings", bookings.length, "All photography requests", "calendar"),
      metric("Requested", group("Requested"), "Waiting for review", "clock"),
      metric("Confirmed", group("Confirmed"), "Accepted by the studio", "circle-check"),
      metric("Upcoming shoots", upcoming, "Confirmed and still to come", "camera"),
      metric("In progress", group("In Progress"), "Shooting, editing or delivering", "layers"),
      metric("Completed", group("Completed"), "Finished", "star"),
    ],
    tabs: [
      { label: "All Bookings", bucket: "all", count: rows.length },
      { label: "Requested", bucket: "Requested", count: group("Requested") },
      { label: "Confirmed", bucket: "Confirmed", count: group("Confirmed") },
      { label: "In Progress", bucket: "In Progress", count: group("In Progress") },
      { label: "Completed", bucket: "Completed", count: group("Completed") },
      { label: "Cancelled", bucket: "Cancelled", count: group("Cancelled") },
    ],
    filters: ["Shoot type", "Status"],
    rows,
  };
}

export const BOOKING_STAGE_OPTIONS = MOVABLE.map((s) => BOOKING_STATUS_LABEL[s]);
export const bookingStatusFromLabel = (label: string): BookingStatus | undefined => MOVABLE.find((s) => BOOKING_STATUS_LABEL[s] === label);
export const ENQUIRY_STAGE_OPTIONS = STATUS_ORDER.map((s) => ENQUIRY_STATUS_LABEL[s]);
export const enquiryStatusFromLabel = (label: string): EnquiryStatus | undefined => STATUS_ORDER.find((s) => ENQUIRY_STATUS_LABEL[s] === label);

/* ───────── campaigns (drafts only: nothing can be sent yet) ───────── */

export function campaignRow(d: Draft, subscribers: Subscriber[]): WorkspaceRow {
  const status = d.archived ? "Archived" : "Draft";
  const size = audienceSize(subscribers, d.audience);
  return {
    id: d.id,
    title: d.name,
    subtitle: d.subject || "No subject yet",
    bucket: status,
    status,
    tone: "neutral",
    cells: { channel: "Email", audience: `${AUDIENCE_LABEL[d.audience]} (${size})`, sent: "0", open: DASH, click: DASH, conversions: DASH },
    detail: {
      eyebrow: "Draft",
      metrics: [
        { label: "Audience today", value: String(size) },
        { label: "Sent", value: "Not sent" },
        { label: "Last edited", value: dayLabel(d.updatedAt) },
        { label: "Channel", value: "Email" },
      ],
      facts: [
        { label: "Subject", value: d.subject || DASH },
        { label: "Preview text", value: d.previewText || DASH },
        { label: "Audience", value: AUDIENCE_LABEL[d.audience] },
      ],
      description: d.body || "No message yet.",
      secondaryTitle: "Message",
      callout: { title: "Sending is switched off", text: "It stays off until an email service is connected, the privacy notice is approved, and every message carries an unsubscribe link.", tone: "warning" },
    },
  };
}

export function campaignsConfig(drafts: Draft[], subscribers: Subscriber[]): WorkspaceConfig {
  const rows = drafts.map((d) => campaignRow(d, subscribers));
  const active = drafts.filter((d) => !d.archived).length;
  return {
    ...campaignsWorkspace,
    intelligenceLabel: "Campaigns (drafts only: nothing has been sent)",
    metrics: [
      metric("Total campaigns", drafts.length, "Drafts and archived", "layers"),
      metric("Drafts", active, "Waiting to be finished", "pencil"),
      metric("Newsletter subscribers", audienceSize(subscribers, "all_subscribers"), "Would receive a campaign", "megaphone"),
      metric("Subscribed and enquired", audienceSize(subscribers, "subscribed_enquirers"), "Subscribers who also enquired", "mail"),
      metric("Messages sent", 0, "Sending is switched off", "box"),
      metric("Open rate", DASH, "Needs sending and tracking", "image"),
    ],
    tabs: [
      { label: "All Campaigns", bucket: "all", count: drafts.length },
      { label: "Drafts", bucket: "Draft", count: active },
      { label: "Archived", bucket: "Archived", count: drafts.length - active },
    ],
    filters: ["Status"],
    rows,
  };
}

export const AUDIENCE_OPTIONS = (Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => AUDIENCE_LABEL[a]);
export const audienceFromLabel = (label: string): Audience => (Object.keys(AUDIENCE_LABEL) as Audience[]).find((a) => AUDIENCE_LABEL[a] === label) ?? "all_subscribers";
