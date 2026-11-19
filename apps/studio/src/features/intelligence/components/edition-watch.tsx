import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { pad2 } from "@/lib/format";
import type { IntelligenceSnapshot } from "../types";

export function EditionWatch({ edition, featured }: { edition: IntelligenceSnapshot["edition"]; featured: IntelligenceSnapshot["featured"] }) {
  const rows = [
    { icon: "alert", label: "Low-edition alerts", value: edition.lowEditionAlerts, alert: true, href: "/editions" },
    { icon: "layers", label: "In production", value: edition.inProduction, href: "/orders" },
    { icon: "truck", label: "In transit", value: edition.inTransit, href: "/orders" },
    { icon: "circle-check", label: "Delivered (30 days)", value: edition.delivered30d, href: "/orders" },
  ] as const;

  return (
    <section className="panel edition-watch" aria-label="Edition match and fulfilment">
      <div>
        <div className="caps muted">Edition match &amp; fulfilment</div>
        <h2 className="panel-title serif">Editions, production &amp; delivery</h2>
        <div className="watch-list">
          {rows.map((r) => (
            <Link key={r.label} href={r.href} className="watch-row">
              <Icon name={r.icon} size={17} />
              <span>{r.label}</span>
              <b className={`tabnum${"alert" in r && r.alert ? " is-alert" : ""}`}>{pad2(r.value)}</b>
              <Icon name="chevron" size={14} />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="caps" style={{ marginBottom: 4 }}>
          Top-selling editions (30 days)
        </div>
        <div className="top-sellers">
          {edition.top.map((t, i) => (
            <div className="top-seller" key={t.name}>
              <span>{pad2(i + 1)}</span>
              <span>
                {t.name} &mdash; {t.edition}
              </span>
              <strong>{t.sold} sold</strong>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="caps">Featured artworks</div>
        <div className="featured-art">
          {featured.map((f) => (
            <Link key={f.name} href="/editions" style={{ display: "block" }}>
              <figure style={{ margin: 0 }}>
                <div className="art-frame">
                  <Image src={f.art} alt={f.artAlt} width={500} height={320} unoptimized />
                </div>
                <figcaption>
                  <em>{f.name}.</em>
                  <small>
                    {f.edition} &nbsp;/&nbsp; {f.remaining} of {f.total} remaining
                  </small>
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
