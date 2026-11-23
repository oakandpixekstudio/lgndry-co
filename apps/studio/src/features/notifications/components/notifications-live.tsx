import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import type { Attention, AttentionItem, AttentionKind } from "../attention";

const ICON: Record<AttentionKind, IconName> = { enquiry: "mail", booking: "calendar", shoot: "camera" };
const SECTIONS: Array<{ kind: AttentionKind; title: string; empty: string }> = [
  { kind: "enquiry", title: "New enquiries", empty: "No new enquiries waiting." },
  { kind: "booking", title: "Booking requests to review", empty: "No booking requests waiting." },
  { kind: "shoot", title: "Shoots in the next 7 days", empty: "No confirmed shoots in the next 7 days." },
];

function Row({ item }: { item: AttentionItem }) {
  return (
    <Link href={item.href} className="signal">
      <span className="signal-icon"><Icon name={ICON[item.kind]} size={18} /></span>
      <span className="signal-text"><strong>{item.title}</strong><span>{item.body} · {item.when}</span></span>
      <Icon name="chevron" size={15} />
    </Link>
  );
}

export function NotificationsLive({ attention }: { attention: Attention }) {
  const countFor = { enquiry: attention.counts.enquiries, booking: attention.counts.bookings, shoot: attention.counts.shoots };
  return (
    <div className="cat-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Notification centre</span>
          <h1 className="workspace-title">Notifications. <em>What needs your attention.</em></h1>
          <p>These come straight from your records and clear on their own once you deal with them: answer an enquiry, review a booking request, or let a shoot pass.</p>
        </div>
      </header>

      <section className="cat-stats" aria-label="Summary">
        <div><span>Needs attention</span><strong>{attention.total}</strong></div>
        <div><span>New enquiries</span><strong>{attention.counts.enquiries}</strong></div>
        <div><span>Booking requests</span><strong>{attention.counts.bookings}</strong></div>
        <div><span>Shoots this week</span><strong>{attention.counts.shoots}</strong></div>
      </section>

      <div className="ov-grid">
        {SECTIONS.map(({ kind, title, empty }) => {
          const rows = attention.items.filter((item) => item.kind === kind);
          const extra = countFor[kind] - rows.length;
          return (
            <section key={kind} className="panel panel-pad" aria-label={title}>
              <div className="caps muted">{countFor[kind]} waiting</div>
              <h2 className="panel-title serif">{title}</h2>
              {rows.length === 0 ? <p className="ov-empty">{empty}</p> : <div className="signal-list">{rows.map((item) => <Row key={item.id} item={item} />)}</div>}
              {extra > 0 ? <p className="ov-empty">And {extra} more. Open the screen to see them all.</p> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
