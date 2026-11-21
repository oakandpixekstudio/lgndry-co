"use client";

import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/post-json";

const INVITE = "Occasional dispatches. No noise.";

export function NewsletterForm() {
  const [note, setNote] = useState(INVITE);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  return (
    <form
      className="relative w-full self-end md:max-w-[400px] md:justify-self-end"
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending) return;
        const data = new FormData(e.currentTarget);
        setSending(true);
        const result = await postJson("/api/newsletter", { email, website: data.get("website") ?? "", startedAt: openedAt.current });
        setSending(false);
        setFailed(!result.ok);
        if (result.ok) {
          setNote("Thank you. You are on the list.");
          setEmail("");
        } else {
          setNote(result.message);
        }
      }}
    >
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <label htmlFor="newsletter-email" className="label mb-5 block">
        Notes from the studio / sign up
      </label>
      <div className="flex items-center border-b border-ink">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="min-w-0 flex-1 border-none bg-transparent py-[13px] text-[15px] outline-none"
        />
        <button type="submit" aria-label="Sign up to the newsletter" disabled={sending} className="p-3 text-xl">
          →
        </button>
      </div>
      <p className={`mt-2 min-h-6 text-[10px] leading-normal ${failed ? "text-[#b3261e]" : "text-[#777]"}`} role="status">
        {note}
      </p>
    </form>
  );
}
