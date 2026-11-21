import Link from "next/link";
import { Photo } from "@/components/photo";
import { imageUrl, type CollectionSlug } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/catalogue-source";

/** "Continue exploring": keeps short collection pages from ending in empty space. */
export async function OtherCollections({ exclude }: { exclude: CollectionSlug }) {
  const { collections, worksByCollection } = await getCatalogue();
  const others = collections.filter((c) => c.slug !== exclude);
  return (
    <section className="border-t border-line px-[var(--offset)] py-[90px]" aria-labelledby="keep-exploring">
      <div className="mb-12 flex items-end justify-between gap-6">
        <h2 id="keep-exploring" className="heading text-[clamp(32px,4vw,60px)]">
          Continue exploring.
        </h2>
        <Link href="/shop" className="tlink">
          All works ↗︎
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {others.map((c) => {
          const cover = worksByCollection(c.slug)[0];
          const href = c.slug === "collectors-editions" ? "/collectors-editions" : `/collections/${c.slug}`;
          return (
            <Link key={c.slug} href={href} className="group block">
              <div className="relative">
                {cover ? (
                  <Photo src={imageUrl(cover.image)} alt="" tone={cover.tone} focal={cover.focal} className="aspect-[4/3]" sizes="(max-width: 768px) 100vw, 33vw" />
                ) : (
                  <div className="aspect-[4/3] bg-[#d1d0cb]" aria-hidden="true" />
                )}
                <div className="absolute inset-0 z-[4] bg-gradient-to-t from-black/65 to-transparent transition-opacity duration-700 group-hover:from-black/80" />
                <div className="absolute inset-x-5 bottom-5 z-[5] text-white">
                  <p className="text-[10px] tracking-[0.12em] uppercase opacity-80">{c.kicker}</p>
                  <p className="mt-1 text-[clamp(22px,2.4vw,34px)] leading-none font-bold tracking-[-0.06em]">{c.title}</p>
                </div>
              </div>
              <div className="flex justify-between pt-3 text-[11px]">
                <span className="text-ash">{c.from}</span>
                <span className="underline-offset-4 group-hover:underline">Explore ↗︎</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
