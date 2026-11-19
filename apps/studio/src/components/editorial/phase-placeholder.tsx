import type { ReactNode } from "react";

/**
 * Honest shell for a route whose workflow is built in a later phase.
 * It gives the route a real URL, correct navigation state and the editorial page header,
 * and states plainly what is NOT built, so nothing here can be mistaken for a working feature.
 */
export function PhasePlaceholder({
  eyebrow,
  title,
  sub,
  phase,
  delivers,
}: {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  phase: string;
  delivers: string[];
}) {
  return (
    <>
      <div className="page-top">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{sub}</p>
        </div>
      </div>
      <div className="phase-note" role="status">
        <div className="caps muted">Not built yet &nbsp;/&nbsp; {phase}</div>
        <h2>This workspace is scheduled, not live.</h2>
        <p>The route, navigation and page frame are in place. The workflow below is delivered in the phase shown and tested before it appears here.</p>
        <ul>
          {delivers.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
