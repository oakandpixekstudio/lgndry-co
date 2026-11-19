"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Photo } from "@/components/photo";
import { getWork, imageUrl, money } from "@/lib/catalogue";
import { lineTotal, useCart } from "@/lib/cart-store";

const SHIPPING = [
  { id: "courier", label: "Insured courier", note: "Tracked door-to-door. Cost confirmed once your address is verified." },
  { id: "collect", label: "Arrange collection", note: "Collect by appointment from the studio, Limpopo." },
];

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-ink pt-6">
      <legend className="sr-only">{title}</legend>
      <p className="micro mb-6">
        {n} / {title}
      </p>
      {children}
    </fieldset>
  );
}

function F({ id, label, className, ...props }: { id: string; label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} name={id} className="field" {...props} />
    </div>
  );
}

export function CheckoutView() {
  const { lines, count, subtotal } = useCart();
  const [ship, setShip] = useState("courier");
  const [done, setDone] = useState(false);

  if (!lines.length && !done) {
    return (
      <div className="border-t border-ink py-24">
        <h2 className="mb-5 text-[clamp(30px,4vw,56px)] leading-[1.04] font-bold tracking-[-0.08em]">Your bag is empty.</h2>
        <Link href="/shop" className="btn btn-dark min-w-[260px]">
          View the collection <span>↗︎</span>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div role="status" className="max-w-[640px] border border-ink p-10">
        <p className="mb-4 text-[clamp(30px,4vw,52px)] leading-none font-bold tracking-[-0.08em]">A good thing, collected.</p>
        <p className="text-[14px] leading-[1.75] text-[#444]">
          This walkthrough shows the purchasing experience. No order was placed, no details were sent, and no payment was taken.
        </p>
        <Link href="/shop" className="btn btn-line mt-8 min-w-[240px]">
          Back to the collection <span>↗︎</span>
        </Link>
      </div>
    );
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-12">
        <Section n="01" title="Contact">
          <div className="grid gap-6 sm:grid-cols-2">
            <F id="email" label="Email address" type="email" required autoComplete="email" placeholder="you@example.com" />
            <F id="phone" label="Phone" type="tel" required autoComplete="tel" placeholder="+27" />
          </div>
        </Section>

        <Section n="02" title="Delivery">
          <div className="grid gap-6 sm:grid-cols-2">
            <F id="first" label="First name" required autoComplete="given-name" />
            <F id="last" label="Last name" required autoComplete="family-name" />
            <F id="address" label="Street address" required autoComplete="street-address" className="sm:col-span-2" />
            <F id="city" label="City / town" required autoComplete="address-level2" />
            <F id="province" label="Province" required autoComplete="address-level1" />
            <F id="postal" label="Postal code" required autoComplete="postal-code" inputMode="numeric" />
            <F id="country" label="Country" defaultValue="South Africa" required autoComplete="country-name" />
          </div>
        </Section>

        <Section n="03" title="Shipping method">
          <div className="space-y-2.5" role="radiogroup" aria-label="Shipping method">
            {SHIPPING.map((s) => (
              <label key={s.id} className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${ship === s.id ? "border-ink bg-white/60" : "border-[#b8b8b5]"}`}>
                <input type="radio" name="shipping" value={s.id} checked={ship === s.id} onChange={() => setShip(s.id)} className="mt-1 accent-ink" />
                <span>
                  <span className="block text-[13px] font-semibold">{s.label}</span>
                  <span className="mt-1 block text-[12px] leading-[1.6] text-ash">{s.note}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        <Section n="04" title="Payment">
          <div className="border border-dashed border-[#b8b8b5] p-6 text-[13px] leading-[1.7] text-[#555]">
            <p className="mb-1 font-semibold text-ink">Secure payment, at launch.</p>
            Card payments will be handled by a South African payment gateway on a secure hosted page. LGNDRY.Co never sees or stores card details. This step is not connected in the prototype.
          </div>
        </Section>

        <button type="submit" className="btn btn-dark w-full sm:w-auto sm:min-w-[320px]">
          Place order (preview) <span>→</span>
        </button>
      </div>

      <aside className="h-fit border border-ink p-8 lg:sticky lg:top-28">
        <p className="micro mb-6">Your order ({count})</p>
        <ul className="divide-y divide-line">
          {lines.map((l) => {
            const w = getWork(l.slug);
            if (!w) return null;
            return (
              <li key={l.key} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 py-4">
                <Photo plain src={imageUrl(w.image)} alt={w.title} tone={w.tone} focal={w.focal} className="aspect-[4/5]" sizes="64px" />
                <div>
                  <p className="text-[13px] font-semibold">{w.title}</p>
                  <p className="text-[10px] tracking-[0.04em] text-ash uppercase">
                    {w.collection === "photographic-series" ? "Set" : `${l.size} / ${l.finish}`} × {l.qty}
                  </p>
                </div>
                <p className="text-[12px]">{money(lineTotal(l))}</p>
              </li>
            );
          })}
        </ul>
        <dl className="mt-4 space-y-3 border-t border-line pt-5 text-[13px]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ash">
            <dt>Shipping</dt>
            <dd>{ship === "collect" ? "By arrangement" : "To be confirmed"}</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-between border-t border-ink pt-5 text-[15px] font-bold">
          <span>Total</span>
          <span>{money(subtotal)}</span>
        </div>
        <p className="mt-5 text-[10px] leading-[1.6] text-ash">Prototype: no order is placed and no data leaves your browser.</p>
      </aside>
    </form>
  );
}
