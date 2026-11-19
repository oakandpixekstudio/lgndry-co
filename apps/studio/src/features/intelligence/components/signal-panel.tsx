import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Signal } from "../types";

/** A list of rule-based signals. The rule that produced each one is exposed as its title attribute. */
export function SignalPanel({
  eyebrow,
  title,
  signals,
  sectionLabel,
}: {
  eyebrow: string;
  title: string;
  signals: Signal[];
  sectionLabel: string;
}) {
  return (
    <section className="panel panel-pad" aria-label={sectionLabel}>
      <div className="caps muted">{eyebrow}</div>
      <h2 className="panel-title serif">{title}</h2>
      <div className="signal-list">
        {signals.map((s) => (
          <Link key={s.id} href={s.href} className="signal" title={s.basis}>
            <span className="signal-icon">
              <Icon name={s.icon} size={18} />
            </span>
            <span className="signal-text">
              <strong>{s.title}</strong>
              <span>{s.detail}</span>
            </span>
            <Icon name="chevron" size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}
