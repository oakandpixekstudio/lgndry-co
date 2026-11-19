import Link from "next/link";
import { Icon } from "@/components/icons";
import type { IntelligenceSnapshot } from "../types";

export function CommandNotes({ notes }: { notes: IntelligenceSnapshot["notes"] }) {
  const items = [
    { n: "01", k: "Growth", t: notes.growth },
    { n: "02", k: "Opportunity", t: notes.opportunity },
    { n: "03", k: "Next focus", t: notes.nextFocus },
  ];
  return (
    <section className="command-notes" aria-labelledby="notes-title">
      <div>
        <div className="caps">Command notes</div>
        <div className="command-title" id="notes-title">
          Key takeaways.
        </div>
      </div>
      {items.map((i) => (
        <div key={i.n}>
          <div className="caps" style={{ fontSize: 9 }}>
            {i.n} / {i.k}
          </div>
          <p>{i.t}</p>
        </div>
      ))}
      <div className="command-cta">
        <Link href="/insights" className="button">
          View full insights <Icon name="arrow" size={14} />
        </Link>
      </div>
    </section>
  );
}
