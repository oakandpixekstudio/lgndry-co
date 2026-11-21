"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { resetDemoCatalogue, saveSlot, useCatalogue } from "../store";
import type { MediaSlot } from "../types";
import { EditionsSubnav } from "./editions-subnav";

function SlotCard({ slot }: { slot: MediaSlot }) {
  const [draft, setDraft] = useState(slot);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(slot);
  const missingAlt = Boolean(draft.imageUrl) && !draft.altText.trim();

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, imageUrl: String(reader.result) }));
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <article className="cat-slot">
      <header>
        <div><span>{slot.page}</span><h3>{slot.label}</h3></div>
        <code>{slot.key}</code>
      </header>
      <button
        type="button"
        className="cat-focal cat-slot-preview"
        data-ratio={slot.ratio}
        disabled={!draft.imageUrl}
        aria-label={draft.imageUrl ? `Set the focal point for ${slot.label}` : `${slot.label} has no image`}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setDraft((current) => ({ ...current, focalX: Math.round(((event.clientX - box.left) / box.width) * 100), focalY: Math.round(((event.clientY - box.top) / box.height) * 100) }));
        }}
      >
        {draft.imageUrl ? (
          <>
            <Image src={draft.imageUrl} alt="" fill sizes="360px" unoptimized style={{ objectPosition: `${draft.focalX}% ${draft.focalY}%` }} />
            <i style={{ left: `${draft.focalX}%`, top: `${draft.focalY}%` }} />
          </>
        ) : <span><Icon name="image" size={22} /> No image</span>}
      </button>
      <p className="cat-hint">Shown at {slot.ratio}. {draft.imageUrl ? "Click the picture to keep the subject in frame." : "Add an image to fill this place."}</p>
      <label className={missingAlt ? "is-missing" : ""}>
        <span>Alt text</span>
        <input value={draft.altText} disabled={!draft.imageUrl} placeholder="Describe what is in the picture" onChange={(event) => setDraft((current) => ({ ...current, altText: event.target.value }))} />
      </label>
      <footer>
        <button type="button" className="button secondary" onClick={() => fileRef.current?.click()}><Icon name="plus" size={14} /> {draft.imageUrl ? "Replace" : "Add image"}</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => pick(event.target.files)} />
        {draft.imageUrl ? <button type="button" className="button secondary" onClick={() => setDraft((current) => ({ ...current, imageUrl: null, altText: "" }))}>Clear</button> : null}
        <span className="cat-spacer" />
        {dirty ? <button type="button" className="button secondary" onClick={() => setDraft(slot)}>Discard</button> : null}
        <button
          type="button"
          className="button"
          disabled={!dirty || missingAlt}
          title={missingAlt ? "Add alt text first" : undefined}
          onClick={() => { saveSlot(draft); setSaved(true); window.setTimeout(() => setSaved(false), 2200); }}
        >{saved ? "Saved" : "Save"}</button>
      </footer>
    </article>
  );
}

export function WebsiteImages() {
  const { slots } = useCatalogue();
  const pages = Array.from(new Set(slots.map((slot) => slot.page)));
  const empty = slots.filter((slot) => !slot.imageUrl).length;

  return (
    <div className="cat-page">
      <EditionsSubnav />
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Editions / Website images</span>
          <h1 className="workspace-title">Website images. <em>Every picture on the site.</em></h1>
          <p>Swap the hero, intro and page images without touching code. Each place on the site has a name, and the picture in it is yours to change.</p>
        </div>
      </header>
      <aside className="cat-notice" role="note">
        <strong>Demo images.</strong> Changes stay in this browser tab and do not reach the website. The placeholders are sample artwork, not the final photographs.
        <button type="button" onClick={resetDemoCatalogue}>Reset demo data</button>
      </aside>
      <section className="cat-stats" aria-label="Website images summary">
        <div><span>Places on the site</span><strong>{slots.length}</strong></div>
        <div><span>With an image</span><strong>{slots.length - empty}</strong></div>
        <div><span>Empty</span><strong>{empty}</strong></div>
        <div><span>Pages</span><strong>{pages.length}</strong></div>
      </section>
      <div className="cat-slots">
        {slots.map((slot) => <SlotCard key={`${slot.key}-${slot.altText}-${slot.imageUrl?.slice(-24)}-${slot.focalX}-${slot.focalY}`} slot={slot} />)}
      </div>
    </div>
  );
}
