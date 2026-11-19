import type { IconName } from "@/components/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Breadcrumb text in the topbar. */
  crumb: string;
}

/** Fixed order from docs/05_BRAND_AND_DESIGN_SYSTEM.md section 6. Do not reorder. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/overview", label: "Overview", icon: "grid", crumb: "Intelligence Center" },
  { href: "/customers", label: "Customers", icon: "users", crumb: "Customers" },
  { href: "/orders", label: "Orders", icon: "box", crumb: "Orders" },
  { href: "/editions", label: "Editions", icon: "image", crumb: "Editions" },
  { href: "/bookings", label: "Bookings", icon: "calendar", crumb: "Bookings" },
  { href: "/invoices", label: "Invoices", icon: "file", crumb: "Invoices" },
  { href: "/enquiries", label: "Enquiries", icon: "mail", crumb: "Enquiries" },
  { href: "/inbox", label: "Inbox", icon: "inbox", crumb: "Inbox" },
  { href: "/campaigns", label: "Campaigns", icon: "megaphone", crumb: "Campaigns" },
  { href: "/insights", label: "Insights", icon: "chart", crumb: "Insights" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "sliders", crumb: "Settings" },
];

export const ALL_NAV = [...PRIMARY_NAV, ...ADMIN_NAV];

export function crumbFor(pathname: string): string {
  const hit = ALL_NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
  return (hit?.crumb ?? "Studio Desk").toUpperCase();
}

/** Actionable-record counts shown on nav items. Derived from records, never hard-coded in production. */
export type NavCounts = Partial<Record<string, number>>;
