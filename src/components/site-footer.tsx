import Link from "next/link";
import { COLLECTIONS } from "@/lib/catalogue";
import { POLICY_LINKS, SITE } from "@/lib/site";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-paper px-[var(--offset)] pt-[85px] pb-6">
      <div className="grid gap-12 md:grid-cols-2">
        <p className="max-w-[650px] text-[clamp(31px,4vw,65px)] leading-[1.1] font-bold tracking-[-0.07em]">Let the ordinary become something extraordinary.</p>
        <NewsletterForm />
      </div>

      <div className="mt-[90px] grid gap-10 border-t border-line pt-8 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="micro mb-4 text-ash">Shop</p>
          <ul className="space-y-2.5">
            {COLLECTIONS.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="hover:underline">
                All works
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="micro mb-4 text-ash">Studio</p>
          <ul className="space-y-2.5">
            <li>
              <Link href="/studio" className="hover:underline">
                About LGNDRY.Co
              </Link>
            </li>
            <li>
              <Link href="/commission" className="hover:underline">
                Commission a project
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <a href={SITE.originalSite} target="_blank" rel="noopener" className="hover:underline">
                Original site ↗
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="micro mb-4 text-ash">Help</p>
          <ul className="space-y-2.5">
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact#faq" className="hover:underline">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="micro mb-4 text-ash">Write to us</p>
          <a href={`mailto:${SITE.email}`} className="break-all hover:underline">
            {SITE.email}
          </a>
          <p className="mt-2 text-ash">{SITE.location}</p>
        </div>
      </div>

      <div aria-hidden="true" className="mt-[110px] -ml-[0.04em] origin-left scale-x-[1.018] text-[clamp(110px,20vw,340px)] leading-[0.8] font-black tracking-[-0.115em] whitespace-nowrap">
        LGNDRY.
      </div>

      <div className="mt-14 flex flex-wrap justify-between gap-x-8 gap-y-3 border-t border-[#bbb] pt-5 text-[10px] tracking-[0.04em]">
        <span>© 2026 LGNDRY.CO — LIMPOPO, SOUTH AFRICA</span>
        <span className="text-ash">PROTOTYPE · PRICES, EDITIONS AND AVAILABILITY ARE ILLUSTRATIVE · NO ORDERS CAN BE PLACED</span>
        <span className="text-ash">
          BUILT BY{" "}
          <a href={SITE.builderUrl} target="_blank" rel="noopener" className="uppercase underline-offset-4 transition-colors hover:text-ink hover:underline">
            {SITE.builderName}
          </a>
        </span>
      </div>
    </footer>
  );
}
