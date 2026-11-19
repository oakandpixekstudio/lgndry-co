import Image from "next/image";

export function IntelligenceHero({ longDate, demo }: { longDate: string; demo: boolean }) {
  return (
    <header className="ic-hero">
      <div>
        <div className="eyebrow">{longDate} / STUDIO DESK</div>
        <h1 className="page-title">
          The Intelligence <em>Center.</em>
        </h1>
        <p className="page-sub">
          A unified view of commerce, collectors, bookings and studio operations
          {demo ? " (demonstration figures)" : ""} &mdash; computed from your own records, with the rule behind every signal.
        </p>
      </div>
      <figure className="ic-hero-art" style={{ margin: 0 }}>
        <Image src="/artwork-placeholders/waves.svg" alt="Sample artwork: abstract monochrome landscape" width={900} height={250} unoptimized priority />
        <figcaption>Sample artwork</figcaption>
      </figure>
    </header>
  );
}
