"use client";

import { useMemo } from "react";
import { recordMessage, type Thread } from "@/features/inbox/db";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { dayLabel, dayTimeLabel } from "../live";
import { InboxWorkspace, type InboxBinding } from "./inbox-workspace";

/** The kinds of message the sample inbox sorts into categories, mapped from the real enquiry category. */
const CATEGORY: Record<string, string> = { availability: "Enquiry", commission: "Enquiry", photography: "Booking", general: "General" };

/** One row per message (a website enquiry, or something the team recorded), newest first, in the designed inbox's shape. */
export function inboxThreads(threads: Thread[]): InboxBinding["threads"] {
  const rows: InboxBinding["threads"] = [];
  for (const thread of threads) {
    for (const item of thread.items) {
      const fromForm = item.origin === "form";
      rows.push({
        id: `${item.origin}-${item.id}`,
        customerId: thread.customerId,
        sender: thread.name,
        email: thread.email,
        subject: item.subject || (item.direction === "out" ? "Sent to them" : item.direction === "note" ? "Team note" : "From them"),
        preview: item.body.replace(/\s+/g, " ").slice(0, 74),
        body: item.body,
        category: fromForm ? (CATEGORY[item.category ?? ""] ?? "Enquiry") : item.direction === "note" ? "General" : "Client support",
        date: dayLabel(item.at).slice(0, 6),
        at: dayTimeLabel(item.at),
        unread: fromForm && !item.handled,
        archived: fromForm && item.handled,
        _at: item.at,
      } as InboxBinding["threads"][number] & { _at: string });
    }
  }
  return rows.sort((a, b) => ((b as { _at?: string })._at ?? "").localeCompare((a as { _at?: string })._at ?? ""));
}

export function inboxMetrics(threads: Thread[]): InboxBinding["metrics"] {
  const items = threads.flatMap((t) => t.items);
  const forms = items.filter((i) => i.origin === "form");
  return [
    ["Total messages", String(items.length), "Enquiries and recorded entries", "mail"],
    ["Unread", String(forms.filter((i) => !i.handled).length), "Enquiries still open", "inbox"],
    ["Website enquiries", String(forms.length), "Sent through the website", "user"],
    ["Recorded entries", String(items.length - forms.length), "Written down by the team", "layers"],
    ["Photography", String(forms.filter((i) => i.category === "photography").length), "Photography enquiries", "calendar"],
    ["Needs reply", String(threads.filter((t) => t.needsReply).length), "Waiting for an answer", "clock"],
  ];
}

/** Neutral reply starters. They carry no prices, stock counts or promises: those are the studio's to write. */
const TEMPLATES: InboxBinding["templates"] = [
  { id: "enquiry", name: "Enquiry Response", icon: "file", body: "Hi {{first_name}},\n\nThank you for your enquiry. We have received it and will come back to you shortly.\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "quote", name: "Quote / Pricing", icon: "file", body: "Hi {{first_name}},\n\nThank you for your interest. Here are the details you asked for:\n\n\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "availability", name: "Edition Availability", icon: "file", body: "Hi {{first_name}},\n\nThank you for asking about availability. Here is where things stand:\n\n\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
  { id: "booking-information", name: "Booking Information", icon: "calendar", body: "Hi {{first_name}},\n\nThank you for your booking request. Here is what happens next:\n\n\n\nKind regards,\nLGNDRY.CO\nStudio Desk" },
];

export function LiveInbox({ threads, workspaceId }: { threads: Thread[]; workspaceId: string }) {
  const binding = useMemo<InboxBinding>(() => ({
    threads: inboxThreads(threads),
    metrics: inboxMetrics(threads),
    templates: TEMPLATES,
    record: async (thread, subject, body) => {
      if (!thread.customerId) return "Choose a conversation to reply to.";
      const db = createSupabaseBrowserClient();
      if (!db) return "The studio is not connected to the database.";
      const result = await recordMessage(db, workspaceId, { customerId: thread.customerId, kindId: "email-out", subject, body });
      return "error" in result ? result.error : null;
    },
    // The inputs never change while the screen is open: a fresh page load brings fresh data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  return <InboxWorkspace live={binding} />;
}
