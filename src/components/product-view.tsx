"use client";

import Link from "next/link";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/page-intro";
import { Photo } from "@/components/photo";
import { CollectorEnquiryForm } from "@/components/enquiry-forms";
import { addToCart } from "@/lib/cart-store";
import {
  FINISHES,
  SIZES,
  editionLabel,
  getCollection,
  imageUrl,
  money,
  unitPrice,
  type FinishKey,
  type SizeKey,
  type Work,
} from "@/lib/catalogue";
import { notify, setBagOpen } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

const SIZE_HEIGHT_MM: Record<SizeKey, number> = { A3: 420, A2: 594, A1: 841 };
const FRAME_COLOUR: Record<FinishKey, string | null> = { Unframed: null, "Black frame": "#141414", "Natural frame": "#b88a58" };

export function ProductView({ work }: { work: Work }) {
  const [size, setSize] = useState<SizeKey>("A3");
  const [finish, setFinish] = useState<FinishKey>("Unframed");
  const collection = getCollection(work.collection)!;
  const isSeries = work.collection === "photographic-series";
  const isBuy = work.mode === "buy";
  const price = unitPrice(work, size, finish);

  const add = () => {
    addToCart(work.slug, size, finish);
    setBagOpen(true);
    notify("Added to bag");
  };

  return (
    <div className="grid lg:grid-cols-[1.12fr_1fr]">
      {/* ───────── Gallery ───────── */}
      <div className="bg-[#d1d0cb]">
        <div className="grid min-h-[78vh] place-items-center px-[7%] pt-[150px] pb-[7%] lg:min-h-screen">
          <Photo
            src={imageUrl(work.image)}
            alt={`${work.title}: ${work.summary}`}
            tone={work.tone}
            focal={work.focal}
            priority
            sizes="(max-width: 1024px) 90vw, 55vw"
            className="aspect-[4/5] w-[min(560px,88%)] shadow-[0_0_0_14px_#f8f8f5]"
          />
        </div>

        <RoomView work={work} size={size} finish={finish} />

        <div className="grid place-items-center px-[7%] py-[8%]">
          <figure className="w-[min(560px,100%)]">
            <div className="aspect-[4/3] overflow-hidden">
              <Photo
                src={imageUrl(work.image)}
                alt=""
                tone={work.tone}
                focal={work.focal ? work.focal.replace(/^\d+%/, "72%") : "72% 35%"}
                sizes="45vw"
                className="h-full w-full scale-[2.1]"
              />
            </div>
            <figcaption className="label mt-4 text-[#555]">Detail / tone, grain and paper</figcaption>
          </figure>
        </div>
      </div>

      {/* ───────── Purchase panel ───────── */}
      <div className="px-[clamp(24px,5vw,95px)] pt-10 pb-32 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:pt-[150px] lg:pb-16">
        <Breadcrumbs
          className="mb-10"
          items={[
            { label: "Home", href: "/" },
            { label: collection.title, href: `/collections/${collection.slug}` },
            { label: work.title },
          ]}
        />
        <p className="micro mb-4 text-ash">
          {collection.title} / {work.category}
        </p>
        <h1 className="heading mb-5 text-[clamp(44px,5vw,85px)] leading-[0.92]">{work.title}</h1>
        <p className="mb-6 max-w-[430px] text-[14px] leading-[1.75] text-[#555]">{work.story}</p>

        <div className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-4 text-[11px]">
          <span className="font-semibold tracking-[0.06em] uppercase">{editionLabel(work)}</span>
          <span className="text-ash">
            {work.edition.kind === "open" ? "Printed to order" : "Numbered & certified"}
          </span>
        </div>

        <p className="mb-8 text-[26px] tracking-[-0.03em]" aria-live="polite">
          {isBuy && price !== null ? (
            money(price)
          ) : work.price !== null ? (
            <>
              {money(work.price)} <span className="text-[13px] tracking-normal text-ash">complete set · indicative</span>
            </>
          ) : (
            <span className="text-[18px] tracking-normal">Price on request</span>
          )}
        </p>

        {isBuy ? (
          <>
            <fieldset className="mb-6">
              <legend className="mb-3 block text-[11px] font-bold">01 / SELECT A SIZE</legend>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SIZES) as SizeKey[]).map((s) => (
                  <button key={s} className={cn("chip text-left")} aria-pressed={size === s} onClick={() => setSize(s)}>
                    <span className="block font-semibold">{SIZES[s].label}</span>
                    <span className="block text-[9px] opacity-70">{SIZES[s].dims}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-8">
              <legend className="mb-3 block text-[11px] font-bold">02 / SELECT A FINISH</legend>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(FINISHES) as FinishKey[]).map((f) => (
                  <button key={f} className="chip text-left" aria-pressed={finish === f} onClick={() => setFinish(f)}>
                    <span className="block font-semibold uppercase">{FINISHES[f].label}</span>
                    <span className="block text-[9px] opacity-70">{FINISHES[f].surcharge ? `+ ${money(FINISHES[f].surcharge)}` : "Included"}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-ash">{FINISHES[finish].note}</p>
            </fieldset>

            <button className="btn btn-dark hidden w-full lg:flex" onClick={add}>
              ADD TO BAG <span>↗</span>
            </button>
            <p className="mt-4 text-[11px] leading-[1.6] text-ash">
              Questions about size, framing or shipping? <Link href="/contact" className="underline underline-offset-4">Ask the studio</Link>.
            </p>

            {/* Mobile sticky bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur lg:hidden">
              <div>
                <p className="text-[11px] font-semibold">{work.title}</p>
                <p className="text-[12px]">
                  {price !== null && money(price)} · {size} · {finish}
                </p>
              </div>
              <button className="btn btn-dark min-h-[46px] gap-4" onClick={add}>
                ADD <span>↗</span>
              </button>
            </div>
          </>
        ) : (
          <div className="mb-2">
            <h2 className="mb-2 text-[22px] font-bold tracking-[-0.06em]">{isSeries ? "Reserve this series" : "Enquire about this edition"}</h2>
            <p className="mb-6 text-[12px] leading-[1.65] text-ash">{work.availabilityNote}</p>
            <CollectorEnquiryForm workTitle={work.title} />
          </div>
        )}

        <Accordion defaultValue={["details"]} className="mt-10 border-t border-ink">
          <Item value="details" title="Details & specification">
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2.5 text-[12px] leading-[1.55]">
              <dt className="text-ash">Medium</dt>
              <dd>Archival pigment print on fine-art paper</dd>
              <dt className="text-ash">Edition</dt>
              <dd>{editionLabel(work)}</dd>
              <dt className="text-ash">Size</dt>
              <dd>{isBuy ? `${SIZES[size].label} · ${SIZES[size].dims}` : isSeries ? "Set sizes confirmed on enquiry" : "Dimensions confirmed on enquiry"}</dd>
              <dt className="text-ash">Certificate</dt>
              <dd>{work.edition.kind === "open" ? "Included" : "Numbered certificate of authenticity"}</dd>
            </dl>
            <p className="mt-4 text-[10px] text-ash">Specifications are illustrative while the studio finalises materials and sizes.</p>
          </Item>
          <Item value="framing" title="Framing & finish">
            <p>Choose unframed for your own framer, or have it finished for you in matt black or raw oak with museum glazing.</p>
            <p>Framed works are signed off and packed ready to hang.</p>
          </Item>
          <Item value="shipping" title="Shipping & returns">
            <p>Each work is packed carefully and sent with a tracking number once dispatched. Delivery costs are confirmed at checkout.</p>
            <p>
              Read the full <Link href="/shipping-returns">shipping & returns policy</Link>.
            </p>
          </Item>
          <Item value="care" title="Care & display">
            <p>Keep prints out of direct sunlight and away from damp. Framed works can be hung straight away; unframed prints should be framed behind UV-protective glazing.</p>
          </Item>
        </Accordion>

        <p className="mt-8 text-[10px] leading-[1.6] text-ash">Prototype: product names, prices, editions and availability are illustrative. No real orders can be placed.</p>
      </div>
    </div>
  );
}

function Item({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="border-line">
      <AccordionTrigger className="rounded-none px-0 py-5 text-[11px] font-bold tracking-[0.06em] uppercase hover:no-underline">{title}</AccordionTrigger>
      <AccordionContent className="space-y-3 text-[13px] leading-[1.7] text-[#555]">{children}</AccordionContent>
    </AccordionItem>
  );
}

/**
 * A wall, a console and the work at relative scale, so the size choice is felt, not read.
 * Collector's Editions hang large and framed; a series hangs as a row of prints.
 */
function RoomView({ work, size, finish }: { work: Work; size: SizeKey; finish: FinishKey }) {
  const isSeries = work.collection === "photographic-series";
  const isCollector = work.collection === "collectors-editions";
  const buy = work.mode === "buy";

  // Wall height shown is ~1.75 m. Buyable works follow the chosen size; enquiry-led works use a presentation scale.
  const heightPct = isSeries ? 24 : isCollector ? 50 : (SIZE_HEIGHT_MM[size] / 1750) * 100;
  const frame = buy ? FRAME_COLOUR[finish] : FRAME_COLOUR["Black frame"];
  const prints = isSeries ? [0, 1, 2] : [0];
  const focals = ["20% 50%", "55% 50%", "85% 50%"];

  const caption = isSeries
    ? "In the room · Set of three shown"
    : isCollector
      ? "In the room · Collector's presentation, framed"
      : `In the room · ${size} ${finish === "Unframed" ? "unframed" : finish.toLowerCase()}`;

  return (
    <figure className="relative aspect-[4/3] w-full overflow-hidden bg-[#e5e0d6]" aria-label="The work shown on a wall at scale">
      <div className="absolute inset-x-0 top-0 h-[84%] bg-gradient-to-b from-[#ece8df] to-[#dfd9cd]" />
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[#cbc2b1]" />
      <div className="absolute inset-x-0 bottom-[16%] h-[1.1%] bg-[#dcd5c8] shadow-[0_-1px_0_rgba(0,0,0,0.05)]" />
      {/* low oak console, kept quiet so the work leads */}
      <div className="absolute bottom-[10%] left-1/2 h-[7%] w-[36%] -translate-x-1/2 bg-[#a48f72] shadow-[0_14px_22px_-12px_rgba(0,0,0,0.28)]" />
      <div className="absolute bottom-[7%] left-[33%] h-[3%] w-[0.9%] bg-[#8a765b]" />
      <div className="absolute right-[33%] bottom-[7%] h-[3%] w-[0.9%] bg-[#8a765b]" />
      {/* the work(s) */}
      <div
        className="absolute bottom-[27%] left-1/2 flex -translate-x-1/2 items-end gap-[1.6%] transition-[height] duration-500 ease-out"
        style={{ height: `${heightPct}%` }}
      >
        {prints.map((n) => (
          <div
            key={n}
            className="h-full shadow-[0_16px_30px_-10px_rgba(0,0,0,0.38)] transition-[padding,background] duration-300"
            style={{ aspectRatio: "1 / 1.414", background: frame ?? "transparent", padding: frame ? "5%" : 0 }}
          >
            <div className="h-full w-full" style={{ background: frame ? "#f7f7f5" : "transparent", padding: frame ? "9%" : 0 }}>
              <Photo plain src={imageUrl(work.image)} alt="" tone={work.tone} focal={isSeries ? focals[n] : work.focal} className="h-full w-full" sizes="20vw" />
            </div>
          </div>
        ))}
      </div>
      <figcaption className="label absolute bottom-3 left-4 text-[#3a3935]">{caption}</figcaption>
    </figure>
  );
}
