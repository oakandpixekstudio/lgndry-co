"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icons";

export interface CrudField {
  key: string;
  label: string;
  type?: "text" | "email" | "date" | "textarea";
  placeholder?: string;
}

export type CrudValues = Record<string, string>;

export function CrudRecordDialog({
  mode,
  entity,
  fields,
  initialValues,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  entity: string;
  fields: CrudField[];
  initialValues?: CrudValues;
  onClose: () => void;
  onSave: (values: CrudValues) => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<CrudValues>(() => Object.fromEntries(fields.map((field) => [field.key, initialValues?.[field.key] ?? ""])));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const singular = entity.endsWith("ies") ? `${entity.slice(0, -3)}y` : entity.endsWith("s") ? entity.slice(0, -1) : entity;

  return (
    <div className="crud-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="crud-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="crud-dialog-header">
          <div className="crud-dialog-index">{mode === "create" ? "NEW RECORD" : "EDIT RECORD"}</div>
          <h2 id={titleId}>{mode === "create" ? `Create ${singular}` : `Update ${singular}`}</h2>
          <p>{mode === "create" ? "Add a new record to this prototype workspace." : "Change the record details shown throughout this workspace."}</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={19} /></button>
        </header>
        <form className="crud-form" onSubmit={(event) => { event.preventDefault(); onSave(values); }}>
          <div className="crud-form-grid">
            {fields.map((field, index) => (
              <label key={field.key} className={field.type === "textarea" ? "crud-field-wide" : undefined}>
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea value={values[field.key] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : (
                  <input required={index === 0} type={field.type ?? "text"} value={values[field.key] ?? ""} placeholder={field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                )}
              </label>
            ))}
          </div>
          <footer className="crud-dialog-footer">
            <span>Prototype data · stored in this session only</span>
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button"><Icon name={mode === "create" ? "plus" : "check"} size={15} /> {mode === "create" ? "Create record" : "Save changes"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function DeleteConfirmDialog({ entityLabel, recordLabel, onCancel, onConfirm }: { entityLabel: string; recordLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="crud-scrim" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="crud-dialog crud-confirm" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="crud-confirm-icon"><Icon name="alert" size={26} /></div>
        <div className="crud-dialog-index">DELETE {entityLabel.toUpperCase()}</div>
        <h2 id={titleId}>Are you sure you want to delete this?</h2>
        <p><strong>{recordLabel}</strong> will be removed from this prototype workspace. This action cannot be undone in the current session.</p>
        <footer className="crud-dialog-footer">
          <button ref={cancelRef} type="button" className="button secondary" onClick={onCancel}>Keep record</button>
          <button type="button" className="button danger" onClick={onConfirm}><Icon name="trash" size={15} /> Delete record</button>
        </footer>
      </section>
    </div>
  );
}
