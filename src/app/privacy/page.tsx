import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="What we collect, why we collect it, and how you stay in control."
      sections={[
        {
          title: "What we collect",
          body: ["Only what we need to process an order or answer an enquiry: your name, contact details, delivery address and the works you buy or ask about."],
        },
        {
          title: "How we use it",
          body: [
            "To fulfil orders, send order and delivery updates, and reply to your messages.",
            "We send marketing emails only if you have separately agreed to receive them, and you can withdraw at any time.",
          ],
        },
        {
          title: "Payments",
          body: ["Card payments are handled by our payment provider on a secure hosted page. We never see or store your card details."],
        },
        {
          title: "Your rights",
          body: ["You may ask to see, correct or delete the personal information we hold about you, in line with the Protection of Personal Information Act (POPIA). Contact us at the address on our contact page."],
        },
        {
          title: "Cookies & analytics",
          body: ["[To be confirmed once analytics are chosen.] We will list every cookie and tool here, and ask for consent where required."],
        },
      ]}
    />
  );
}
