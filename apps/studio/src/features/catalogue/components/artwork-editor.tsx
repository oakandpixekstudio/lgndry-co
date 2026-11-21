"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { DeleteConfirmDialog } from "@/components/shared/crud-dialogs";
import { formatZar } from "@/lib/format";
import { CATEGORIES, COLLECTIONS, FRAME_SUGGESTIONS, SIZE_SUGGESTIONS } from "../demo-catalogue";
import { centsToRand, fromPriceCents, isValidSlug, publishIssues, randToCents, slugify, statusLabel, statusTone, type IssueSection } from "../rules";
import { deleteArtwork, saveArtwork, useCatalogue } from "../store";
import type { CatalogueArtwork, CatalogueImage, CatalogueVariant, ImageRole, ReleaseStatus } from "../types";
import { EditionsSubnav } from "./editions-subnav";

const ROLE_LABEL: Record<ImageRole, string> = { cover: "Cover", gallery: "Gallery", detail: "Detail", room_view: "Room view" };
const STATUSES: ReleaseStatus[] = ["draft", "scheduled", "published", "retired"];
const MAX_IMAGES = 12;

const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);
const nowIso = () => new Date().toISOString();
const tomorrowIso = () => {
  const date = new Date(Date.now() + 86_400_000);
  date.setUTCHours(8, 0, 0, 0);
  return date.toISOString();
};
const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

/** Click the picture to say where the subject is. The website keeps that point in frame at every crop. */
function FocalPicker({ image, onChange }: { image: CatalogueImage; onChange: (x: number, y: number) => void }) {
  return (
    <button
      type="button"
      className="cat-focal"
      aria-label={`Set focal point for ${image.name}. Currently ${Math.round(image.focalX)} percent across, ${Math.round(image.focalY)} percent down`}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        onChange(Math.round(((event.clientX - box.left) / box.width) * 100), Math.round(((event.clientY - box.top) / box.height) * 100));
      }}
    >
      <Image src={image.url} alt="" fill sizes="240px" unoptimized style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} />
      <i style={{ left: `${image.focalX}%`, top: `${image.focalY}%` }} />
    </button>
  );
}

