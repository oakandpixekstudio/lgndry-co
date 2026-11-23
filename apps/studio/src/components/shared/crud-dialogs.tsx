"use client";

import { animateDialogClose } from "@/lib/dialog-motion";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icons";

export interface CrudField {
  key: string;
  label: string;
  type?: "text" | "email" | "date" | "textarea" | "select";
  placeholder?: string;
  /** For type "select": the choices. */
  options?: string[];
}

export type CrudValues = Record<string, string>;
export interface CrudImage { id: string; name: string; url: string; role: "main" | "supporting" }
export interface CrudMedia { images: CrudImage[] }

export function CrudRecordDialog({
  mode,
  entity,
  fields,
  initialValues,
  initialImages = [],
  supportsMedia = false,
  live = false,
  error = null,
  busy = false,
  onClose,
  onSave,
}: {
  /** Saving to the real database (not the sample session): changes the wording, and shows why a save failed. */
  live?: boolean;
  error?: string | null;
  busy?: boolean;
  mode: "create" | "edit";
  entity: string;
  fields: CrudField[];
  initialValues?: CrudValues;
  onClose: () => void;
  initialImages?: CrudImage[];
  supportsMedia?: boolean;
  onSave: (values: CrudValues, media?: CrudMedia) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => animateDialogClose(scrimRef.current, onClose), [onClose]);
  const [values, setValues] = useState<CrudValues>(() => Object.fromEntries(fields.map((field) => [field.key, initialValues?.[field.key] ?? ""])));
  const [images, setImages] = useState<CrudImage[]>(() => initialImages);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const singular = entity.endsWith("ies") ? `${entity.slice(0, -3)}y` : entity.endsWith("s") ? entity.slice(0, -1) : entity;

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const additions = await Promise.all(Array.from(files).map((file, index) => new Promise<CrudImage>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ id: `upload-${Date.now()}-${index}`, name: file.name, url: String(reader.result), role: images.length === 0 && index === 0 ? "main" : "supporting" });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    setImages((current) => [...current, ...additions]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const setMainImage = (id: string) => setImages((current) => current.map((image) => ({ ...image, role: image.id === id ? "main" : "supporting" })));
  const moveImage = (id: string, direction: -1 | 1) => setImages((current) => {
    const index = current.findIndex((image) => image.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next;
  });
  const removeImage = (id: string) => setImages((current) => {
    const removingMain = current.find((image) => image.id === id)?.role === "main";
    const next = current.filter((image) => image.id !== id);
    if (removingMain && next[0]) next[0] = { ...next[0], role: "main" };
    return next;
  });

  return (
    <div className="crud-scrim" ref={scrimRef} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="crud-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="crud-dialog-header">
          <div className="crud-dialog-index">{mode === "create" ? "NEW RECORD" : "EDIT RECORD"}</div>
          <h2 id={titleId}>{mode === "create" ? `Create ${singular}` : `Update ${singular}`}</h2>
          <p>{live ? "This is saved to the studio database." : mode === "create" ? "Add a new record to this prototype workspace." : "Change the record details shown throughout this workspace."}</p>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close dialog"><Icon name="close" size={19} /></button>
        </header>
        <form className="crud-form" onSubmit={(event) => { event.preventDefault(); onSave(values, { images }); }}>
          <div className="crud-form-grid">
            {fields.map((field, index) => (
              <label key={field.key} className={field.type === "textarea" ? "crud-field-wide" : undefined}>
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select value={values[field.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}>
                    {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea value={values[field.key] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : (
                  <input required={index === 0} type={field.type ?? "text"} value={values[field.key] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                )}
              </label>
            ))}
          </div>
          {supportsMedia ? <section className="crud-media" aria-labelledby={`${titleId}-media`}>
            <header><div><span>IMAGE SERIES</span><h3 id={`${titleId}-media`}>Main & supporting images</h3><p>Upload multiple images for this record. Choose one main image; the rest form the supporting series.</p></div><button type="button" className="button secondary" onClick={() => fileRef.current?.click()}><Icon name="image" size={15}/> Add images</button></header>
            <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(event) => void addImages(event.target.files)} />
            {images.length ? <div className="crud-media-grid">{images.map((image, index) => <article key={image.id} className={image.role === "main" ? "is-main" : ""}>
              <div><Image src={image.url} alt={image.name} fill sizes="180px" unoptimized/></div>
              <span><b>{image.role === "main" ? "MAIN IMAGE" : `SUPPORTING ${String(index).padStart(2,"0")}`}</b><strong>{image.name}</strong></span>
              <footer><button type="button" disabled={image.role === "main"} onClick={() => setMainImage(image.id)}>Set as main</button><button type="button" disabled={index === 0} onClick={() => moveImage(image.id, -1)} aria-label={`Move ${image.name} left`}>←</button><button type="button" disabled={index === images.length - 1} onClick={() => moveImage(image.id, 1)} aria-label={`Move ${image.name} right`}>→</button><button type="button" className="remove" onClick={() => removeImage(image.id)} aria-label={`Remove ${image.name}`}><Icon name="trash" size={13}/></button></footer>
            </article>)}</div> : <button type="button" className="crud-media-empty" onClick={() => fileRef.current?.click()}><Icon name="image" size={28}/><strong>Upload the record image series</strong><span>PNG, JPG, WebP or AVIF · select more than one file</span></button>}
          </section> : null}
          <footer className="crud-dialog-footer">
            <span>{error ? <b role="alert">{error}</b> : live ? "Saved to the studio database" : "Prototype data · stored in this session only"}</span>
            <button type="button" className="button secondary" onClick={close}>Cancel</button>
            <button type="submit" className="button" disabled={busy}><Icon name={mode === "create" ? "plus" : "check"} size={15} /> {busy ? "Saving…" : mode === "create" ? "Create record" : "Save changes"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function DeleteConfirmDialog({ entityLabel, recordLabel, onCancel, onConfirm, copy }: {
  entityLabel: string;
  recordLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Wording for records that are archived or cancelled, never deleted. Leave out for a real delete. */
  copy?: { index: string; title: string; note: string; keep: string; button: string };
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const cancel = useCallback(() => animateDialogClose(scrimRef.current, onCancel), [onCancel]);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && cancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancel]);

  return (
    <div className="crud-scrim" ref={scrimRef} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && cancel()}>
      <section className="crud-dialog crud-confirm" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="crud-confirm-icon"><Icon name="alert" size={26} /></div>
        <div className="crud-dialog-index">{copy?.index ?? `DELETE ${entityLabel.toUpperCase()}`}</div>
        <h2 id={titleId}>{copy?.title ?? "Are you sure you want to delete this?"}</h2>
        <p><strong>{recordLabel}</strong> {copy?.note ?? "will be removed. This action cannot be undone."}</p>
        <footer className="crud-dialog-footer">
          <button ref={cancelRef} type="button" className="button secondary" onClick={cancel}>{copy?.keep ?? "Keep record"}</button>
          <button type="button" className="button danger" onClick={onConfirm}><Icon name="trash" size={15} /> {copy?.button ?? "Delete record"}</button>
        </footer>
      </section>
    </div>
  );
}
