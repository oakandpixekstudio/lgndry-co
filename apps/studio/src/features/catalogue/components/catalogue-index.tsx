"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { formatZar } from "@/lib/format";
import { COLLECTIONS } from "../demo-catalogue";
import { fromPriceCents, publishIssues, slugify, statusLabel, statusTone } from "../rules";
import { nextSku, resetDemoCatalogue, saveArtwork, useCatalogue } from "../store";
import type { CatalogueArtwork, ReleaseStatus } from "../types";
import { EditionsSubnav } from "./editions-subnav";

const FILTERS: Array<{ id: "all" | ReleaseStatus | "attention"; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "scheduled", label: "Scheduled" },
  { id: "draft", label: "Drafts" },
  { id: "retired", label: "Retired" },
  { id: "attention", label: "Needs attention" },
];

function newArtwork(existing: CatalogueArtwork[]): CatalogueArtwork {
  const sku = nextSku(existing);
  const title = "Untitled work";
  let slug = slugify(title);
  for (let n = 2; existing.some((item) => item.slug === slug); n += 1) slug = `${slugify(title)}-${n}`;
  return {
    id: `art-${Date.now()}`, sku, slug, title, collectionSlug: null, category: "Landscape", summary: "", story: "",
    saleMode: "buy", editionKind: "open", availabilityNote: "", featured: false, showRemaining: false,
    releaseStatus: "draft", publishedAt: null, images: [], variants: [], editionRun: null,
  };
}

export function CatalogueIndex() {
  const router = useRouter();
  const { artworks } = useCatalogue();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => artworks.map((artwork) => ({ artwork, issues: publishIssues(artwork, artworks).filter((issue) => issue.blocking) })),
    [artworks],
  );
  const counts = {
    published: artworks.filter((a) => a.releaseStatus === "published").length,
    draft: artworks.filter((a) => a.releaseStatus === "draft").length,
    attention: rows.filter((r) => r.artwork.releaseStatus !== "retired" && r.issues.length > 0).length,
    variants: artworks.reduce((sum, a) => sum + a.variants.filter((v) => v.active).length, 0),
  };
  const visible = rows.filter(({ artwork, issues }) => {
    if (filter === "attention" ? issues.length === 0 || artwork.releaseStatus === "retired" : filter !== "all" && artwork.releaseStatus !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || `${artwork.title} ${artwork.sku} ${artwork.slug}`.toLowerCase().includes(q);
  });

  const create = () => {
    const artwork = newArtwork(artworks);
    saveArtwork(artwork);
    router.push(`/editions/catalogue/${artwork.slug}`);
  };

  return (
    <div className="cat-page">
      <EditionsSubnav />
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Editions / Catalogue</span>
          <h1 className="workspace-title">Catalogue. <em>What the website sells.</em></h1>
          <p>Every work, its images, sizes and prices. Publish here and the website follows.</p>
        </div>
        <button type="button" className="button workspace-primary-action" onClick={create}><Icon name="plus" size={15} /> New artwork</button>
      </header>

      <aside className="cat-notice" role="note">
        <strong>Demo catalogue.</strong> Changes stay in this browser tab and do not reach the website. Titles, prices and editions are placeholders,
        not approved figures.
        <button type="button" onClick={resetDemoCatalogue}>Reset demo data</button>
      </aside>

      <section className="cat-stats" aria-label="Catalogue summary">
        <div><span>Published</span><strong>{counts.published}</strong></div>
        <div><span>Drafts</span><strong>{counts.draft}</strong></div>
        <div><span>Need attention</span><strong>{counts.attention}</strong></div>
        <div><span>Active variants</span><strong>{counts.variants}</strong></div>
      </section>

      <div className="cat-toolbar">
        <div className="workspace-tabs" role="tablist" aria-label="Filter works">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
          ))}
        </div>
        <label className="workspace-search cat-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search works</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or SKU" />
        </label>
      </div>

      <div className="cat-table-wrap">
        <table className="cat-table">
          <thead>
            <tr><th>Work</th><th>Collection</th><th>Sold as</th><th>Edition</th><th className="right">From</th><th>Status</th><th aria-label="Open" /></tr>
          </thead>
          <tbody>
            {visible.map(({ artwork, issues }) => {
              const cover = artwork.images.find((image) => image.role === "cover");
              const from = fromPriceCents(artwork);
              return (
                <tr key={artwork.id} onClick={() => router.push(`/editions/catalogue/${artwork.slug}`)}>
                  <td>
                    <Link href={`/editions/catalogue/${artwork.slug}`} className="cat-cell" onClick={(event) => event.stopPropagation()}>
                      <span className="cat-thumb">{cover ? <Image src={cover.url} alt="" fill sizes="56px" unoptimized /> : <Icon name="image" size={18} />}</span>
                      <span><strong>{artwork.title}</strong><small>{artwork.sku} · /{artwork.slug}</small></span>
                    </Link>
                  </td>
                  <td>{COLLECTIONS.find((c) => c.slug === artwork.collectionSlug)?.title ?? <em className="cat-missing">None</em>}</td>
                  <td>{artwork.saleMode === "buy" ? "Buy online" : "Enquire"}</td>
                  <td>{artwork.editionKind === "open" ? "Open" : artwork.editionRun ? `Limited · ${artwork.editionRun.maxCopies}` : <em className="cat-missing">No run</em>}</td>
                  <td className="right tabnum">{from === null ? "On request" : formatZar(from)}</td>
                  <td>
                    <span className={`workspace-status tone-${statusTone[artwork.releaseStatus]}`}>{statusLabel[artwork.releaseStatus]}</span>
                    {issues.length > 0 && artwork.releaseStatus !== "retired" ? <small className="cat-issues">{issues.length} to fix</small> : null}
                  </td>
                  <td className="right"><Icon name="arrow" size={14} /></td>
                </tr>
              );
            })}
            {visible.length === 0 ? <tr><td colSpan={7} className="cat-empty">No works match this view.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
