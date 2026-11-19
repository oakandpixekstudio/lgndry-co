import Link from "next/link";
import { Photo } from "@/components/photo";
import { editionLabel, imageUrl, priceLabel, type Work } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

/** Catalogue card. Wrap in `.stagger` for the editorial layout or any grid for a uniform one. */
export function WorkCard({
  work,
  index,
  total,
  aspect,
  className,
  priority,
}: {
  work: Work;
  index?: number;
  total?: number;
  /** Tailwind aspect class for uniform grids; the staggered grid sets its own. */
  aspect?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <article className={cn("group", className)}>
      <Link href={`/works/${work.slug}`} className="block" aria-label={`${work.title}, ${priceLabel(work)}`}>
        {index !== undefined && total !== undefined && (
          <p className="label absolute -top-[27px] left-0 hidden md:block">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        )}
        <div className="relative">
          <Photo
            src={imageUrl(work.image)}
            alt={`${work.title}: ${work.summary}`}
            tone={work.tone}
            focal={work.focal}
            className={cn("ph", aspect ?? "aspect-[3/3.7]")}
            sizes="(max-width: 768px) 50vw, 33vw"
            priority={priority}
            zoom
          />
          <span className="absolute top-3 left-3 bg-paper/95 px-2 py-1 text-[9px] font-semibold tracking-[0.12em] uppercase">
            {work.collection === "collectors-editions"
              ? "Collector’s Edition"
              : work.edition.kind === "open"
                ? "Open edition"
                : work.collection === "photographic-series"
                  ? "Series"
                  : "Limited edition"}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-[11px] text-[11px] font-semibold">
          <span className="underline-offset-4 group-hover:underline">{work.title}</span>
          <span className="font-normal whitespace-nowrap">{priceLabel(work)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-1.5 text-[10px] tracking-[0.03em] uppercase">
          <p className="text-[#777]">
            {work.category} / {editionLabel(work)}
          </p>
          <span className={cn("shrink-0 font-semibold whitespace-nowrap", work.mode === "buy" ? "text-ink" : "text-ash")}>
            {work.mode === "buy" ? "Order online ↗" : "Enquire ↗"}
          </span>
        </div>
      </Link>
    </article>
  );
}
