import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactForm } from "@/components/enquiry-forms";
import { PageIntro } from "@/components/page-intro";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with LGNDRY.Co about prints, Collector's Editions, framing, shipping or commissions.",
};

const FAQ = [
  { q: "What is the difference between open and limited editions?", a: "Open editions are printed to order and never capped. Limited editions are released in a fixed, numbered run and come with a numbered certificate. Collector's Editions are our smallest runs." },
  { q: "Can I buy a print unframed?", a: "Yes. Every available print can be ordered unframed, or framed in matt black or raw oak with museum glazing." },
  { q: "How is my print delivered?", a: "Prints are packed carefully and sent with a tracking number once dispatched. Delivery costs are confirmed at checkout." },
  { q: "Can I return a print?", a: "Please read our shipping & returns policy for the full detail, including how made-to-order and limited-edition works are handled." },
  { q: "Do you take commissions?", a: "Yes. Send a brief through the commission page and the studio will be in touch." },
];

export default function ContactPage() {
  return (
    <>
      <PageIntro
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
        eyebrow="WRITE TO THE STUDIO"
        size="md"
        title="CONTACT."
        intro="Questions about a print, a framing choice or an edition? We read every message."
      />

      <section className="px-[var(--offset)] pb-[100px]">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          <ContactForm />
          <aside className="space-y-10 text-[13px] leading-[1.75] lg:border-l lg:border-line lg:pl-14">
            <div>
              <p className="micro mb-3 text-ash">Email</p>
              <a href={`mailto:${SITE.email}`} className="break-all text-[15px] underline underline-offset-4">
                {SITE.email}
              </a>
            </div>
            <div>
              <p className="micro mb-3 text-ash">Studio</p>
              <p>Lgndry Content / LGNDRY.Co</p>
              <p className="text-ash">{SITE.location}</p>
            </div>
            <div>
              <p className="micro mb-3 text-ash">Looking for something else?</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/collectors-editions#enquire" className="underline underline-offset-4">
                    Collector&rsquo;s Edition enquiries ↗
                  </Link>
                </li>
                <li>
                  <Link href="/commission" className="underline underline-offset-4">
                    Commission a project ↗
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-line bg-stone px-[var(--offset)] py-[90px]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="heading text-[clamp(34px,4.4vw,68px)]">Good to know.</h2>
          <Accordion defaultValue={["q0"]} className="border-t border-ink">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="border-line">
                <AccordionTrigger className="rounded-none px-0 py-5 text-[14px] font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="max-w-[520px] text-[13px] leading-[1.75] text-[#555]">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
