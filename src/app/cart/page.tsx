import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { CheckoutSteps } from "@/components/checkout-steps";
import { PageIntro } from "@/components/page-intro";
import { ServiceStrip } from "@/components/service-strip";
import { WorkCard } from "@/components/work-card";
import { getCatalogue } from "@/lib/catalogue-source";

export const metadata: Metadata = { title: "Your bag" };

export default async function CartPage() {
  const { works } = await getCatalogue();
  const suggestions = works.filter((w) => w.mode === "buy").slice(0, 3);
  return (
    <>
      <PageIntro crumbs={[{ label: "Home", href: "/" }, { label: "Bag" }]} title="YOUR BAG." size="md" />
      <CheckoutSteps current={1} />
      <section className="px-[var(--offset)] pb-[100px]">
        <CartView />
      </section>
      <section className="border-t border-line px-[var(--offset)] py-[90px]" aria-labelledby="also">
        <h2 id="also" className="heading mb-12 text-[clamp(32px,4vw,60px)]">
          You may also like
        </h2>
        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((w) => (
            <WorkCard key={w.slug} work={w} aspect="aspect-[4/5]" />
          ))}
        </div>
      </section>
      <ServiceStrip />
    </>
  );
}
