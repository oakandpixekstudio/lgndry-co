"use client";

import { useMemo, useState } from "react";
import { createBooking, setBookingStatus, updateBooking, type LiveBooking, type PickCustomer } from "@/features/bookings/db";
import { saveDraft, setDraftArchived, type Draft, type Subscriber } from "@/features/campaigns/db";
import { createCustomer, setCustomerArchived, updateCustomer, type LiveCustomer } from "@/features/customers/db";
import { setEnquiryStatus, type LiveEnquiry } from "@/features/enquiries/db";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  AUDIENCE_OPTIONS, BOOKING_STAGE_OPTIONS, ENQUIRY_STAGE_OPTIONS, audienceFromLabel, bookingRow, bookingStatusFromLabel, campaignRow, customerRow, enquiryRow, enquiryStatusFromLabel,
} from "../live";
import type { LiveBinding, WorkspaceConfig, WorkspaceRow } from "../types";
import { WorkspacePage } from "./workspace-page";

const NOT_CONNECTED = "The studio is not connected to the database.";
const fact = (row: WorkspaceRow, label: string) => row.detail.facts.find((f) => f.label === label)?.value;

/** Opens the person's own mail program addressed to the record's contact. Nothing is sent from the studio. */
const mailTo = (subject?: string) => (row: WorkspaceRow) => {
  const email = fact(row, "Email");
  if (!email || email === "—") return "There is no email address on record for this person.";
  window.location.href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
};

function browser() {
  return createSupabaseBrowserClient();
}

const archiveCopy = (what: string, note: string) => ({
  menuLabel: `Archive ${what}`, confirmLabel: "archived", index: `ARCHIVE ${what.toUpperCase()}`, title: `Archive this ${what}?`, note, keep: `Keep ${what}`, button: `Archive ${what}`,
});

type Props =
  | { kind: "customers"; config: WorkspaceConfig; workspaceId: string; canEdit: boolean; customers: LiveCustomer[]; bookingCounts: Record<string, number> }
  | { kind: "enquiries"; config: WorkspaceConfig; workspaceId: string; canEdit: boolean; enquiries: LiveEnquiry[] }
  | { kind: "bookings"; config: WorkspaceConfig; workspaceId: string; canEdit: boolean; bookings: LiveBooking[]; people: PickCustomer[] }
  | { kind: "campaigns"; config: WorkspaceConfig; workspaceId: string; canEdit: boolean; drafts: Draft[]; subscribers: Subscriber[] };

/**
 * The designed workspace screen, connected to the real database. The screen itself is the same one the sample data
 * uses; this only supplies what saving, archiving and the action buttons do for each kind of record.
 */
