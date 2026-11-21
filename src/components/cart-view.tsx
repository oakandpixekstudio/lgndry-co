"use client";

import Link from "next/link";
import { QtyControls } from "@/components/site-header";
import { Photo } from "@/components/photo";
import { imageUrl, money } from "@/lib/catalogue";
import { useCatalogue } from "@/lib/catalogue-context";
import { useCart } from "@/lib/cart-store";

export function CartView() {
  const { lines, count, subtotal, lineTotal } = useCart();
  const { getWork } = useCatalogue();

  if (!lines.length) {
    return (
      <div className="border-t border-ink py-24">
        <h2 className="mb-5 max-w-[420px] text-[clamp(34px,4.4vw,64px)] leading-[1.04] font-bold tracking-[-0.08em]">Nothing here. Yet.</h2>
        <p className="mb-8 text-[13px] text-ash">Great things start by looking closer.</p>
        <Link href="/shop" className="btn btn-dark min-w-[260px]">
          View the collection <span>↗︎</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
      <ul className="border-t border-ink">
        {lines.map((l) => {
          const w = getWork(l.slug);
          if (!w) return null;
          return (
            <li key={l.key} className="grid grid-cols-[110px_1fr] gap-5 border-b border-line py-7 sm:grid-cols-[140px_1fr_auto]">
              <Link href={`/works/${w.slug}`}>
                <Photo plain src={imageUrl(w.image)} alt={w.imageAlt ?? w.title} tone={w.tone} focal={w.focal} className="aspect-[4/5]" sizes="140px" />
              </Link>
              <div>
                <Link href={`/works/${w.slug}`} className="text-[17px] font-semibold hover:underline">
                  {w.title}
                </Link>
                <p className="mt-2 text-[11px] tracking-[0.04em] text-[#666] uppercase">
                  {w.collection === "photographic-series" ? "Complete set" : `${l.size} / ${l.finish}`}
                </p>
                <QtyControls lineKey={l.key} qty={l.qty} />
              </div>
              <p className="col-span-2 text-[15px] sm:col-span-1 sm:text-right">{money(lineTotal(l))}</p>
            </li>
          );
        })}
      </ul>
      <aside className="h-fit border border-ink p-8 lg:sticky lg:top-28">
        <p className="micro mb-6">Order summary</p>
        <dl className="space-y-3 text-[13px]">
          <div className="flex justify-between">
            <dt>Subtotal ({count})</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ash">
            <dt>Shipping</dt>
            <dd>Calculated at checkout</dd>
          </div>
        </dl>
        <div className="mt-6 flex justify-between border-t border-ink pt-5 text-[15px] font-bold">
          <span>Total</span>
          <span>{money(subtotal)}</span>
        </div>
        <Link href="/checkout" className="btn btn-dark mt-7 w-full">
          Proceed to checkout <span>→</span>
        </Link>
        <Link href="/shop" className="tlink mt-5 inline-block">
          Continue shopping ↗︎
        </Link>
        <p className="mt-6 text-[10px] leading-[1.6] text-ash">Prototype: prices are illustrative. Tax, shipping and payment are not connected.</p>
      </aside>
    </div>
  );
}
