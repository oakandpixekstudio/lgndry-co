import type { WorkspaceConfig, WorkspaceRow } from "./types";

const ART = ["/artwork-placeholders/dune.svg", "/artwork-placeholders/cliff.svg", "/artwork-placeholders/waves.svg"];

function adminRow(id: string, title: string, subtitle: string, bucket: string, status: string, cells: Record<string, string>, index: number): WorkspaceRow {
  return {
    id,
    title,
    subtitle,
    bucket,
    status,
    tone: status === "Active" || status === "Enabled" ? "success" : status === "Needs review" ? "warning" : "neutral",
    cells,
    image: ART[index % ART.length],
    detail: {
      metrics: [
        { label: "Status", value: status },
        { label: "Section", value: bucket },
        { label: "Last updated", value: cells.updated ?? "18 Nov 2026" },
        { label: "Owner", value: cells.owner ?? "Studio Manager" },
      ],
      facts: [
        { label: "Record ID", value: id },
        { label: "Name", value: title },
        { label: "Section", value: bucket },
        { label: "Owner", value: cells.owner ?? "Studio Manager" },
        { label: "Updated", value: cells.updated ?? "18 Nov 2026" },
      ],
      description: subtitle,
      secondaryTitle: "Prototype notes",
      tags: [bucket, status, "Studio Desk"],
    },
  };
}

export const insightsWorkspace: WorkspaceConfig = {
  entity: "insights",
  eyebrow: "Insights",
  title: "Insights.",
  editorial: "Patterns, signals and perspective.",
  subtitle: "Create, review and maintain explainable studio intelligence records before live analytics are connected.",
  intelligenceLabel: "Insight intelligence (30 days)",
  metrics: [
    { label: "Active insights", value: "18", change: "+4 this period", tone: "success", icon: "chart" },
    { label: "Opportunities", value: "7", change: "3 high priority", tone: "warning", icon: "star" },
    { label: "Resolved", value: "11", change: "+22% vs. previous period", tone: "success", icon: "circle-check" },
    { label: "Data signals", value: "42", change: "Prototype rules", icon: "layers" },
    { label: "Owners", value: "4", change: "Across studio teams", icon: "users" },
    { label: "Needs review", value: "3", change: "Attention required", tone: "warning", icon: "alert" },
  ],
  tabs: [
    { label: "All Insights", bucket: "all", count: 18 },
    { label: "Commerce", bucket: "Commerce", count: 6 },
    { label: "Collectors", bucket: "Collectors", count: 5 },
    { label: "Bookings", bucket: "Bookings", count: 4 },
    { label: "Operations", bucket: "Operations", count: 3 },
  ],
  primaryAction: "New insight",
  searchPlaceholder: "Search insights, signals or owners…",
  filters: ["Category", "Priority", "Status"],
  columns: [
    { key: "category", label: "Category" },
    { key: "priority", label: "Priority" },
    { key: "owner", label: "Owner" },
    { key: "updated", label: "Last updated" },
  ],
  rows: [
    adminRow("INS-0018", "Limited edition demand rising", "+37% edition views compared with the previous 30 days.", "Commerce", "Active", { category: "Commerce", priority: "High", owner: "Studio Manager", updated: "18 Nov 2026" }, 0),
    adminRow("INS-0017", "Repeat collector opportunity", "Twelve past clients are likely to collect again based on visible activity rules.", "Collectors", "Needs review", { category: "Collectors", priority: "High", owner: "LS", updated: "18 Nov 2026" }, 1),
    adminRow("INS-0016", "Booking demand rising", "Editorial booking requests increased during this period.", "Bookings", "Active", { category: "Bookings", priority: "Medium", owner: "Bookings", updated: "17 Nov 2026" }, 2),
    adminRow("INS-0015", "Fulfilment health on track", "Thirty-one of thirty-two orders remain within target.", "Operations", "Resolved", { category: "Operations", priority: "Low", owner: "Operations", updated: "16 Nov 2026" }, 0),
  ],
  detailTabs: ["Overview", "Evidence", "Activity", "Notes"],
  detailActions: ["Assign owner", "Mark resolved"],
};

export const settingsWorkspace: WorkspaceConfig = {
  entity: "settings",
  eyebrow: "Settings",
  title: "Settings.",
  editorial: "The studio, configured with intention.",
  subtitle: "Manage business details, team access, integrations, tax rules, numbering and operational preferences.",
  intelligenceLabel: "Workspace configuration",
  metrics: [
    { label: "Configuration records", value: "12", change: "Prototype workspace", icon: "sliders" },
    { label: "Active team", value: "4", change: "2 administrators", icon: "users" },
    { label: "Connected services", value: "0", change: "Not connected yet", tone: "warning", icon: "layers" },
    { label: "Permission groups", value: "3", change: "Draft roles", icon: "user" },
    { label: "Document sequences", value: "4", change: "2026 numbering", icon: "file" },
    { label: "Needs review", value: "3", change: "Before launch", tone: "warning", icon: "alert" },
  ],
  tabs: [
    { label: "All Settings", bucket: "all", count: 12 },
    { label: "Business", bucket: "Business", count: 3 },
    { label: "Team & Access", bucket: "Team & Access", count: 4 },
    { label: "Integrations", bucket: "Integrations", count: 3 },
    { label: "Documents", bucket: "Documents", count: 2 },
  ],
  primaryAction: "New setting",
  searchPlaceholder: "Search settings, team members or integrations…",
  filters: ["Section", "Status", "Owner"],
  columns: [
    { key: "section", label: "Section" },
    { key: "value", label: "Current value" },
    { key: "owner", label: "Owner" },
    { key: "updated", label: "Last updated" },
  ],
  rows: [
    adminRow("SET-0012", "Studio profile", "Business identity, contact details and public studio information.", "Business", "Active", { section: "Business", value: "LGNDRY.Co", owner: "Studio Manager", updated: "18 Nov 2026" }, 0),
    adminRow("SET-0011", "Studio Manager", "Primary administrator access for the Studio Desk.", "Team & Access", "Active", { section: "Team & Access", value: "Administrator", owner: "LS", updated: "18 Nov 2026" }, 1),
    adminRow("SET-0010", "Commerce email", "Transactional email provider connection and sender identity.", "Integrations", "Needs review", { section: "Integrations", value: "Not connected", owner: "Studio Manager", updated: "17 Nov 2026" }, 2),
    adminRow("SET-0009", "Invoice numbering", "Prefix and sequence used for generated invoice records.", "Documents", "Enabled", { section: "Documents", value: "INV-2026-####", owner: "Finance", updated: "16 Nov 2026" }, 0),
    adminRow("SET-0008", "VAT configuration", "Tax behavior remains disabled until the registered details are confirmed.", "Business", "Needs review", { section: "Business", value: "Disabled", owner: "Finance", updated: "15 Nov 2026" }, 1),
    adminRow("SET-0007", "Storefront connection", "Connection state for the public commerce experience.", "Integrations", "Draft", { section: "Integrations", value: "Not connected", owner: "Studio Manager", updated: "14 Nov 2026" }, 2),
  ],
  detailTabs: ["Overview", "Permissions", "Activity", "Audit log"],
  detailActions: ["Review access", "View audit trail"],
};
