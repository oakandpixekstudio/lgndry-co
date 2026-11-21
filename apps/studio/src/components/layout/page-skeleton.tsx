/**
 * What the page looks like for the moment before its data arrives: the same hero, strip and table shapes, softly
 * shimmering. It appears the instant you click, so the interface never feels stuck waiting on the server.
 */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="sk-page" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="sk sk-eyebrow" />
      <div className="sk sk-title" />
      <div className="sk sk-line" />
      <div className="sk-strip">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="sk sk-stat" />
        ))}
      </div>
      <div className="sk-table">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="sk sk-row" />
        ))}
      </div>
    </div>
  );
}
