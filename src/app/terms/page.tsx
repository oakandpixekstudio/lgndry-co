import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of sale" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of sale"
      intro="The straightforward terms behind every print we sell."
      sections={[
        {
          title: "Editions",
          body: [
            "Open editions are not numbered and are not limited in quantity. Limited editions and Collector's Editions are capped at the edition size shown, and each copy is individually numbered.",
            "Once an edition limit is published it will not be increased.",
          ],
        },
        {
          title: "Prices & payment",
          body: ["All prices are in South African rand (ZAR) and [include / exclude VAT: to be confirmed]. An order is accepted once payment has been verified."],
        },
        {
          title: "Copyright",
          body: ["Buying a print does not transfer copyright. All images remain the property of LGNDRY Content. Prints are for personal display and may not be reproduced without written permission."],
        },
        {
          title: "Certificate of authenticity",
          body: ["Limited and Collector's Editions are supplied with a numbered certificate. Keep it with the work: it records the edition number and supports future provenance."],
        },
        {
          title: "Governing law",
          body: ["These terms are governed by the laws of the Republic of South Africa."],
        },
      ]}
    />
  );
}
