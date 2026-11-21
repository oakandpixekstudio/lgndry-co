import Link from "next/link";
import { Icon } from "@/components/icons";
import { KpiRail } from "@/features/intelligence/components/kpi-rail";
import type { Kpi } from "@/features/intelligence/types";
import { formatLongDate } from "@/lib/format";
import type { OverviewData } from "./db";

const day = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", day: "2-digit", month: "short" }).format(new Date(iso));
const SOURCE: Record<string, string> = { storefront: "Website enquiry", newsletter: "Newsletter", manual: "Added by hand" };

export function OverviewLive({ data, canSeeEnquiries }: { data: OverviewData; canSeeEnquiries: boolean }) {
  const kpis: Kpi[] = [
    { id: "new-enq", label: "New enquiries", value: String(data.newEnquiries), icon: "mail", href: "/enquiries", note: `${data.openEnquiries} open in total` },
    { id: "customers", label: "Customers", value: String(data.customers), icon: "users", href: "/customers", note: `${data.newCustomers30d} new in 30 days` },
    { id: "subs", label: "Newsletter subscribers", value: String(data.subscribers), icon: "megaphone", href: "/customers", note: "With marketing consent" },
    { id: "published", label: "Works on the website", value: String(data.published), icon: "image", href: "/editions/catalogue", note: "Published" },
    { id: "drafts", label: "Draft works", value: String(data.drafts), icon: "pencil", href: "/editions/catalogue", note: data.drafts ? "Not yet public" : "Nothing waiting" },
  ];

  return (
    <>
      <header className="ic-hero ic-hero-plain">
        <div>
          <div className="eyebrow">{formatLongDate(new Date())} / STUDIO DESK</div>
          <h1 className="page-title">The Studio <em>today.</em></h1>
          <p className="page-sub">Real figures from your own records. Sales and bookings appear here once online ordering and booking open.</p>
        </div>
      </header>

      <KpiRail kpis={kpis} />

      <div className="ov-grid">
        {canSeeEnquiries ? (
          <section className="panel panel-pad" aria-label="Latest enquiries">
            <div className="caps muted">Enquiries</div>
            <h2 className="panel-title serif">Latest from the website</h2>
            {data.recentEnquiries.length === 0 ? <p className="ov-empty">No enquiries yet. They appear here when someone uses a form on the website.</p> : (
              <div className="signal-list">
                {data.recentEnquiries.map((e) => (
                  <Link key={e.id} href="/enquiries" className="signal">
                    <span className="signal-icon"><Icon name="mail" size={18} /></span>
                    <span className="signal-text"><strong>{e.name}{e.status === "new" ? " · new" : ""}</strong><span>{e.topic || e.category} · {e.ref} · {day(e.receivedAt)}</span></span>
                    <Icon name="chevron" size={15} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="panel panel-pad" aria-label="Newest customers">
          <div className="caps muted">Customers</div>
          <h2 className="panel-title serif">Newest customers</h2>
          {data.recentCustomers.length === 0 ? <p className="ov-empty">No customers yet.</p> : (
            <div className="signal-list">
              {data.recentCustomers.map((c) => (
                <Link key={c.id} href="/customers" className="signal">
                  <span className="signal-icon"><Icon name="user" size={18} /></span>
                  <span className="signal-text"><strong>{c.name}</strong><span>{(c.source && SOURCE[c.source]) || "Customer"} · {day(c.createdAt)}</span></span>
                  <Icon name="chevron" size={15} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="panel panel-pad" aria-label="Works waiting to be published">
          <div className="caps muted">Catalogue</div>
          <h2 className="panel-title serif">Waiting to be published</h2>
          {data.draftWorks.length === 0 ? <p className="ov-empty">Every work is published or scheduled.</p> : (
            <div className="signal-list">
              {data.draftWorks.map((w) => (
                <Link key={w.id} href={`/editions/catalogue/${w.slug}`} className="signal">
                  <span className="signal-icon"><Icon name="image" size={18} /></span>
                  <span className="signal-text"><strong>{w.title}</strong><span>Draft · open to finish and publish</span></span>
                  <Icon name="chevron" size={15} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="workspace-foot">
        <span>LGNDRY.Co / Studio Desk &nbsp; / &nbsp; {new Date().getFullYear()}</span>
        <span>Computed from live records</span>
      </div>
    </>
  );
}
