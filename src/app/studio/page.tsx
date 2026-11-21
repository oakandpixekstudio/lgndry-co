import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Photo } from "@/components/photo";
import { Reveal } from "@/components/reveal";
import { imageUrl } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/catalogue-source";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Studio",
  description: "LGNDRY.Co is an independent visual studio in Limpopo, South Africa, finding beauty in the mundane.",
};

const PRINCIPLES = [
  { t: "Found, not staged", d: "We photograph what is already there: ordinary places, people and light, as they are. The extraordinary was here all along." },
  { t: "Seen slowly", d: "Patience is the method. We wait for the moment that holds, and we let the frame breathe around it." },
  { t: "Made to last", d: "Each photograph is finished for the wall: archival materials, careful framing and a certificate that outlives the sale." },
];

export default async function StudioPage() {
  const { slotImage } = await getCatalogue();
  // Pictures the studio can change from the Studio Desk (Editions > Website images); the built-in ones show until then.
  const portrait = slotImage("studio.hero", { file: "about-hero.webp", alt: "Movement and form documented in fine-art photography" });
  const second = slotImage("home.intro_2", { file: "home-intro-2.webp", alt: "" });
  const third = slotImage("commission.hero", { file: "services-hero.webp", alt: "" });
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Studio" }]}
        eyebrow="INDEPENDENT VISUAL STUDIO / SOUTH AFRICA"
        size="md"
        title={
          <>
            <span className="block">FOUND BEAUTY</span>
            <span className="block pl-[3%] md:pl-[12%]">
              IN THE <em className="display-serif">mundane.</em>
            </span>
          </>
        }
      />

      <section className="px-[var(--offset)] pb-[100px]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <Reveal>
            <Photo src={imageUrl(portrait.src)} alt={portrait.alt} focal={portrait.focal} tone="form" className="aspect-[4/5]" sizes="(max-width: 1024px) 100vw, 45vw" />
          </Reveal>
          <div className="max-w-[560px] space-y-6 pb-4 text-[15px] leading-[1.8]">
            <p className="text-[clamp(22px,2.4vw,34px)] leading-[1.15] font-bold tracking-[-0.05em]">
              LGNDRY.Co is an independent visual studio based in {SITE.location}.
            </p>
            <p className="text-[#444]">
              A visual archive of overlooked things. Scenes not staged. Moments not repeated. The quiet kind of beauty that stays with you.
            </p>
            <p className="text-[#444]">
              It is where that archive becomes something you can live with: limited-edition photographic prints, made with the same patience as the pictures themselves.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-stone px-[var(--offset)] py-[90px]" aria-label="Principles">
        <ul className="grid gap-12 md:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <li key={p.t}>
              <p className="label mb-6 text-ash">{String(i + 1).padStart(2, "0")}</p>
              <p className="mb-4 text-[28px] leading-none font-bold tracking-[-0.07em]">{p.t}</p>
              <p className="max-w-[320px] text-[13px] leading-[1.75] text-[#555]">{p.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-[var(--offset)] py-[100px]" aria-labelledby="work-with-us">
        <h2 id="work-with-us" className="heading mb-14 text-[clamp(34px,4.6vw,70px)]">
          Two ways to work with us.
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Link href="/shop" className="group relative block overflow-hidden">
            <Photo src={imageUrl(second.src)} alt={second.alt} focal={second.focal} tone="structure" className="aspect-[4/3]" sizes="50vw" zoom />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 text-white">
              <p className="label mb-2 opacity-80">Collect</p>
              <p className="text-[clamp(28px,3vw,44px)] leading-none font-bold tracking-[-0.07em]">Limited-edition prints</p>
              <p className="mt-4 text-[11px] tracking-[0.06em] uppercase underline underline-offset-4">Shop the collection ↗︎</p>
            </div>
          </Link>
          <Link href="/commission" className="group relative block overflow-hidden">
            <Photo src={imageUrl(third.src)} alt={third.alt} focal={third.focal} tone="earth" className="aspect-[4/3]" sizes="50vw" zoom />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 text-white">
              <p className="label mb-2 opacity-80">Commission</p>
              <p className="text-[clamp(28px,3vw,44px)] leading-none font-bold tracking-[-0.07em]">Stories beyond the frame</p>
              <p className="mt-4 text-[11px] tracking-[0.06em] uppercase underline underline-offset-4">Start a project ↗︎</p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
