import Link from "next/link";
import { Icon } from "@/components/icons";
import { johannesburgYmd, monthLabel, pad2 } from "@/lib/format";
import type { IntelligenceSnapshot } from "../types";

const DOW = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Month grid (Monday first). Today is highlighted; confirmed shoots are filled dots, tentative ones hollow. */
function Calendar({ today, shoots }: { today: { year: number; month: number; day: number }; shoots: IntelligenceSnapshot["bookings"]["shoots"] }) {
  const { year, month } = today;
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday = 0
  const prevDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: { label: number; other: boolean; iso?: string }[] = [];
  for (let i = lead - 1; i >= 0; i--) cells.push({ label: prevDays - i, other: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ label: d, other: false, iso: `${year}-${pad2(month)}-${pad2(d)}` });
  while (cells.length % 7 !== 0) cells.push({ label: cells.length - lead - daysInMonth + 1, other: true });

  const byDate = new Map(shoots.map((s) => [s.date, s.status]));

  return (
    <div className="calendar">
      <div className="cal-head">
        <span aria-hidden="true">
          <Icon name="arrow-left" size={12} />
        </span>
        <span>{monthLabel(year, month)}</span>
        <span aria-hidden="true">
          <Icon name="arrow" size={12} />
        </span>
      </div>
      <div className="cal-grid" role="grid" aria-label={`Calendar, ${monthLabel(year, month)}`}>
        {DOW.map((d) => (
          <div key={d} className="cal-dow" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const status = c.iso ? byDate.get(c.iso) : undefined;
          const isToday = !c.other && c.label === today.day;
          return (
            <div
              key={i}
              role="gridcell"
              className={`cal-day${c.other ? " is-other" : ""}${isToday ? " is-today" : ""}`}
              aria-label={`${c.label}${isToday ? ", today" : ""}${status ? `, ${status} shoot` : ""}`}
            >
              <span>{c.label}</span>
              {status ? <i className={`cal-dot${status === "tentative" ? " tentative" : ""}`} /> : null}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span>
          <i /> Confirmed
        </span>
        <span>
          <i className="tentative" /> Tentative
        </span>
      </div>
    </div>
  );
}

export function BookingsPanel({ bookings, now }: { bookings: IntelligenceSnapshot["bookings"]; now: Date }) {
  const today = johannesburgYmd(now);
  return (
    <section className="panel panel-pad" aria-labelledby="bookings-title">
      <div className="panel-head">
        <div>
          <div className="caps muted">Photography bookings</div>
          <h2 className="panel-title serif" id="bookings-title">
            Studio bookings &amp; shoots
          </h2>
        </div>
        <Link href="/bookings" className="text-action">
          View bookings <Icon name="arrow" size={13} />
        </Link>
      </div>

      <div className="booking-body">
        <div className="booking-stats">
          <Link href="/bookings" className="booking-stat">
            <Icon name="camera" size={16} /> Upcoming shoots <b className="tabnum">{pad2(bookings.upcoming)}</b>
          </Link>
          <Link href="/bookings" className="booking-stat">
            <Icon name="layers" size={16} /> Booking pipeline <b className="tabnum">{pad2(bookings.pipeline)}</b>
          </Link>
          <Link href="/bookings" className="booking-stat">
            <Icon name="clock" size={16} /> Pending requests <b className="tabnum">{pad2(bookings.pending)}</b>
          </Link>
        </div>
        <Calendar today={today} shoots={bookings.shoots} />
      </div>

      <div className="next-shoots">
        <span className="next-shoots-label">Next shoots</span>
        {bookings.shoots.map((s) => {
          const [, m, d] = s.date.split("-");
          return (
            <div className="shoot-chip" key={s.date + s.title}>
              <span className="shoot-date">
                {MONTHS_SHORT[Number(m) - 1]}
                <b>{d}</b>
              </span>
              <span>
                <strong>{s.title}</strong>
                <small>
                  {s.client} · {s.status === "confirmed" ? "Confirmed" : "Tentative"}
                </small>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
