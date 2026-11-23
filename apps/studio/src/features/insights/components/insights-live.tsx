import type { Bar, InsightsData } from "../live";

/** One horizontal bar list. Uses the existing "grow" reveal, so the bars draw in as the panel scrolls into view. */
function Bars({ bars, empty }: { bars: Bar[]; empty: string }) {
  const max = Math.max(...bars.map((bar) => bar.value), 0);
  if (max === 0) return <p className="ov-empty">{empty}</p>;
  return (
    <div className={`performance-list${bars.length > 8 ? " is-dense" : ""}`} data-reveal="grow">
      {bars.map((bar) => (
        <div key={bar.label}>
          <span><b>{bar.label}</b><strong>{bar.value}</strong></span>
          <i><em style={{ width: `${Math.max(bar.value > 0 ? 3 : 0, Math.round((bar.value / max) * 100))}%` }} /></i>
        </div>
      ))}
    </div>
  );
}

function Panel({ eyebrow, title, note, children }: { eyebrow: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="panel panel-pad" aria-label={title}>
      <div className="caps muted">{eyebrow}</div>
      <h2 className="panel-title serif">{title}</h2>
      {note ? <p className="ins-note">{note}</p> : null}
      {children}
    </section>
  );
}

export function InsightsLive({ data }: { data: InsightsData }) {
  const { enquiries, customers, subscribers, bookings, catalogue } = data;
  const thisMonth = customers.monthly[customers.monthly.length - 1]?.value ?? 0;
  const converted = enquiries.byStatus.find((bar) => bar.label === "Converted")?.value ?? 0;

  return (
    <div className="cat-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Insights</span>
          <h1 className="workspace-title">Insights. <em>What is happening, from your own records.</em></h1>
          <p>Every figure is counted from real enquiries, customers, bookings and works. There are no sales figures yet because online ordering has not opened.</p>
        </div>
      </header>

      <section className="cat-stats" aria-label="Summary">
        <div><span>Enquiries (90 days)</span><strong>{enquiries.total90d}</strong></div>
        <div><span>Customers</span><strong>{customers.total}</strong></div>
        <div><span>Newsletter subscribers</span><strong>{subscribers.total}</strong></div>
        <div><span>Works on the website</span><strong>{catalogue.published}</strong></div>
      </section>

      <div className="ov-grid">
        <Panel eyebrow="Enquiries" title="Enquiries per week" note="The last 12 weeks, Monday to Sunday.">
          <Bars bars={enquiries.weekly} empty="No enquiries in the last 12 weeks." />
        </Panel>
        <Panel eyebrow="Enquiries" title="What people ask about" note="Over the last 12 weeks.">
          <Bars bars={enquiries.byCategory} empty="No enquiries yet." />
        </Panel>
        <Panel eyebrow="Enquiries" title="Where enquiries stand" note={converted ? `${converted} converted into work.` : "None converted yet."}>
          <Bars bars={enquiries.byStatus} empty="No enquiries yet." />
        </Panel>
        <Panel eyebrow="Customers" title="New customers per month" note={`${thisMonth} so far this month. The last 6 months.`}>
          <Bars bars={customers.monthly} empty="No new customers in the last 6 months." />
        </Panel>
        <Panel eyebrow="Customers" title="How customers found you" note="Customers added in the last 6 months, by first contact.">
          <Bars bars={customers.bySource} empty="No new customers yet." />
        </Panel>
        <Panel eyebrow="Newsletter" title="New subscribers per month" note="People who agreed to marketing email. The last 6 months.">
          <Bars bars={subscribers.monthly} empty="No subscribers in the last 6 months." />
        </Panel>
        <Panel eyebrow="Bookings" title="Photography bookings" note={`${bookings.total} in total.`}>
          <Bars bars={bookings.byStatus} empty="No bookings yet." />
        </Panel>
        <Panel eyebrow="Catalogue" title="Works by state">
          <Bars
            bars={[
              { label: "Published", value: catalogue.published },
              { label: "Draft", value: catalogue.draft },
              { label: "Scheduled", value: catalogue.scheduled },
              { label: "Retired", value: catalogue.retired },
            ]}
            empty="No works yet."
          />
        </Panel>
      </div>

      <div className="workspace-foot">
        <span>LGNDRY.Co / Studio Desk</span>
        <span>Computed from live records</span>
      </div>
    </div>
  );
}
