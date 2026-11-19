"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { EditorialSelect } from "@/components/editorial-select";
import { cn } from "@/lib/utils";

/**
 * Prototype forms. They validate in the browser and show a confirmation, but nothing is sent
 * or stored yet: the Studio Desk enquiry inbox (phase 2) will receive these.
 */

function useFormState() {
  const [sent, setSent] = useState<string | null>(null);
  const submit = (message: string) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(message);
  };
  return { sent, submit, reset: () => setSent(null) };
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

function Sent({ title, body, onReset }: { title: string; body: string; onReset: () => void }) {
  return (
    <div role="status" className="border border-ink p-8">
      <p className="mb-3 text-[28px] leading-[1] font-bold tracking-[-0.07em]">{title}</p>
      <p className="max-w-[420px] text-[13px] leading-[1.7] text-[#444]">{body}</p>
      <p className="mt-5 text-[10px] tracking-[0.06em] text-ash uppercase">Preview only: no message was sent.</p>
      <button type="button" onClick={onReset} className="tlink mt-6">
        Send another ↗
      </button>
    </div>
  );
}

/** Private-enquiry form for Collector's Editions and series. */
export function CollectorEnquiryForm({ workTitle, id = "enquire" }: { workTitle: string; id?: string }) {
  const { sent, submit, reset } = useFormState();
  if (sent) return <Sent title="Thank you." body={sent} onReset={reset} />;

  return (
    <form id={id} onSubmit={submit(`We have your interest in ${workTitle}. The studio will reply personally with availability and the edition register.`)} className="space-y-6">
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
        <textarea id={`${id}-msg`} name="message" rows={3} className="field-box" defaultValue={`I would like to enquire about ${workTitle}.`} />
      </Field>
      <label className="flex items-start gap-3 text-[11px] leading-[1.6] text-[#555]">
        <input type="checkbox" required className="mt-0.5 size-3.5 accent-ink" />
        <span>I agree to be contacted about this enquiry. Marketing emails are separate, and only with your consent.</span>
      </label>
      <button type="submit" className="btn btn-dark w-full">
        Request availability <span>→</span>
      </button>
    </form>
  );
}

const TOPICS = ["Ordering a print", "Photoshoot", "A Collector's Edition", "Framing & finishing", "Shipping & delivery", "Something else"];

export function ContactForm() {
  const { sent, submit, reset } = useFormState();
  if (sent) return <Sent title="Message received." body={sent} onReset={reset} />;

  return (
    <form id="contact-form" onSubmit={submit("Thank you for writing. The studio will reply to you personally.")} className="space-y-7">
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
      <button type="submit" className="btn btn-dark w-full sm:w-auto sm:min-w-[260px]">
        Send message <span>→</span>
      </button>
    </form>
  );
}

const PROJECTS = ["Photoshoot", "Documentary", "Portraiture", "Brand & commercial", "Events", "Editorial", "Something else"];
const TIMELINES = ["As soon as possible", "Within 1–2 months", "Within 3–6 months", "Flexible / exploring"];

export function CommissionForm() {
  const { sent, submit, reset } = useFormState();
  const [type, setType] = useState(PROJECTS[0]);
  if (sent) return <Sent title="Brief received." body={sent} onReset={reset} />;

  return (
    <form
      id="commission-form"
      onSubmit={submit("Thank you. The studio reads every brief and replies personally to discuss scope, approach and availability.")}
      className="space-y-7"
    >
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
      <button type="submit" className="btn btn-dark w-full sm:w-auto sm:min-w-[260px]">
        Send brief <span>→</span>
      </button>
    </form>
  );
}
