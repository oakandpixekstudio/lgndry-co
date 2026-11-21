"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { EditorialSelect } from "@/components/editorial-select";
import { postJson } from "@/lib/post-json";
import { cn } from "@/lib/utils";

/**
 * The enquiry forms. Each one sends the visitor's message to the Studio Desk, where it appears in Enquiries.
 * Until the website is connected to the database the server answers honestly that it cannot take messages yet.
 */

type Build = (data: FormData) => Record<string, unknown>;

function useFormState() {
  const [sent, setSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // How long the form has been open: bots submit instantly. Read after the page loads, never while it is built.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const submit = (confirmation: string, build: Build) => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const data = new FormData(e.currentTarget);
    setError(null);
    setSending(true);
    const result = await postJson("/api/enquiries", { ...build(data), website: data.get("website") ?? "", startedAt: openedAt.current });
    setSending(false);
    if (!result.ok) return setError(result.message);
    setSent(confirmation);
  };
  return { sent, sending, error, submit, reset: () => setSent(null) };
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
    </div>
  );
}

/** A field people never see. Only automated form-fillers complete it. */
function Trap() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

function Failure({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="border border-[#b3261e] px-4 py-3 text-[12px] leading-[1.6] text-[#b3261e]">
      {message}
    </p>
  ) : null;
}

function Sent({ title, body, onReset }: { title: string; body: string; onReset: () => void }) {
  return (
    <div role="status" className="border border-ink p-8">
      <p className="mb-3 text-[28px] leading-[1] font-bold tracking-[-0.07em]">{title}</p>
      <p className="max-w-[420px] text-[13px] leading-[1.7] text-[#444]">{body}</p>
      <button type="button" onClick={onReset} className="tlink mt-6">
        Send another ↗︎
      </button>
    </div>
  );
}

const field = (data: FormData, name: string) => String(data.get(name) ?? "");

/** Private-enquiry form for Collector's Editions and series. */
export function CollectorEnquiryForm({ workTitle, workSlug, id = "enquire" }: { workTitle: string; workSlug?: string; id?: string }) {
  const { sent, sending, error, submit, reset } = useFormState();
  if (sent) return <Sent title="Thank you." body={sent} onReset={reset} />;

  return (
    <form
      id={id}
      onSubmit={submit(`We have your interest in ${workTitle}. The studio will reply personally with availability and the edition register.`, (d) => ({
        name: field(d, "name"), email: field(d, "email"), phone: field(d, "phone"), message: field(d, "message"),
        category: "availability", artworkSlug: workSlug, topic: workTitle,
      }))}
      className="relative space-y-6"
    >
      <Trap />
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" htmlFor={`${id}-name`}>
          <input id={`${id}-name`} name="name" required autoComplete="name" className="field" placeholder="Full name" />
        </Field>
        <Field label="Email address" htmlFor={`${id}-email`}>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" className="field" placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="Phone (optional)" htmlFor={`${id}-phone`}>
        <input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" className="field" placeholder="+27" />
      </Field>
      <Field label="Message" htmlFor={`${id}-msg`}>
        <textarea id={`${id}-msg`} name="message" rows={3} required className="field-box" defaultValue={`I would like to enquire about ${workTitle}.`} />
      </Field>
      <label className="flex items-start gap-3 text-[11px] leading-[1.6] text-[#555]">
        <input type="checkbox" required className="mt-0.5 size-3.5 accent-ink" />
        <span>I agree to be contacted about this enquiry. Marketing emails are separate, and only with your consent.</span>
      </label>
      <Failure message={error} />
      <button type="submit" className="btn btn-dark w-full" disabled={sending}>
        {sending ? "Sending…" : "Request availability"} <span>→</span>
      </button>
    </form>
  );
}

const TOPICS = ["Ordering a print", "Photoshoot", "A Collector's Edition", "Framing & finishing", "Shipping & delivery", "Something else"];
const topicCategory = (topic: string) => (topic === "Photoshoot" ? "photography" : topic === "A Collector's Edition" ? "availability" : "general");

