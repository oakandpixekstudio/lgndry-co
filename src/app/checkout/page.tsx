import type { Metadata } from "next";
import { CheckoutSteps } from "@/components/checkout-steps";
import { CheckoutView } from "@/components/checkout-view";
import { PageIntro } from "@/components/page-intro";
import { ServiceStrip } from "@/components/service-strip";

export const metadata: Metadata = { title: "Checkout (preview)", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Home", href: "/" }, { label: "Bag", href: "/cart" }, { label: "Checkout" }]} title="CHECKOUT." size="md" />
      <CheckoutSteps current={2} />
      <section className="px-[var(--offset)] pb-[100px]">
        <CheckoutView />
      </section>
      <ServiceStrip />
    </>
  );
}