export function LiveWorkspace(props: Props) {
  const { workspaceId, canEdit } = props;
  // The original records, kept so the edit window can show exact values (the screen's rows only hold display text).
  const [store] = useState(() => {
    const list = props.kind === "customers" ? props.customers : props.kind === "enquiries" ? props.enquiries : props.kind === "bookings" ? props.bookings : props.drafts;
    return new Map<string, unknown>(list.map((record) => [(record as { id: string }).id, record]));
  });

  const binding = useMemo<LiveBinding>(() => {
    const get = <T,>(id: string) => store.get(id) as T | undefined;
    const put = (id: string, record: unknown) => void store.set(id, record);

    if (props.kind === "customers") {
      const bookingCounts = props.bookingCounts;
      const binding: LiveBinding = {
        fields: () => [
          { key: "name", label: "Name" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone (optional)", placeholder: "+27 82 000 0000" },
          { key: "company", label: "Company (optional)" },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
        toValues: (row) => {
          const c = get<LiveCustomer>(row.id);
          return { name: c?.name ?? row.title, email: c?.email ?? "", phone: c?.phone ?? "", company: c?.company ?? "", notes: c?.notes ?? "" };
        },
        createNote: "Only the owner and studio managers can add customers.",
        create: canEdit ? async (v) => {
          const db = browser();
          if (!db) return { error: NOT_CONNECTED };
          const made = await createCustomer(db, workspaceId, { name: v.name ?? "", email: v.email ?? "", phone: v.phone ?? "", company: v.company ?? "", notes: v.notes ?? "" });
          if ("error" in made) return made;
          put(made.customer.id, made.customer);
          return { row: customerRow(made.customer, 0) };
        } : undefined,
        update: canEdit ? async (row, v) => {
          const db = browser();
          if (!db) return { error: NOT_CONNECTED };
          const saved = await updateCustomer(db, row.id, { name: v.name ?? "", email: v.email ?? "", phone: v.phone ?? "", company: v.company ?? "", notes: v.notes ?? "" });
          if ("error" in saved) return saved;
          put(row.id, saved.customer);
          return { row: customerRow(saved.customer, bookingCounts[row.id] ?? 0) };
        } : undefined,
        remove: canEdit ? {
          ...archiveCopy("customer", "will be archived. Their enquiries, bookings and history are kept, and they stop appearing in this list. Customers are never deleted."),
          run: async (row) => {
            const db = browser();
            return db ? setCustomerArchived(db, row.id, true) : NOT_CONNECTED;
          },
        } : undefined,
        actions: {
          "Message customer": mailTo(),
          "Create booking": "Add it from Bookings: choose New booking and pick this customer.",
        },
      };
      return binding;
    }

    if (props.kind === "enquiries") {
      const binding: LiveBinding = {
        fields: () => [{ key: "stage", label: "Stage", type: "select", options: ENQUIRY_STAGE_OPTIONS }],
        toValues: (row) => ({ stage: row.status }),
        createNote: "Enquiries arrive on their own from the website forms. They are not added by hand.",
        update: canEdit ? async (row, v) => {
          const next = enquiryStatusFromLabel(v.stage ?? "");
          const current = get<LiveEnquiry>(row.id);
          if (!next || !current) return { error: "Choose a stage." };
          const db = browser();
          if (!db) return { error: NOT_CONNECTED };
          const problem = await setEnquiryStatus(db, row.id, next);
          if (problem) return { error: problem };
          const updated = { ...current, status: next };
          put(row.id, updated);
          return { row: enquiryRow(updated) };
        } : undefined,
        actions: {
          Reply: mailTo(),
          "Create booking": "Add it from Bookings: choose New booking and start from this enquiry.",
          "Create order": "Online ordering has not opened yet.",
          "Add to campaign": "Campaigns cannot send yet, so there is nothing to add this person to.",
        },
      };
      return binding;
    }

    if (props.kind === "bookings") {
      const people = props.people;
      const label = (p: PickCustomer) => `${p.name}${p.email ? ` · ${p.email}` : ""}`;
      const binding: LiveBinding = {
        fields: (mode) => mode === "create"
          ? [
              { key: "customer", label: "Customer (add new people in Customers first)", type: "select", options: ["", ...people.map(label)] },
              { key: "title", label: "Title" },
              { key: "serviceType", label: "Shoot type (optional)" },
              { key: "location", label: "Place (optional)" },
              { key: "date", label: "Date (optional)", type: "date" },
              { key: "startTime", label: "Start time (for example 09:00)" },
              { key: "endTime", label: "End time (for example 13:00)" },
              { key: "budgetNote", label: "Budget they mentioned (optional)" },
              { key: "brief", label: "Brief", type: "textarea" },
            ]
          : [
              { key: "title", label: "Title" },
              { key: "serviceType", label: "Shoot type (optional)" },
              { key: "location", label: "Place (optional)" },
              { key: "stage", label: "Stage", type: "select", options: BOOKING_STAGE_OPTIONS },
              { key: "notes", label: "Internal notes", type: "textarea" },
            ],
        toValues: (row) => {
          const b = get<LiveBooking>(row.id);
          return { title: b?.title ?? row.title, serviceType: b?.serviceType ?? "", location: b?.location ?? "", stage: row.status, notes: b?.notes ?? "" };
        },
        createNote: "Only the owner and studio managers can add bookings.",
        create: canEdit ? async (v) => {
          const db = browser();
          if (!db) return { error: NOT_CONNECTED };
          const customerId = people.find((p) => label(p) === v.customer)?.id ?? "";
          const made = await createBooking(db, workspaceId, {
            customerId, enquiryId: null, title: v.title ?? "", serviceType: v.serviceType ?? "", date: v.date ?? "", startTime: v.startTime ?? "", endTime: v.endTime ?? "",
            location: v.location ?? "", brief: v.brief ?? "", budgetNote: v.budgetNote ?? "",
          });
          if ("error" in made) return made;
          put(made.booking.id, made.booking);
          return { row: bookingRow(made.booking) };
        } : undefined,
        update: canEdit ? async (row, v) => {
          const db = browser();
          if (!db) return { error: NOT_CONNECTED };
          const current = get<LiveBooking>(row.id);
          const saved = await updateBooking(db, row.id, {
            title: v.title ?? "", serviceType: v.serviceType ?? "", location: v.location ?? "", status: bookingStatusFromLabel(v.stage ?? "") ?? current?.status ?? "requested", notes: v.notes ?? "",
          });
          if ("error" in saved) return saved;
          put(row.id, saved.booking);
          return { row: bookingRow(saved.booking) };
        } : undefined,
        remove: canEdit ? {
          ...archiveCopy("booking", "will be marked as cancelled. It stays in the records and keeps its history. Bookings are never deleted."),
          menuLabel: "Cancel booking", confirmLabel: "cancelled", index: "CANCEL BOOKING", title: "Cancel this booking?", keep: "Keep booking", button: "Cancel booking",
          run: async (row) => {
            const db = browser();
            return db ? setBookingStatus(db, row.id, "cancelled") : NOT_CONNECTED;
          },
        } : undefined,
        actions: {
          "Edit booking": "Use the Edit button at the top of the record.",
          "Message client": mailTo(),
          "Manage deliverables": "Deliverables are not available yet.",
        },
      };
      return binding;
    }

    const subscribers = props.subscribers;
    const binding: LiveBinding = {
      fields: () => [
        { key: "name", label: "Name (only the team sees this)" },
        { key: "subject", label: "Subject line" },
        { key: "previewText", label: "Preview text" },
        { key: "audience", label: "Who it would go to", type: "select", options: AUDIENCE_OPTIONS },
        { key: "body", label: "Message", type: "textarea" },
      ],
      toValues: (row) => {
        const d = get<Draft>(row.id);
        return { name: d?.name ?? row.title, subject: d?.subject ?? "", previewText: d?.previewText ?? "", audience: AUDIENCE_OPTIONS[d?.audience === "subscribed_enquirers" ? 1 : 0]!, body: d?.body ?? "" };
      },
      createNote: "Only the owner and studio managers can write campaign drafts.",
      create: canEdit ? async (v) => {
        const db = browser();
        if (!db) return { error: NOT_CONNECTED };
        const made = await saveDraft(db, workspaceId, null, { name: v.name ?? "", subject: v.subject ?? "", previewText: v.previewText ?? "", body: v.body ?? "", audience: audienceFromLabel(v.audience ?? "") });
        if ("error" in made) return made;
        put(made.draft.id, made.draft);
        return { row: campaignRow(made.draft, subscribers) };
      } : undefined,
      update: canEdit ? async (row, v) => {
        const db = browser();
        if (!db) return { error: NOT_CONNECTED };
        const saved = await saveDraft(db, workspaceId, row.id, { name: v.name ?? "", subject: v.subject ?? "", previewText: v.previewText ?? "", body: v.body ?? "", audience: audienceFromLabel(v.audience ?? "") });
        if ("error" in saved) return saved;
        put(row.id, saved.draft);
        return { row: campaignRow(saved.draft, subscribers) };
      } : undefined,
      remove: canEdit ? {
        ...archiveCopy("draft", "will be archived. It is kept and can be restored from the database. Drafts are never deleted."),
        run: async (row) => {
          const db = browser();
          return db ? setDraftArchived(db, row.id, true) : NOT_CONNECTED;
        },
      } : undefined,
      actions: {
        "View report": "Reports appear once a campaign has been sent. Sending is switched off.",
        Duplicate: "Duplicating is not available yet. Create a new draft and paste the message in.",
        "Edit campaign": "Use the Edit button at the top of the record.",
        Resend: "Sending is switched off until an email service is connected.",
      },
    };
    return binding;
    // The inputs never change while the screen is open: a fresh page load brings fresh data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <WorkspacePage config={props.config} live={binding} />;
}