export function ContactForm() {
  const { sent, sending, error, submit, reset } = useFormState();
  if (sent) return <Sent title="Message received." body={sent} onReset={reset} />;

  return (
    <form
      id="contact-form"
      onSubmit={submit("Thank you for writing. The studio will reply to you personally.", (d) => ({
        name: field(d, "name"), email: field(d, "email"), message: field(d, "message"),
        topic: field(d, "topic"), category: topicCategory(field(d, "topic")),
      }))}
      className="relative space-y-7"
    >
      <Trap />
      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name">
          <input id="c-name" name="name" required autoComplete="name" className="field" placeholder="Full name" />
        </Field>
        <Field label="Email address" htmlFor="c-email">
          <input id="c-email" name="email" type="email" required autoComplete="email" className="field" placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="What is this about?" htmlFor="c-topic">
        <EditorialSelect id="c-topic" name="topic" label="What is this about?" options={TOPICS} />
      </Field>
      <Field label="Message" htmlFor="c-msg">
        <textarea id="c-msg" name="message" rows={5} required className="field-box" placeholder="Tell us a little about what you are looking for." />
      </Field>
      <Failure message={error} />
      <button type="submit" className="btn btn-dark w-full sm:w-auto sm:min-w-[260px]" disabled={sending}>
        {sending ? "Sending…" : "Send message"} <span>→</span>
      </button>
    </form>
  );
}

const PROJECTS = ["Photoshoot", "Documentary", "Portraiture", "Brand & commercial", "Events", "Editorial", "Something else"];
const TIMELINES = ["As soon as possible", "Within 1–2 months", "Within 3–6 months", "Flexible / exploring"];

export function CommissionForm() {
  const { sent, sending, error, submit, reset } = useFormState();
  const [type, setType] = useState(PROJECTS[0]);
  if (sent) return <Sent title="Brief received." body={sent} onReset={reset} />;

  return (
    <form
      id="commission-form"
      onSubmit={submit("Thank you. The studio reads every brief and replies personally to discuss scope, approach and availability.", (d) => ({
        name: field(d, "name"), email: field(d, "email"), organisation: field(d, "organisation"), message: field(d, "details"),
        topic: field(d, "project"), category: "commission", details: { timeline: field(d, "timeline") },
      }))}
      className="relative space-y-7"
    >
      <Trap />
      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Your name" htmlFor="p-name">
          <input id="p-name" name="name" required autoComplete="name" className="field" placeholder="Full name" />
        </Field>
        <Field label="Email address" htmlFor="p-email">
          <input id="p-email" name="email" type="email" required autoComplete="email" className="field" placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="Organisation (optional)" htmlFor="p-org">
        <input id="p-org" name="organisation" autoComplete="organization" className="field" placeholder="Company or brand" />
      </Field>
      <fieldset>
        <legend className="field-label mb-3">Type of project</legend>
        <div className="flex flex-wrap gap-1.5">
          {PROJECTS.map((p) => (
            <button key={p} type="button" className={cn("chip")} aria-pressed={type === p} onClick={() => setType(p)}>
              {p}
            </button>
          ))}
        </div>
        <input type="hidden" name="project" value={type} />
      </fieldset>
      <Field label="Timeline" htmlFor="p-time">
        <EditorialSelect id="p-time" name="timeline" label="Timeline" options={TIMELINES} />
      </Field>
      <Field label="Tell us about the story" htmlFor="p-msg">
        <textarea id="p-msg" name="details" rows={6} required className="field-box" placeholder="What are you making, who is it for, and what should it feel like?" />
      </Field>
      <Failure message={error} />
      <button type="submit" className="btn btn-dark w-full sm:w-auto sm:min-w-[260px]" disabled={sending}>
        {sending ? "Sending…" : "Send brief"} <span>→</span>
      </button>
    </form>
  );
}
