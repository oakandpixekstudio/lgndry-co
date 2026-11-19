"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [note, setNote] = useState("Occasional dispatches. No noise. (Preview only.)");
  const [email, setEmail] = useState("");

  return (
    <form
      className="w-full self-end md:max-w-[400px] md:justify-self-end"
      onSubmit={(e) => {
        e.preventDefault();
        setNote("Preview only. No email has been saved.");
        setEmail("");
      }}
    >
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
        <button type="submit" aria-label="Preview newsletter signup" className="p-3 text-xl">
          →
        </button>
      </div>
      <p className="mt-2 min-h-6 text-[10px] leading-normal text-[#777]" role="status">
        {note}
      </p>
    </form>
  );
}
