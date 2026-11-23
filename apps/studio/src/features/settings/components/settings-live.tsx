import type { StaffMember } from "@/features/auth/staff";
import type { Connection, SettingsData } from "../live";

const day = (iso: string) => new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));

/**
 * What each role can really do. This mirrors the rules the database enforces (row-level security), so it describes the
 * system as it is, not as a wish. "Own" means only the shoots assigned to that person.
 */
const ACCESS: Array<{ area: string; owner: string; manager: string; finance: string; photographer: string; analyst: string }> = [
  { area: "Works and website images", owner: "Edit", manager: "Edit", finance: "View", photographer: "View", analyst: "View" },
  { area: "Customers", owner: "Edit", manager: "Edit", finance: "View", photographer: "None", analyst: "None" },
  { area: "Enquiries", owner: "Edit", manager: "Edit", finance: "View", photographer: "None", analyst: "None" },
  { area: "Bookings", owner: "Edit", manager: "Edit", finance: "View", photographer: "Own", analyst: "None" },
  { area: "Inbox and campaign drafts", owner: "Edit", manager: "Edit", finance: "None", photographer: "None", analyst: "None" },
  { area: "Insights", owner: "View", manager: "View", finance: "None", photographer: "None", analyst: "None" },
  { area: "Audit log", owner: "View", manager: "None", finance: "View", photographer: "None", analyst: "None" },
  { area: "Remove unused picture files", owner: "Yes", manager: "None", finance: "None", photographer: "None", analyst: "None" },
];

const STATE_LABEL: Record<Connection["state"], string> = { on: "Connected", off: "Not set up", waiting: "Waiting" };
const STATE_TONE: Record<Connection["state"], string> = { on: "success", off: "warning", waiting: "neutral" };

export function SettingsLive({ staff, data }: { staff: StaffMember; data: SettingsData }) {
  const { workspace, connections, team } = data;
  return (
    <div className="cat-page">
      <header className="cat-hero">
        <div>
          <span className="eyebrow">Settings</span>
          <h1 className="workspace-title">Settings. <em>How the studio is set up.</em></h1>
          <p>What is connected, who has access and what each role can do. Only facts are shown: anything the studio has not decided yet is marked as waiting, never filled in.</p>
        </div>
      </header>

      <div className="set-grid">
        <section className="cat-card" aria-label="Your account">
          <header><div><span className="eyebrow">You</span><h2>Your account</h2></div></header>
          <dl className="enq-facts">
            <div><dt>Name</dt><dd>{staff.name}</dd></div>
            <div><dt>Email</dt><dd>{staff.email}</dd></div>
            <div><dt>Role</dt><dd>{staff.roleLabel}</dd></div>
          </dl>
        </section>

        {workspace ? (
          <section className="cat-card" aria-label="Studio details">
            <header><div><span className="eyebrow">Studio</span><h2>Studio details</h2></div></header>
            <dl className="enq-facts">
              <div><dt>Studio name</dt><dd>{workspace.name}</dd></div>
              <div><dt>Time zone</dt><dd>{workspace.timezone}</dd></div>
              <div><dt>Currency</dt><dd>{workspace.currency} (South African rand)</dd></div>
              <div><dt>Legal name</dt><dd className={workspace.legalNameSet ? "" : "cust-muted"}>{workspace.legalNameSet ? "Recorded" : "Not set. Waiting for the owner to confirm the registered business details."}</dd></div>
              <div><dt>VAT</dt><dd className={workspace.taxSet ? "" : "cust-muted"}>{workspace.taxSet ? "Recorded" : "Not set. Waiting for the owner and accountant. No tax invoices can be issued until it is."}</dd></div>
            </dl>
          </section>
        ) : null}
      </div>

      {connections.length > 0 ? (
        <section className="cat-card set-block" aria-label="Connections">
          <header><div><span className="eyebrow">Connections</span><h2>What is connected</h2></div></header>
          <ul className="set-list">
            {connections.map((item) => (
              <li key={item.id}><span><strong>{item.name}</strong><small>{item.detail}</small></span><span className={`workspace-status tone-${STATE_TONE[item.state]}`}>{STATE_LABEL[item.state]}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      {team ? (
        <section className="cat-card set-block" aria-label="Team">
          <header><div><span className="eyebrow">Team</span><h2>Who has access</h2></div></header>
          {"unavailable" in team ? <p className="cust-muted">{team.unavailable}</p> : (
            <>
              <ul className="set-list">
                {team.members.map((member) => (
                  <li key={`${member.email}-${member.role}`}><span><strong>{member.email}</strong><small>Joined {day(member.joined)}</small></span><span className={`workspace-status tone-${member.active ? "success" : "neutral"}`}>{member.role}{member.active ? "" : " (inactive)"}</span></li>
                ))}
              </ul>
              <p className="cust-muted">Adding or removing staff is done in the Supabase dashboard for now. A safe invite and role-change flow in the studio comes with two-step sign-in.</p>
            </>
          )}
        </section>
      ) : null}

      <section className="cat-card set-block" aria-label="Roles and access">
        <header><div><span className="eyebrow">Access</span><h2>What each role can do</h2></div></header>
        <div className="set-table-wrap">
          <table className="set-table">
            <thead><tr><th scope="col">Area</th><th scope="col">Owner</th><th scope="col">Studio manager</th><th scope="col">Finance</th><th scope="col">Photographer</th><th scope="col">Analyst</th></tr></thead>
            <tbody>
              {ACCESS.map((row) => (
                <tr key={row.area}><th scope="row">{row.area}</th><td>{row.owner}</td><td>{row.manager}</td><td>{row.finance}</td><td>{row.photographer}</td><td>{row.analyst}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="cust-muted">This is enforced by the database itself, so a screen cannot grant more than is shown here. &ldquo;Own&rdquo; means only the shoots assigned to that person.</p>
      </section>
    </div>
  );
}
