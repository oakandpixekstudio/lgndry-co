import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CollectorEnquiryForm } from "@/components/enquiry-forms";
import { PageIntro } from "@/components/page-intro";
import { Photo } from "@/components/photo";
import { Reveal } from "@/components/reveal";
import { editionLabel, imageUrl, worksByCollection } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Collector's Editions",
  description: "Five photographic works, each strictly limited, individually numbered and presented to museum standard. Acquired by private enquiry.",
};

const STEPS = [
  { t: "Enquire", d: "Tell us which work interests you. The studio replies personally." },
  { t: "Confirm", d: "We confirm which copies remain from the edition register, and agree size and presentation." },
  { t: "Reserve", d: "Your copy is allocated once the agreed payment is received and verified." },
  { t: "Receive", d: "Numbered, certified, framed to standard, packed and delivered with tracking." },
];

const INCLUDED = ["A numbered copy from a strictly capped edition", "Signed certificate of authenticity", "Museum-standard framing and glazing", "Entry in the edition register, with your name as owner", "Insured, tracked delivery"];

const FAQ = [
  { q: "Why isn't availability shown on the page?", a: "Every copy is tracked in a register, and some earlier copies have been gifted or reserved. We confirm exactly which numbers remain when you enquire, so you never choose from out-of-date information." },
  { q: "Will the edition size ever increase?", a: "No. Once a limit is published it is locked. If a limit ever had to change it would be recorded and explained. We never quietly add copies." },
  { q: "Can I choose my edition number?", a: "Where several remain, we are happy to discuss preferences when you enquire. Numbers are confirmed once your copy is reserved." },
  { q: "Do you arrange framing and delivery?", a: "Yes. Each Collector's Edition is framed and packed by the studio and delivered with tracking." },
];

export default function CollectorsEditionsPage() {
  const works = worksByCollection("collectors-editions");

  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Collector’s Editions" }]}
        eyebrow="FIVE WORKS. STRICTLY LIMITED."
        size="md"
        title={
          <>
            <span className="block">COLLECTOR&rsquo;S</span>
            <span className="block pl-[3%] md:pl-[14%]">EDITIONS.</span>
          </>
        }
        intro="Our rarest releases. Each is capped at a handful of copies, individually numbered and presented to museum standard. Acquired by private enquiry, one conversation at a time."
        aside={
          <Link href="#enquire" className="btn btn-dark min-w-[280px]">
            Enquire privately <span>↓</span>
          </Link>
        }
      />

      {/* The five works */}
      <section className="px-[var(--offset)] pb-[100px]" aria-label="The five works">
        <ol className="border-t border-ink">
          {works.map((w, i) => (
            <li key={w.slug} className="border-b border-line">
              <Reveal>
                <Link href={`/works/${w.slug}`} className="group grid items-center gap-8 py-10 md:grid-cols-[80px_minmax(0,1.1fr)_1fr] md:gap-12 lg:grid-cols-[80px_minmax(0,1.1fr)_1fr_minmax(150px,0.5fr)] lg:py-14">
                  <p className="label hidden md:block">{String(i + 1).padStart(2, "0")}</p>
                  <Photo
                    src={imageUrl(w.image)}
                    alt={`${w.title}: ${w.summary}`}
                    tone={w.tone}
                    focal={w.focal}
                    className="aspect-[4/3]"
                    sizes="(max-width: 768px) 100vw, 45vw"
                    zoom
                  />
                  <div>
                    <p className="micro mb-4 text-ash">
                      {w.category} / {editionLabel(w)}
                    </p>
                    <h2 className="heading mb-5 text-[clamp(36px,4.4vw,72px)] underline-offset-[10px] decoration-1 group-hover:underline">{w.title}</h2>
                    <p className="mb-8 max-w-[380px] text-[13px] leading-[1.75] text-[#555]">{w.summary}</p>
                    <span className="tlink">View &amp; enquire ↗</span>
                  </div>
                  <div className="hidden self-end text-right lg:block" aria-hidden="true">
                    <p className="label mb-2 text-ash">Edition of</p>
                    <p className="display-serif text-[clamp(72px,8vw,150px)] leading-[0.8]">{w.edition.kind === "limited" && w.edition.size ? w.edition.size : "—"}</p>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* What's included */}
      <section className="bg-[#0f0f0f] px-[var(--offset)] py-[100px] text-[#f4f4f1]" aria-labelledby="included">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <p className="micro mb-8">WHAT YOU RECEIVE</p>
            <h2 id="included" className="display text-[clamp(52px,7vw,110px)]">
              PRESENTED
              <br />
              <span className="display-serif">to last.</span>
            </h2>
          </div>
          <ul className="self-end border-t border-white/20">
            {INCLUDED.map((x, i) => (
              <li key={x} className="flex gap-6 border-b border-white/15 py-5 text-[14px]">
                <span className="label pt-0.5 text-white/50">{String(i + 1).padStart(2, "0")}</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="px-[var(--offset)] py-[100px]" aria-labelledby="how">
        <p className="micro mb-8">HOW ACQUIRING WORKS</p>
        <h2 id="how" className="heading mb-14 max-w-[760px] text-[clamp(34px,4.6vw,70px)]">
          A private, unhurried process.
        </h2>
        <ol className="grid gap-x-8 gap-y-10 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <p className="label mb-5">{String(i + 1).padStart(2, "0")}</p>
              <p className="mb-3 text-[26px] font-bold tracking-[-0.06em]">{s.t}</p>
              <p className="max-w-[260px] text-[13px] leading-[1.7] text-[#555]">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ + enquiry */}
      <section className="border-t border-line bg-stone px-[var(--offset)] py-[100px]">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="micro mb-8">GOOD TO KNOW</p>
            <Accordion defaultValue={["f0"]} className="border-t border-ink">
              {FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`f${i}`} className="border-line">
                  <AccordionTrigger className="rounded-none px-0 py-5 text-[14px] font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="max-w-[460px] text-[13px] leading-[1.75] text-[#555]">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div id="enquire" className="scroll-mt-28">
            <p className="micro mb-8">PRIVATE ENQUIRY</p>
            <h2 className="heading mb-8 text-[clamp(30px,3.4vw,52px)]">Begin the conversation.</h2>
            <CollectorEnquiryForm workTitle="a Collector’s Edition" id="collector-enquire" />
          </div>
        </div>
      </section>
    </>
  );
}
