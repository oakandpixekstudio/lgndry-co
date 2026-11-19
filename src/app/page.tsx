import Link from "next/link";
import { Photo } from "@/components/photo";
import { Reveal } from "@/components/reveal";
import { WorkCard } from "@/components/work-card";
import { COLLECTIONS, WORKS, editionLabel, imageUrl, worksByCollection } from "@/lib/catalogue";

const TICKER = [
  "Archival pigment prints",
  "Numbered limited editions",
  "Certificate of authenticity",
  "Framed or unframed",
  "Tracked delivery",
  "Made in Limpopo, South Africa",
];

const PROCESS = [
  { n: "01", t: "Chosen", d: "Every image is selected from the archive and mastered for print, not for the screen." },
  { n: "02", t: "Printed", d: "Archival pigment on fine-art paper, proofed and quality-checked before anything ships." },
  { n: "03", t: "Finished", d: "Unframed, or framed in matt black or raw oak with museum glazing, then signed off." },
  { n: "04", t: "Delivered", d: "A numbered certificate with every edition. Packed carefully and sent with tracking." },
];

export default function HomePage() {
  const buyable = WORKS.filter((w) => w.mode === "buy");
  const collectors = worksByCollection("collectors-editions");
  const feature = collectors[0];

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-wordmark animate-rise" aria-hidden="true">
          LGNDRY<span className="co">.CO</span>
        </div>
        <h1 className="sr-only" id="hero-heading">
          LGNDRY.Co — Found beauty in the mundane. Limited-edition photographic prints.
        </h1>
        <div className="hero-border" />
        <span className="hero-vertical-label">INDEPENDENT VISUAL STUDIO / SOUTH AFRICA</span>
        <div className="hero-counter animate-rise [animation-delay:350ms]">001 — 006 &nbsp;&nbsp; / &nbsp;&nbsp; EDITION NO. 01</div>

        <div className="hero-work animate-unveil [animation-delay:200ms]">
          <Photo src={imageUrl("home-hero.webp")} alt="A figure standing in a golden field beneath a hazy Limpopo sky" tone="earth" className="h-full w-full" priority sizes="55vw" />
        </div>
        <div className="hero-detail animate-unveil [animation-delay:450ms]">
          <Photo src={imageUrl("home-intro-1.webp")} alt="Documentary image of a gathering beneath a clear sky" tone="ritual" className="h-full w-full" priority sizes="25vw" />
        </div>

        <p className="hero-line animate-rise [animation-delay:600ms]">The extraordinary was here all along.</p>
        <span className="hero-bottom-index">FOUND BEAUTY IN THE MUNDANE &nbsp; © 2026</span>

        <div className="hero-cta animate-rise [animation-delay:750ms]">
          <span className="label hidden 2xl:inline">Visual stories / Objects / People / Place</span>
          <div className="grid gap-3 md:flex">
            <Link href="/shop" className="btn btn-dark">
              Shop the collection <span>→</span>
            </Link>
            <Link href="/collectors-editions" className="btn btn-line">
              Collector&rsquo;s Editions <span>↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Ticker ───────── */}
      <div className="overflow-hidden border-y border-ink py-3.5" aria-label="What every print includes">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((dup) => (
            <ul key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {TICKER.map((t) => (
                <li key={t} className="label flex items-center whitespace-nowrap">
                  <span className="px-8">{t}</span>
                  <span aria-hidden="true">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ───────── Shop by collection ───────── */}
      <section className="px-[var(--offset)] pt-[100px] pb-[70px]" aria-labelledby="by-collection">
        <div className="micro flex justify-between gap-6">
          <span>01 / SHOP BY COLLECTION</span>
          <span className="hidden sm:inline">FOUR WAYS TO COLLECT</span>
        </div>
        <h2 id="by-collection" className="heading mt-8 mb-12 max-w-[760px] text-[clamp(36px,5vw,76px)]">
          Find the print that fits your wall, and your story.
        </h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
          {COLLECTIONS.map((c, i) => {
            const cover = worksByCollection(c.slug)[0];
            return (
              <Reveal key={c.slug} delay={i * 80}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="relative overflow-hidden">
                    <Photo src={imageUrl(cover.image)} alt="" tone={cover.tone} focal={cover.focal} className="aspect-[3/4]" sizes="(max-width: 1024px) 50vw, 25vw" />
                    <div className="absolute inset-0 z-[4] bg-gradient-to-t from-black/60 via-black/5 to-transparent transition-opacity duration-700 group-hover:from-black/80" />
                    <div className="absolute inset-x-4 bottom-4 z-[5] text-white transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-3">
                      <p className="text-[10px] tracking-[0.12em] uppercase opacity-80">{String(i + 1).padStart(2, "0")}</p>
                      <p className="mt-1 text-[clamp(20px,2.2vw,32px)] leading-[0.98] font-bold tracking-[-0.06em]">{c.title}</p>
                      <span className="mt-3 block h-px w-0 bg-white transition-[width] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:w-full" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 pt-3 text-[11px]">
                    <span className="text-ash">{c.from}</span>
                    <span className="inline-flex items-center gap-1 underline-offset-4 group-hover:underline">
                      Explore <span className="inline-block transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-0.5">↗</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────── Selected works ───────── */}
      <section id="collection" className="px-[var(--offset)] pt-[60px] pb-[130px]" aria-labelledby="collection-title">
        <div className="micro flex justify-between gap-6">
          <span>02 / THE OBJECTS</span>
          <span className="hidden sm:inline">NOT EVERYTHING BEAUTIFUL ASKS FOR ATTENTION.</span>
        </div>
        <Reveal>
          <h2 id="collection-title" className="display mt-[60px] mb-12 max-w-[1200px] text-[clamp(64px,11vw,175px)]">
            <span className="block">THE</span>
            <span className="block pl-[3%] md:pl-[19%]">COLLECTION.</span>
          </h2>
        </Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-5">
          <p className="max-w-[320px] text-[13px] leading-[1.7]">Photography worth living with. Individually considered works, presented as archival prints.</p>
          <Link href="/shop" className="tlink">
            View all works ↗
          </Link>
        </div>
        <div className="stagger">
          {buyable.slice(0, 6).map((w, i) => (
            <WorkCard key={w.slug} work={w} index={i} total={Math.min(6, buyable.length)} />
          ))}
        </div>
        <div className="mt-24 flex items-center justify-between gap-4 border-t border-line pt-5 text-[10px] tracking-[0.07em]">
          <span>{Math.min(6, buyable.length)} OF {buyable.length} WORKS AVAILABLE TO ORDER</span>
          <Link href="/shop" className="btn btn-line">
            Shop all works <span>→</span>
          </Link>
        </div>
      </section>

      {/* ───────── Collector's Editions ───────── */}
      <section className="bg-stone px-[var(--offset)] py-[100px]" aria-labelledby="collectors">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="micro mb-10">03 / COLLECTOR&rsquo;S EDITIONS</p>
            <h2 id="collectors" className="display text-[clamp(56px,8.4vw,136px)]">
              FIVE WORKS.
              <br />
              <span className="display-serif">strictly limited.</span>
            </h2>
            <p className="mt-10 max-w-[440px] text-[14px] leading-[1.75] text-[#444]">
              Our rarest releases. Each is capped at a handful of copies, individually numbered and presented to museum standard with a signed certificate. Acquired by private enquiry.
            </p>
            <ul className="mt-10 max-w-[520px] border-t border-ink">
              {collectors.map((w) => (
                <li key={w.slug} className="border-b border-line">
                  <Link href={`/works/${w.slug}`} className="group flex items-baseline justify-between gap-4 py-4 text-[13px]">
                    <span className="font-semibold underline-offset-4 group-hover:underline">{w.title}</span>
                    <span className="text-[11px] text-ash">{editionLabel(w).replace("Limited edition", "Edition")}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/collectors-editions" className="btn btn-dark mt-10 min-w-[300px]">
              Enter the Collector&rsquo;s Editions <span>→</span>
            </Link>
          </div>
          <Reveal>
            <Link href={`/works/${feature.slug}`} className="group block">
              <Photo src={imageUrl(feature.image)} alt={feature.summary} tone={feature.tone} focal={feature.focal} className="aspect-[4/5] shadow-[0_0_0_14px_#f8f8f5]" sizes="(max-width: 1024px) 100vw, 45vw" zoom />
              <div className="mt-8 flex justify-between text-[11px]">
                <span className="font-semibold">{feature.title}</span>
                <span className="text-ash">Edition of {feature.edition.kind === "limited" ? feature.edition.size : "—"}</span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ───────── Brand statement ───────── */}
      <section className="relative overflow-hidden bg-[#0f0f0f] px-[var(--offset)] pt-[130px] pb-[125px] text-[#f4f4f1]" id="editorial">
        <div className="micro flex justify-between gap-6">
          <span>04 / THE PERSPECTIVE</span>
          <span className="hidden sm:inline">LGNDRY / 001</span>
        </div>
        <Reveal>
          <h2 className="display relative z-[4] mt-[88px] mb-11 max-w-[1300px] text-[clamp(72px,11.6vw,192px)] uppercase">
            <span className="block">THE</span>
            <span className="block pl-[1%] md:pl-[14%]">
              <em className="display-serif">unseen.</em>
            </span>
            <span className="block">ALWAYS.</span>
          </h2>
        </Reveal>
        <div className="relative z-[1] ml-auto -mt-4 aspect-[1.3] w-full max-h-[570px] sm:w-[83%] md:-mt-[78px] md:w-[51%]">
          <Photo src={imageUrl("about-hero.webp")} alt="Movement and form documented in fine-art photography" tone="form" className="h-full w-full grayscale-[0.4]" sizes="(max-width: 768px) 90vw, 50vw" />
        </div>
        <p className="relative z-[4] mt-10 max-w-[320px] text-[13px] leading-[1.65] md:absolute md:bottom-[11%] md:left-[var(--offset)] md:mt-0">
          A visual archive of overlooked things. Scenes not staged. Moments not repeated. The quiet kind of beauty that stays with you.
        </p>
        <Link href="/studio" className="tlink relative z-[4] mt-8 inline-block md:absolute md:right-[var(--offset)] md:bottom-[7%] md:mt-0">
          About the studio ↗
        </Link>
      </section>

      {/* ───────── Process ───────── */}
      <section className="px-[var(--offset)] py-[110px]" aria-labelledby="process">
        <p className="micro mb-8">05 / FROM STUDIO TO WALL</p>
        <h2 id="process" className="heading mb-16 max-w-[820px] text-[clamp(36px,5vw,76px)]">
          Made slowly. Finished properly. Sent with care.
        </h2>
        <ol className="grid gap-x-8 gap-y-12 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p) => (
            <li key={p.n}>
              <p className="label mb-6">{p.n}</p>
              <p className="mb-3 text-[26px] font-bold tracking-[-0.06em]">{p.t}</p>
              <p className="max-w-[280px] text-[13px] leading-[1.7] text-[#555]">{p.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Commission passage ───────── */}
      <section className="relative h-[min(850px,85svh)] min-h-[600px] overflow-hidden text-white" id="studio">
        <Photo src={imageUrl("services-hero.webp")} alt="LGNDRY.Co commissioned visual storytelling work" tone="earth" focal="center 45%" className="absolute inset-0" sizes="100vw" />
        <div className="absolute inset-0 z-[3] bg-gradient-to-r from-black/50 to-transparent" />
        <div className="absolute inset-x-[var(--offset)] bottom-[9%] z-[4]">
          <Reveal>
            <h2 className="display mb-9 max-w-[1000px] text-[clamp(64px,11vw,178px)]">
              STORIES
              <br />
              BEYOND
              <br />
              THE FRAME.
            </h2>
          </Reveal>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <span className="label hidden sm:inline">06 / THE STUDIO</span>
            <Link href="/commission" className="btn btn-light min-w-[260px]">
              Commission a project <span>↗</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
