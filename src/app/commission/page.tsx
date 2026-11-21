import type { Metadata } from "next";
import { CommissionForm } from "@/components/enquiry-forms";
import { PageIntro } from "@/components/page-intro";
import { Photo } from "@/components/photo";
import { imageUrl } from "@/lib/catalogue";
import { getCatalogue } from "@/lib/catalogue-source";

export const metadata: Metadata = {
  title: "Commission a project",
  description: "Commission LGNDRY.Co for documentary, portrait, brand and editorial photography and visual storytelling.",
};

const SERVICES = [
  { t: "Documentary", d: "Honest, unstaged storytelling of people, places and moments that matter." },
  { t: "Portraiture", d: "Unhurried portraits where light, space and presence carry the story." },
  { t: "Brand & commercial", d: "Visual identity and campaign imagery with a point of view." },
  { t: "Events & editorial", d: "Considered coverage and editorial features, shot with restraint." },
];

const STEPS = ["Share your brief", "We shape the approach together", "We photograph and edit", "You receive finished work"];

export default async function CommissionPage() {
  const { slotImage } = await getCatalogue();
  const hero = slotImage("commission.hero", { file: "services-hero.webp", alt: "LGNDRY.Co commissioned visual storytelling work" });
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Commission" }]}
        eyebrow="THE STUDIO / COMMISSIONS"
        size="md"
        title={
          <>
            <span className="block">STORIES</span>
            <span className="block pl-[3%] md:pl-[10%]">BEYOND</span>
            <span className="block">THE FRAME.</span>
          </>
        }
        intro="The same eye behind the collection, available for your project. Tell us what you are making."
      />

      <section className="px-[var(--offset)] pb-[90px]" aria-label="What we make">
        <ul className="grid gap-x-8 gap-y-10 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <li key={s.t}>
              <p className="label mb-5 text-ash">{String(i + 1).padStart(2, "0")}</p>
              <p className="mb-3 text-[26px] leading-none font-bold tracking-[-0.06em]">{s.t}</p>
              <p className="max-w-[260px] text-[13px] leading-[1.7] text-[#555]">{s.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line bg-stone px-[var(--offset)] py-[90px]">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Photo src={imageUrl(hero.src)} alt={hero.alt} focal={hero.focal} tone="earth" className="aspect-[4/5] max-w-[520px]" sizes="(max-width: 1024px) 100vw, 40vw" />
            <ol className="mt-10 max-w-[520px] border-t border-ink">
              {STEPS.map((s, i) => (
                <li key={s} className="flex gap-6 border-b border-line py-4 text-[13px]">
                  <span className="label pt-0.5 text-ash">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div id="brief" className="scroll-mt-28">
            <p className="micro mb-8">SEND A BRIEF</p>
            <h2 className="heading mb-10 text-[clamp(30px,3.6vw,56px)]">Tell us about the story.</h2>
            <CommissionForm />
          </div>
        </div>
      </section>
    </>
  );
}
