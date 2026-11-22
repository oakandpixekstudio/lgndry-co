"use client";

import { useState } from "react";

interface Report { count: number; bytes: number; originals: number; strays: number; sample: Array<{ name: string; kind: string; bytes: number }> }

const size = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * Finds picture files nothing uses any more (replaced images, abandoned uploads) and, only when the owner confirms,
 * removes them. Checking changes nothing. Files younger than a day are never touched.
 */
export function StorageTidy() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const call = async (method: "GET" | "POST") => {
    const response = await fetch("/api/assets/cleanup", { method, headers: { "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify({ confirm: true }) : undefined });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Something went wrong.");
    return data;
  };

  const check = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    setConfirming(false);
    try {
      setReport((await call("GET")) as unknown as Report);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The check failed.");
    }
    setBusy(false);
  };

  const tidy = async () => {
    setBusy(true);
    setError(null);
    try {
      const done = (await call("POST")) as { deleted: number; bytes: number };
      setMessage(`Removed ${done.deleted} unused file${done.deleted === 1 ? "" : "s"} and freed ${size(done.bytes)}.`);
      setReport(null);
      setConfirming(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The tidy-up failed.");
    }
    setBusy(false);
  };

  return (
    <section className="cat-card tidy" aria-label="Unused files">
      <header><div><span className="eyebrow">Housekeeping</span><h2>Unused picture files</h2></div></header>
      <p className="cust-muted">When a picture is replaced or an upload is abandoned, the old file stays in storage. This finds files no work or website place uses and, if you confirm, removes them. Files from the last 24 hours are never touched, and checking changes nothing. Only the studio owner can run it.</p>
      {error ? <p className="cat-error" role="alert">{error}</p> : null}
      {message ? <p className="tidy-ok" role="status">{message}</p> : null}
      {report ? (
        report.count === 0 ? <p className="cust-muted">Nothing to tidy. Every stored picture is in use.</p> : (
          <>
            <p><strong>{report.count} file{report.count === 1 ? "" : "s"}</strong> ({size(report.bytes)}) can be removed: {report.originals} unused original{report.originals === 1 ? "" : "s"} with their web copies, and {report.strays} stray upload{report.strays === 1 ? "" : "s"}.</p>
            {report.sample.length ? <ul className="tidy-list">{report.sample.map((file) => <li key={file.name}><span>{file.name}</span><small>{file.kind} · {size(file.bytes)}</small></li>)}</ul> : null}
          </>
        )
      ) : null}
      <div className="enq-actions">
        <button type="button" className="button secondary" disabled={busy} onClick={() => void check()}>{busy && !confirming ? "Checking…" : "Check for unused files"}</button>
        {report && report.count > 0 ? (
          confirming
            ? <button type="button" className="button" disabled={busy} onClick={() => void tidy()}>{busy ? "Removing…" : `Yes, permanently remove ${report.count}`}</button>
            : <button type="button" className="button" disabled={busy} onClick={() => setConfirming(true)}>Remove them…</button>
        ) : null}
      </div>
      {confirming ? <p className="cust-muted">This cannot be undone. The originals will be gone for good.</p> : null}
    </section>
  );
}
