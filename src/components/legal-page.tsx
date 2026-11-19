import { PageIntro } from "@/components/page-intro";

export interface LegalSection {
  title: string;
  body: string[];
}

/** Policy page shell. Copy is a structured DRAFT; terms in [brackets] must be confirmed, and the whole text reviewed by a legal adviser. */
export function LegalPage({ title, intro, sections, updated = "Draft" }: { title: string; intro: string; sections: LegalSection[]; updated?: string }) {
  return (
    <>
      <PageIntro crumbs={[{ label: "Home", href: "/" }, { label: title }]} title={title.toUpperCase() + "."} size="md" intro={intro} />
      <section className="px-[var(--offset)] pb-[130px]">
        <p className="mb-10 inline-block border border-ink px-3 py-2 text-[10px] tracking-[0.08em] uppercase">
          {updated} · Pending legal review. Items in [brackets] are to be confirmed by the studio.
        </p>
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[280px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-28 space-y-3 text-[12px]">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#s${i}`} className="hover:underline">
                    {String(i + 1).padStart(2, "0")} {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-[680px] space-y-12">
            {sections.map((s, i) => (
              <article key={s.title} id={`s${i}`} className="scroll-mt-28 border-t border-ink pt-6">
                <h2 className="mb-5 text-[26px] leading-none font-bold tracking-[-0.06em]">{s.title}</h2>
                <div className="space-y-4 text-[14px] leading-[1.8] text-[#444]">
                  {s.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
