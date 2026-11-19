const POINTS = [
  { t: "Archival quality", d: "Pigment prints on fine-art paper, built to last." },
  { t: "Numbered & certified", d: "Every edition ships with its own certificate." },
  { t: "Framed to order", d: "Unframed, matt black or raw oak, with museum glazing." },
  { t: "Tracked delivery", d: "Carefully packed, couriered and tracked to your door." },
];

/** Reassurance row used above the footer on shopping pages. */
export function ServiceStrip() {
  return (
    <section aria-label="Why collect with LGNDRY.Co" className="border-y border-line bg-stone px-[var(--offset)] py-12">
      <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p, i) => (
          <li key={p.t}>
            <p className="label mb-3 text-ash">{String(i + 1).padStart(2, "0")}</p>
            <p className="mb-1.5 text-[15px] font-bold tracking-[-0.04em]">{p.t}</p>
            <p className="max-w-[260px] text-[12px] leading-[1.65] text-[#555]">{p.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
