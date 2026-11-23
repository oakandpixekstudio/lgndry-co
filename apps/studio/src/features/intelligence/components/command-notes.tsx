"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { CrudRecordDialog, DeleteConfirmDialog, type CrudValues } from "@/components/shared/crud-dialogs";
import type { IntelligenceSnapshot } from "../types";

const noteFields = [
  { key: "label", label: "Note label" },
  { key: "text", label: "Takeaway", type: "textarea" as const },
];

export function CommandNotes({ notes, readOnly = false }: { notes: IntelligenceSnapshot["notes"]; readOnly?: boolean }) {
  const [items, setItems] = useState([
    { id: "NOTE-01", label: "Growth", text: notes.growth },
    { id: "NOTE-02", label: "Opportunity", text: notes.opportunity },
    { id: "NOTE-03", label: "Next focus", text: notes.nextFocus },
  ]);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const nextNoteNumber = useRef(4);
  const active = items.find((item) => item.id === activeId);
  const deleting = items.find((item) => item.id === deleteId);

  const save = (values: CrudValues) => {
    if (mode === "edit" && active) {
      setItems((current) => current.map((item) => item.id === active.id ? { ...item, label: values.label ?? "Untitled note", text: values.text ?? "" } : item));
    } else {
      setItems((current) => [...current, { id: `NOTE-NEW-${nextNoteNumber.current++}`, label: values.label ?? "Untitled note", text: values.text ?? "" }]);
    }
    setMode(null);
    setActiveId(null);
  };

  return (
    <section className="command-notes" aria-labelledby="notes-title">
      <div>
        <div className="caps">Command notes</div>
        <div className="command-title" id="notes-title">Key takeaways.</div>
      </div>
      {items.map((item, index) => (
        <div key={item.id} className="command-note-item">
          <div className="caps" style={{ fontSize: 10.5 }}>{String(index + 1).padStart(2, "0")} / {item.label}</div>
          <p>{item.text}</p>
          {readOnly ? null : <div className="command-note-actions">
            <button type="button" aria-label={`Edit ${item.label}`} onClick={() => { setActiveId(item.id); setMode("edit"); }}><Icon name="pencil" size={13} /></button>
            <button type="button" aria-label={`Delete ${item.label}`} onClick={() => setDeleteId(item.id)}><Icon name="trash" size={13} /></button>
          </div>}
        </div>
      ))}
      <div className="command-cta">
        {readOnly ? null : <button type="button" className="button secondary" onClick={() => { setActiveId(null); setMode("create"); }}><Icon name="plus" size={14} /> New note</button>}
        <Link href="/insights" className="button">View full insights <Icon name="arrow" size={14} /></Link>
      </div>
      {mode ? <CrudRecordDialog mode={mode} entity="notes" fields={noteFields} initialValues={mode === "edit" && active ? { label: active.label, text: active.text } : undefined} onClose={() => { setMode(null); setActiveId(null); }} onSave={save} /> : null}
      {deleting ? <DeleteConfirmDialog entityLabel="note" recordLabel={deleting.label} onCancel={() => setDeleteId(null)} onConfirm={() => { setItems((current) => current.filter((item) => item.id !== deleting.id)); setDeleteId(null); }} /> : null}
    </section>
  );
}
