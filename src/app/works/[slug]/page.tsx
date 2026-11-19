import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/components/product-view";
import { ServiceStrip } from "@/components/service-strip";
import { WorkCard } from "@/components/work-card";
import { WORKS, getWork, relatedWorks } from "@/lib/catalogue";

export function generateStaticParams() {
  return WORKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return {};
  return { title: work.title, description: `${work.title}: ${work.summary} ${work.story}` };
}

export default function WorkPage({ params }: PageProps<"/works/[slug]">) {
  // params are read inside the boundary so the page shell can render instantly on navigation.
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <WorkContent params={params} />
    </Suspense>
  );
}

async function WorkContent({ params }: Pick<PageProps<"/works/[slug]">, "params">) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  const related = relatedWorks(work);

  return (
    <>
      <ProductView work={work} />
      <section className="px-[var(--offset)] py-[100px]" aria-labelledby="related">
        <div className="mb-12 flex items-end justify-between gap-6">
          <h2 id="related" className="heading text-[clamp(32px,4vw,60px)]">
            You may also like
          </h2>
          <Link href="/shop" className="tlink">
            Shop all works ↗
          </Link>
        </div>
        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((w) => (
            <WorkCard key={w.slug} work={w} aspect="aspect-[4/5]" />
          ))}
        </div>
      </section>
      <ServiceStrip />
    </>
  );
}
