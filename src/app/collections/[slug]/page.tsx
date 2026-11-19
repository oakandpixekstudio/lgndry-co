import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/catalogue-browser";
import { PageIntro } from "@/components/page-intro";
import { OtherCollections } from "@/components/other-collections";
import { ServiceStrip } from "@/components/service-strip";
import { COLLECTIONS, getCollection, worksByCollection } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getCollection(slug);
  return c ? { title: c.title, description: c.intro } : {};
}

export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <CollectionContent params={params} />
    </Suspense>
  );
}

async function CollectionContent({ params }: Pick<PageProps<"/collections/[slug]">, "params">) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  if (collection.slug === "collectors-editions") redirect("/collectors-editions");

  const works = worksByCollection(collection.slug);

  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: collection.title }]}
        eyebrow={collection.kicker.toUpperCase()}
        title={collection.title.toUpperCase()}
        size="md"
        intro={collection.intro}
        aside={<p className="label text-ash">{collection.edition} · {collection.from}</p>}
      />

      <nav aria-label="Collections" className="mb-2 flex flex-wrap gap-2 px-[var(--offset)]">
        {COLLECTIONS.map((c) => (
          <Link key={c.slug} href={`/collections/${c.slug}`} aria-current={c.slug === collection.slug ? "page" : undefined} className={cn("chip", c.slug === collection.slug && "!border-ink !bg-ink !text-white")}>
            {c.title}
          </Link>
        ))}
      </nav>

      <section className="px-[var(--offset)] pt-10 pb-[140px]">
        <Suspense fallback={<div className="h-40 border-y border-ink" aria-busy="true" />}>
          <CatalogueBrowser collection={collection.slug} works={works} />
        </Suspense>
      </section>
      <OtherCollections exclude={collection.slug} />
      <ServiceStrip />
    </>
  );
}
