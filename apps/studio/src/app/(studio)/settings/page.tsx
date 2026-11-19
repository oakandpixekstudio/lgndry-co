import type { Metadata } from "next";
import { PhasePlaceholder } from "@/components/editorial/phase-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PhasePlaceholder
      eyebrow="10 / WORKSPACE SETTINGS"
      title={
        <>
          Built with <em>intention.</em>
        </>
      }
      sub="Staff, roles, business details, integrations, tax settings and audit logs."
      phase="Phase 2 (foundation and secure data)"
      delivers={[
      "Staff invitations, roles and server-enforced permissions",
      "Honest integration status: payments, email and storefront",
      "Document numbering, VAT settings (disabled until confirmed) and the audit log"
    ]}
    />
  );
}
