"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { WorkCard } from "@/components/work-card";
import { COLLECTIONS, WORKS, type Category, type CollectionSlug, type Work } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

type Sort = "featured" | "low" | "high" | "name";
const CATEGORIES: ("All" | Category)[] = ["All", "Landscape", "Documentary", "Movement", "Portraiture"];
const CATEGORY_LABEL: Record<string, string> = {
  All: "All works",
  Landscape: "Landscapes",
  Documentary: "Documentary",
  Movement: "Studies",
  Portraiture: "Portraits",
};

/**
 * Filterable catalogue. Pass `collection` to lock it to one collection (collection pages);
 * leave it out for the full shop, where the collection becomes a filter.
 */
export function CatalogueBrowser({ collection, works }: { collection?: CollectionSlug; works?: Work[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const [category, setCategory] = useState<"All" | Category>("All");
  const [coll, setColl] = useState<"all" | CollectionSlug>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [onlyBuyable, setOnlyBuyable] = useState(false);

  const base = works ?? WORKS;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = base.filter(
      (w) =>
        (category === "All" || w.category === category) &&
        (collection || coll === "all" || w.collection === coll) &&
        (!onlyBuyable || w.mode === "buy") &&
        (!q || `${w.title} ${w.category} ${w.summary} ${w.story} ${w.collection.replace("-", " ")}`.toLowerCase().includes(q)),
    );
    const priced = (w: Work) => w.price ?? Number.MAX_SAFE_INTEGER;
    if (sort === "low") out = [...out].sort((a, b) => priced(a) - priced(b));
    if (sort === "high") out = [...out].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "name") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    return out;
  }, [base, category, coll, collection, onlyBuyable, query, sort]);

  const reset = () => {
    setCategory("All");
    setColl("all");
    setOnlyBuyable(false);
    if (query) router.replace("/shop");
  };

  return (
    <div>
      {!collection && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Collection">
          {[{ slug: "all" as const, title: "Everything" }, ...COLLECTIONS].map((c) => (
            <button key={c.slug} className="chip" aria-pressed={coll === c.slug} onClick={() => setColl(c.slug)}>
              {c.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-5 border-y border-ink py-[19px]">
        <div className="flex flex-wrap gap-[clamp(14px,2vw,35px)]" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn("py-0.5 text-[11px] tracking-[0.03em] uppercase opacity-45 transition-opacity hover:opacity-100", category === c && "underline underline-offset-[6px] opacity-100")}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-[10px] tracking-[0.06em] uppercase">
            <input type="checkbox" checked={onlyBuyable} onChange={(e) => setOnlyBuyable(e.target.checked)} className="size-3.5 accent-ink" />
            Available to order
          </label>
          <label className="flex items-center gap-2 text-[10px] tracking-[0.06em] uppercase">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort artworks"
              className="max-w-[175px] border-0 bg-transparent text-[11px] uppercase outline-none"
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low–high</option>
              <option value="high">Price: high–low</option>
              <option value="name">A–Z</option>
            </select>
          </label>
        </div>
      </div>

      {query && (
        <p className="mt-6 text-[12px]">
          Results for <strong>&ldquo;{query}&rdquo;</strong> ·{" "}
          <button className="underline underline-offset-4" onClick={() => router.replace("/shop")}>
            Clear search
          </button>
        </p>
      )}

      <p className="mt-6 text-[10px] tracking-[0.07em] text-ash uppercase" aria-live="polite">
        {list.length} {list.length === 1 ? "work" : "works"}
      </p>

      {list.length ? (
        <div className="stagger">
          {list.map((w, i) => (
            <WorkCard key={w.slug} work={w} index={i} total={list.length} priority={i < 2} />
          ))}
        </div>
      ) : (
        <div className="px-5 py-[70px] text-center">
          <p className="text-[13px] tracking-[0.04em] uppercase">No artworks match your filters.</p>
          <button className="tlink mt-6" onClick={reset}>
            View all works ↗
          </button>
          <p className="mt-10 text-[12px] text-ash">
            Looking for something specific? <Link href="/contact" className="underline underline-offset-4">Ask the studio</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
