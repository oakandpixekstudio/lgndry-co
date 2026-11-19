import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("label text-ash", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            {c.href ? (
              <Link href={c.href} className="hover:text-ink hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {c.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Opening block for inner pages: breadcrumbs, a huge tight title and a short intro. Clears the fixed header. */
export function PageIntro({
  crumbs,
  eyebrow,
  title,
  intro,
  aside,
  size = "lg",
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <header className="px-[var(--offset)] pt-[120px] pb-12 md:pt-[150px]">
      {crumbs && <Breadcrumbs items={crumbs} className="mb-10" />}
      {eyebrow && <p className="micro mb-8">{eyebrow}</p>}
      <h1 className={cn("display max-w-[1300px]", size === "lg" ? "text-[clamp(64px,11vw,175px)]" : "text-[clamp(52px,8vw,128px)]")}>{title}</h1>
      {(intro || aside) && (
        <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
          {intro && <div className="max-w-[420px] text-[14px] leading-[1.75]">{intro}</div>}
          {aside}
        </div>
      )}
    </header>
  );
}
