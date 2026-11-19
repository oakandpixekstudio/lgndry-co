import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <PhasePlaceholder
      eyebrow="04 / PHOTOGRAPHY BOOKINGS"
      title={
        <>
          Every shoot, <em>considered.</em>
        </>
      }
      sub="Requests, quotes, deposits and confirmed shoots, with a real calendar."
      phase="Phase 5 (photography bookings)"
      delivers={[
      "Request, quote, deposit invoice, confirmed shoot, final-balance invoice",
      "Calendar with conflict detection: tentative requests never block a date",
      "Service packages, crew and resources"
    ]}
    />
  );
}
