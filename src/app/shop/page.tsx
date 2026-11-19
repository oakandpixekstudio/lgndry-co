import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/catalogue-browser";
import { PageIntro } from "@/components/page-intro";
import { ServiceStrip } from "@/components/service-strip";

export const metadata: Metadata = {
  title: "Shop all works",
  description: "Browse every LGNDRY.Co photographic print: open editions, individual works, series and Collector's Editions.",
};

export default function ShopPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
        eyebrow="THE OBJECTS"
        title={
          <>
            <span className="block">ALL</span>
            <span className="block pl-[3%] md:pl-[19%]">WORKS.</span>
          </>
        }
        intro="Photography worth living with. Choose a size and finish, or enquire about our rarest editions."
      />
      <section className="px-[var(--offset)] pb-[140px]">
        <Suspense fallback={<div className="h-40 border-y border-ink" aria-busy="true" />}>
          <CatalogueBrowser />
        </Suspense>
      </section>
      <ServiceStrip />
    </>
  );
}
