import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Shipping & returns" };

export default function ShippingReturnsPage() {
  return (
    <LegalPage
      title="Shipping & returns"
      intro="How your print travels to you, and what happens if something is not right."
      sections={[
        {
          title: "Production",
          body: [
            "Open editions are printed to order. Limited and Collector's Editions are produced, quality-checked and finished before dispatch.",
            "Typical production time is [to be confirmed] working days, depending on size and finish. Framed works may take longer.",
          ],
        },
        {
          title: "Delivery",
          body: [
            "Every work is packed carefully and dispatched with a tracking number. Delivery within South Africa is by [courier to be confirmed]. International delivery is available on request.",
            "Delivery costs are calculated from your address and confirmed at checkout. Delivery time is [to be confirmed] working days after dispatch.",
          ],
        },
        {
          title: "Inspect on arrival",
          body: ["Please check your work as soon as it arrives. If anything is damaged in transit, contact us within [to be confirmed] days with photographs and we will arrange a replacement or refund."],
        },
        {
          title: "Returns",
          body: [
            "Made-to-order and framed works are produced specifically for you, so [return conditions to be confirmed]. Faulty or damaged works are always replaced or refunded.",
            "Your statutory consumer rights under South African law are not affected.",
          ],
        },
      ]}
    />
  );
}