function Editor({ stored }: { stored: CatalogueArtwork }) {
  const router = useRouter();
  const { artworks } = useCatalogue();
  const [draft, setDraft] = useState<CatalogueArtwork>(stored);
  const [slugTouched, setSlugTouched] = useState(stored.slug !== "untitled-work" && !stored.slug.startsWith("untitled-work"));
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(stored);
  const issues = useMemo(() => publishIssues(draft, artworks), [draft, artworks]);
  const blocking = issues.filter((issue) => issue.blocking);
  const set = (patch: Partial<CatalogueArtwork>) => setDraft((current) => ({ ...current, ...patch }));
  const toast = (title: string, text: string) => setNotice({ title, text });

  /* ───── details ───── */
  const setTitle = (title: string) => set({ title, ...(slugTouched ? {} : { slug: slugify(title) }) });

  /* ───── images ───── */
  const patchImage = (id: string, patch: Partial<CatalogueImage>) =>
    setDraft((current) => ({ ...current, images: current.images.map((image) => (image.id === id ? { ...image, ...patch } : image)) }));
  const setRole = (id: string, role: ImageRole) =>
    setDraft((current) => ({
      ...current,
      // exactly one cover: choosing a new cover demotes the old one
      images: current.images.map((image) => (image.id === id ? { ...image, role } : role === "cover" && image.role === "cover" ? { ...image, role: "gallery" } : image)),
    }));
  const moveImage = (id: string, direction: -1 | 1) =>
    setDraft((current) => {
      const index = current.images.findIndex((image) => image.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.images.length) return current;
      const images = [...current.images];
      [images[index], images[target]] = [images[target]!, images[index]!];
      return { ...current, images };
    });
  const removeImage = (id: string) => setDraft((current) => ({ ...current, images: current.images.filter((image) => image.id !== id) }));
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - draft.images.length;
    const picked = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, Math.max(room, 0));
    const read = await Promise.all(picked.map((file) => new Promise<{ name: string; url: string }>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, url: String(reader.result) });
      reader.readAsDataURL(file);
    })));
    setDraft((current) => {
      const hasCover = current.images.some((image) => image.role === "cover");
      const added: CatalogueImage[] = read.map((file, index) => ({
        id: `img-${Date.now()}-${index}`, name: file.name, url: file.url, role: !hasCover && index === 0 ? "cover" : "gallery",
        altText: "", focalX: 50, focalY: 50,
      }));
      return { ...current, images: [...current.images, ...added] };
    });
    if (fileRef.current) fileRef.current.value = "";
    toast("Images added", "Demo only: real uploads keep a private print master and publish web-sized copies.");
  };

  /* ───── variants ───── */
  const patchVariant = (id: string, patch: Partial<CatalogueVariant>) =>
    setDraft((current) => ({ ...current, variants: current.variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)) }));
  const addVariant = () =>
    setDraft((current) => {
      const n = current.variants.length + 1;
      return { ...current, variants: [...current.variants, { id: `var-${Date.now()}`, sku: `${current.sku}-V${n}`, sizeLabel: "", frameOption: "Unframed", priceCents: null, active: true }] };
    });
  const removeVariant = (id: string) => setDraft((current) => ({ ...current, variants: current.variants.filter((variant) => variant.id !== id) }));
  const setEditionKind = (editionKind: CatalogueArtwork["editionKind"]) =>
    set({ editionKind, editionRun: editionKind === "limited" ? (draft.editionRun ?? { runCode: "R1", maxCopies: 0, lowStockThreshold: 3 }) : null, ...(editionKind === "open" ? { showRemaining: false } : {}) });

  /* ───── status and saving ───── */
  const changeStatus = (status: ReleaseStatus) => {
    if ((status === "published" || status === "scheduled") && blocking.length) {
      toast("Not ready to publish", `Fix ${blocking.length} item${blocking.length === 1 ? "" : "s"} in the checklist first.`);
      return;
    }
    set({
      releaseStatus: status,
      publishedAt: status === "published" ? (draft.releaseStatus === "published" ? draft.publishedAt : nowIso()) : status === "scheduled" ? (draft.publishedAt ?? tomorrowIso()) : draft.publishedAt,
    });
  };
  const save = () => {
    if (draft.releaseStatus === "published" && blocking.length) {
      toast("Cannot save a published work with gaps", "Fix the checklist, or set it back to Draft first.");
      return;
    }
    saveArtwork(draft);
    toast("Saved in this demo session", "Nothing has been sent to the website.");
    if (draft.slug !== stored.slug) router.replace(`/editions/catalogue/${draft.slug}`);
  };
  const discard = () => {
    setDraft(stored);
    setSlugTouched(true);
  };
  const jump = (section: IssueSection) => document.getElementById(`cat-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const cover = draft.images.find((image) => image.role === "cover");
  const from = fromPriceCents(draft);

  return (
    <div className="cat-page cat-editor">
      <EditionsSubnav />
      <nav className="record-breadcrumb"><Link href="/editions/catalogue"><Icon name="arrow-left" size={14} /> Back to Catalogue</Link><span>/</span><b>{draft.sku}</b></nav>

      <header className="cat-editor-head">
        <span className="cat-thumb cat-thumb-lg">{cover ? <Image src={cover.url} alt="" fill sizes="96px" unoptimized /> : <Icon name="image" size={26} />}</span>
        <div>
          <span className="eyebrow">{draft.sku} · /{draft.slug}</span>
          <h1 className="workspace-title cat-editor-title">{draft.title || "Untitled work"}</h1>
          <p><span className={`workspace-status tone-${statusTone[draft.releaseStatus]}`}>{statusLabel[draft.releaseStatus]}</span>
            {from !== null ? <> &nbsp;From <b className="tabnum">{formatZar(from)}</b></> : null}</p>
        </div>
        <div className="cat-actions">
          <button type="button" className="button secondary" disabled={!dirty} onClick={discard}>Discard</button>
          <button type="button" className="button" disabled={!dirty} onClick={save}>{dirty ? "Save changes" : "Saved"}</button>
        </div>
      </header>

      <div className="cat-grid">
        <div className="cat-main">
          {/* ───── Details ───── */}
          <section className="cat-card" id="cat-details" aria-labelledby="cat-details-title">
            <header><span>01</span><h2 id="cat-details-title">Details</h2></header>
            <div className="cat-fields">
              <label className="wide"><span>Title</span><input value={draft.title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label>
                <span>Web address</span>
                <div className="cat-slug"><i>/works/</i><input value={draft.slug} aria-invalid={!isValidSlug(draft.slug)} onChange={(event) => { setSlugTouched(true); set({ slug: event.target.value.toLowerCase() }); }} /></div>
              </label>
              <label><span>SKU</span><input value={draft.sku} readOnly /></label>
              <label>
                <span>Collection</span>
                <select value={draft.collectionSlug ?? ""} onChange={(event) => set({ collectionSlug: event.target.value || null })}>
                  <option value="">Choose a collection</option>
                  {COLLECTIONS.map((collection) => <option key={collection.slug} value={collection.slug}>{collection.title}</option>)}
                </select>
              </label>
              <label>
                <span>Category</span>
                <select value={draft.category} onChange={(event) => set({ category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>
              </label>
              <label className="wide"><span>One-line summary <small>{draft.summary.length}/140</small></span><input maxLength={140} value={draft.summary} onChange={(event) => set({ summary: event.target.value })} /></label>
              <label className="wide"><span>The story <small>{draft.story.length} characters</small></span><textarea rows={5} value={draft.story} onChange={(event) => set({ story: event.target.value })} /></label>
              <fieldset className="wide cat-segment">
                <legend>How it is sold</legend>
                <div role="radiogroup" aria-label="How it is sold">
                  {(["buy", "enquire"] as const).map((mode) => (
                    <button key={mode} type="button" role="radio" aria-checked={draft.saleMode === mode} onClick={() => set({ saleMode: mode })}>{mode === "buy" ? "Buy online" : "Enquire first"}</button>
                  ))}
                </div>
                <p>{draft.saleMode === "buy" ? "Visitors choose a size and finish and check out." : "Visitors send an enquiry. The studio replies with availability and the edition register."}</p>
              </fieldset>
              {draft.saleMode === "enquire" ? (
                <label className="wide"><span>Availability note shown to visitors</span><input value={draft.availabilityNote} onChange={(event) => set({ availabilityNote: event.target.value })} /></label>
              ) : null}
              <label className="cat-check wide"><input type="checkbox" checked={draft.featured} onChange={(event) => set({ featured: event.target.checked })} /><span>Feature on the home page</span></label>
            </div>
          </section>

          {/* ───── Images ───── */}
          <section className="cat-card" id="cat-images" aria-labelledby="cat-images-title">
            <header>
              <span>02</span><h2 id="cat-images-title">Images</h2>
              <button type="button" className="button secondary" onClick={() => fileRef.current?.click()} disabled={draft.images.length >= MAX_IMAGES}><Icon name="plus" size={14} /> Add images</button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(event) => void addFiles(event.target.files)} />
            </header>
            <p className="cat-hint">The print-resolution original stays private. Visitors only ever see web-sized copies. Every image needs alt text for people who cannot see it.</p>
            {draft.images.length === 0 ? <div className="cat-empty-box">No images yet. A work needs a cover image before it can be published.</div> : (
              <div className="cat-images">
                {draft.images.map((image, index) => (
                  <article key={image.id} className={image.role === "cover" ? "is-cover" : ""}>
                    <FocalPicker image={image} onChange={(focalX, focalY) => patchImage(image.id, { focalX, focalY })} />
                    <div className="cat-image-fields">
                      <label><span>Role</span>
                        <select value={image.role} onChange={(event) => setRole(image.id, event.target.value as ImageRole)}>
                          {(Object.keys(ROLE_LABEL) as ImageRole[]).map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
                        </select>
                      </label>
                      <label className={image.altText.trim() ? "" : "is-missing"}><span>Alt text</span>
                        <input value={image.altText} placeholder="Describe what is in the picture" onChange={(event) => patchImage(image.id, { altText: event.target.value })} />
                      </label>
                      <small>Click the picture to set the focal point ({image.focalX}%, {image.focalY}%).</small>
                    </div>
                    <footer>
                      <button type="button" disabled={index === 0} onClick={() => moveImage(image.id, -1)} aria-label={`Move ${image.name} earlier`}>←</button>
                      <button type="button" disabled={index === draft.images.length - 1} onClick={() => moveImage(image.id, 1)} aria-label={`Move ${image.name} later`}>→</button>
                      <button type="button" className="remove" onClick={() => removeImage(image.id)} aria-label={`Remove ${image.name}`}><Icon name="trash" size={13} /></button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ───── Edition and variants ───── */}
          <section className="cat-card" id="cat-variants" aria-labelledby="cat-variants-title">
            <header><span>03</span><h2 id="cat-variants-title">Edition and prices</h2></header>
            <fieldset className="cat-segment">
              <legend>Edition</legend>
              <div role="radiogroup" aria-label="Edition type">
                {(["open", "limited"] as const).map((kind) => (
                  <button key={kind} type="button" role="radio" aria-checked={draft.editionKind === kind} onClick={() => setEditionKind(kind)}>{kind === "open" ? "Open edition" : "Limited edition"}</button>
                ))}
              </div>
              <p>{draft.editionKind === "open" ? "Printed to order and never capped." : "A fixed number of numbered copies. Numbers are only assigned after verified payment."}</p>
            </fieldset>
            {draft.editionKind === "limited" ? (
              <div className="cat-fields cat-run">
                <label><span>Run code</span><input value={draft.editionRun?.runCode ?? ""} onChange={(event) => set({ editionRun: { ...(draft.editionRun ?? { maxCopies: 0, lowStockThreshold: 3 }), runCode: event.target.value.toUpperCase() } })} /></label>
                <label><span>Number of copies</span><input inputMode="numeric" value={draft.editionRun?.maxCopies ? String(draft.editionRun.maxCopies) : ""} onChange={(event) => set({ editionRun: { ...(draft.editionRun ?? { runCode: "R1", lowStockThreshold: 3 }), maxCopies: Number(event.target.value.replace(/\D/g, "")) || 0 } })} /></label>
                <label><span>Low-stock warning at</span><input inputMode="numeric" value={String(draft.editionRun?.lowStockThreshold ?? 3)} onChange={(event) => set({ editionRun: { ...(draft.editionRun ?? { runCode: "R1", maxCopies: 0 }), lowStockThreshold: Number(event.target.value.replace(/\D/g, "")) || 0 } })} /></label>
                <label className="cat-check"><input type="checkbox" checked={draft.showRemaining} onChange={(event) => set({ showRemaining: event.target.checked })} /><span>Show &ldquo;copies remaining&rdquo; on the website</span></label>
                <p className="cat-hint wide">Off by default until the owner approves showing stock counts. All sizes share this run until that decision is made.</p>
              </div>
            ) : null}

            <div className="cat-variants-head"><h3>Sizes and prices</h3><button type="button" className="button secondary" onClick={addVariant}><Icon name="plus" size={14} /> Add size</button></div>
            <div className="cat-variants">
              <div className="cat-variant-row head"><span>Size</span><span>Finish</span><span>Price (R)</span><span>On sale</span><span /></div>
              {draft.variants.map((variant) => (
                <div className="cat-variant-row" key={variant.id}>
                  <input aria-label="Size" list="cat-sizes" value={variant.sizeLabel} placeholder="A3" onChange={(event) => patchVariant(variant.id, { sizeLabel: event.target.value })} />
                  <input aria-label="Finish" list="cat-frames" value={variant.frameOption} onChange={(event) => patchVariant(variant.id, { frameOption: event.target.value })} />
                  <input aria-label="Price in rand" inputMode="numeric" placeholder="On request" value={centsToRand(variant.priceCents)} onChange={(event) => patchVariant(variant.id, { priceCents: randToCents(event.target.value) })} />
                  <label className="cat-switch"><input type="checkbox" checked={variant.active} onChange={(event) => patchVariant(variant.id, { active: event.target.checked })} /><span className="sr-only">Offer {variant.sizeLabel || "this size"} for sale</span><i /></label>
                  <button type="button" className="remove" onClick={() => removeVariant(variant.id)} aria-label={`Remove ${variant.sizeLabel || "size"}`}><Icon name="trash" size={13} /></button>
                </div>
              ))}
              {draft.variants.length === 0 ? <div className="cat-empty-box">No sizes yet. Add at least one priced size to sell this work online.</div> : null}
              <datalist id="cat-sizes">{SIZE_SUGGESTIONS.map((size) => <option key={size} value={size} />)}</datalist>
              <datalist id="cat-frames">{FRAME_SUGGESTIONS.map((frame) => <option key={frame} value={frame} />)}</datalist>
            </div>
            <p className="cat-hint">Prices are whole rand and stored as cents. The website never sets its own prices: checkout always uses the figures saved here.</p>
          </section>
        </div>

        {/* ───── Publish readiness ───── */}
        <aside className="cat-aside" aria-label="Publishing">
          <section className="cat-card cat-publish">
            <header><h2>Status</h2></header>
            <div className="cat-status-buttons" role="radiogroup" aria-label="Release status">
              {STATUSES.map((status) => (
                <button key={status} type="button" role="radio" aria-checked={draft.releaseStatus === status} onClick={() => changeStatus(status)}>{statusLabel[status]}</button>
              ))}
            </div>
            {draft.releaseStatus === "scheduled" ? (
              <label className="cat-schedule"><span>Goes live (UTC)</span>
                <input type="datetime-local" value={toLocalInput(draft.publishedAt)} onChange={(event) => set({ publishedAt: event.target.value ? new Date(`${event.target.value}:00Z`).toISOString() : null })} />
              </label>
            ) : null}
            <h3>Ready to publish?</h3>
            {issues.length === 0 ? <p className="cat-ready"><Icon name="circle-check" size={16} /> Everything is in place.</p> : (
              <ul className="cat-checklist">
                {issues.map((issue) => (
                  <li key={issue.id} className={issue.blocking ? "is-blocking" : "is-advice"}>
                    <button type="button" onClick={() => jump(issue.section)}><Icon name={issue.blocking ? "alert" : "clock"} size={14} /> {issue.label}</button>
                  </li>
                ))}
              </ul>
            )}
            {blocking.length === 0 && draft.releaseStatus !== "published" ? <button type="button" className="button cat-publish-btn" onClick={() => changeStatus("published")}>Publish now</button> : null}
            {draft.releaseStatus === "draft" ? <button type="button" className="cat-delete" onClick={() => setConfirmDelete(true)}><Icon name="trash" size={14} /> Delete draft</button> : null}
          </section>
          <p className="cat-hint">Published works appear on the website once the database is connected. In this demo nothing is sent.</p>
        </aside>
      </div>

      {confirmDelete ? (
        <DeleteConfirmDialog entityLabel="artwork" recordLabel={draft.title || "this draft"} onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { deleteArtwork(draft.id); router.push("/editions/catalogue"); }} />
      ) : null}
      {notice ? <div className="demo-toast" role="status"><strong>{notice.title}</strong><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div> : null}
    </div>
  );
}

export function ArtworkEditor({ slug }: { slug: string }) {
  const { artworks } = useCatalogue();
  const hydrated = useHydrated();
  // After a rename the address changes a moment after the store does; remember which work this page is about.
  const [knownId, setKnownId] = useState<string | null>(null);
  const bySlug = artworks.find((artwork) => artwork.slug === slug);
  if (bySlug && bySlug.id !== knownId) setKnownId(bySlug.id);
  const stored = bySlug ?? artworks.find((artwork) => artwork.id === knownId);
  if (!stored) {
    return (
      <div className="cat-page">
        <EditionsSubnav />
        <div className="cat-empty-box">{hydrated ? <>This work was not found in the demo catalogue. <Link href="/editions/catalogue">Back to Catalogue</Link></> : "Loading…"}</div>
      </div>
    );
  }
  return <Editor key={stored.id} stored={stored} />;
}
