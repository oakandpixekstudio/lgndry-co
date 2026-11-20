import type { WorkspaceConfig, WorkspaceDetail, WorkspaceRow, WorkspaceTone } from "./types";

const ART = ["/artwork-placeholders/dune.svg", "/artwork-placeholders/cliff.svg", "/artwork-placeholders/waves.svg"];

function detail(
  metrics: WorkspaceDetail["metrics"],
  facts: WorkspaceDetail["facts"],
  options: Partial<WorkspaceDetail> = {},
): WorkspaceDetail {
  return { metrics, facts, ...options };
}

function row(
  id: string,
  title: string,
  subtitle: string,
  bucket: string,
  status: string,
  tone: WorkspaceTone,
  cells: Record<string, string>,
  recordDetail: WorkspaceDetail,
  imageIndex = 0,
): WorkspaceRow {
  return { id, title, subtitle, bucket, status, tone, cells, detail: recordDetail, image: ART[imageIndex % ART.length] };
}

const customerDetail = (value: string, orders: string, bookings: string, email: string, location: string) =>
  detail(
    [
      { label: "Lifetime value", value },
      { label: "Total orders", value: orders },
      { label: "Total bookings", value: bookings },
      { label: "Last activity", value: "18 Nov 2026" },
    ],
    [
      { label: "Email", value: email },
      { label: "Phone", value: "+27 82 415 7690" },
      { label: "Company", value: "Coastline Advisory" },
      { label: "Location", value: location },
      { label: "Customer since", value: "12 Feb 2025" },
    ],
    {
      description: "A long-term collector with a strong interest in limited editions, coastal landscapes and architectural work.",
      secondaryTitle: "Collector profile",
      secondaryFacts: [
        { label: "Email engagement", value: "High" },
        { label: "Purchase frequency", value: "Regular" },
        { label: "Booking engagement", value: "Active" },
      ],
      tags: ["Limited Editions", "Large Formats", "Coastal", "Architecture"],
    },
  );

export const customersWorkspace: WorkspaceConfig = {
  entity: "customers",
  eyebrow: "Customers",
  title: "Customers.",
  editorial: "Collectors, clients and collaborators.",
  subtitle: "A complete view of your collectors, customers and bookers — their purchases, bookings, value and engagement.",
  intelligenceLabel: "Customer intelligence (30 days)",
  metrics: [
    { label: "Total customers", value: "648", change: "+6.2% vs. previous period", tone: "success", icon: "users" },
    { label: "Active customers", value: "412", change: "+8.7% vs. previous period", tone: "success", icon: "layers" },
    { label: "New collectors", value: "19", change: "+6 vs. previous period", tone: "success", icon: "star" },
    { label: "Repeat customers", value: "41%", change: "+7 pp vs. previous period", tone: "success", icon: "refresh" },
    { label: "Customer value (LTV)", value: "R 26,840", change: "+14.9% vs. previous period", tone: "success", icon: "bars" },
    { label: "Booking clients", value: "127", change: "+11.4% vs. previous period", tone: "success", icon: "calendar" },
  ],
  tabs: [
    { label: "All Customers", bucket: "all", count: 648 },
    { label: "Collectors", bucket: "Collector", count: 312 },
    { label: "Booking Clients", bucket: "Booking Client", count: 127 },
    { label: "Trade & Partners", bucket: "Trade Partner", count: 54 },
  ],
  primaryAction: "Add customer",
  searchPlaceholder: "Search customers by name, email or company…",
  filters: ["Customer type", "Status", "Value"],
  columns: [
    { key: "type", label: "Type" },
    { key: "value", label: "Lifetime value", align: "right" },
    { key: "orders", label: "Orders", align: "center" },
    { key: "bookings", label: "Bookings", align: "center" },
    { key: "activity", label: "Last activity" },
  ],
  rows: [
    row("CUS-0648", "Michael Sinder", "m.sinder@coastline.co.za", "Collector", "Active", "success", { type: "Collector", value: "R 184,260", orders: "5", bookings: "2", activity: "18 Nov 2026" }, customerDetail("R 184,260", "5", "2", "m.sinder@coastline.co.za", "Cape Town, South Africa"), 0),
    row("CUS-0647", "Amanda Dlamini", "amandla@orioncapital.co.za", "Collector", "Active", "success", { type: "Collector", value: "R 72,400", orders: "3", bookings: "1", activity: "16 Nov 2026" }, customerDetail("R 72,400", "3", "1", "amandla@orioncapital.co.za", "Johannesburg, South Africa"), 1),
    row("CUS-0646", "Thandiwe Mokoena", "thandiwe@mokoenagallery.co.za", "Booking Client", "Active", "success", { type: "Booking Client", value: "R 38,000", orders: "1", bookings: "4", activity: "14 Nov 2026" }, customerDetail("R 38,000", "1", "4", "thandiwe@mokoenagallery.co.za", "Pretoria, South Africa"), 2),
    row("CUS-0645", "James Carter", "j.carter@stonefield.co.uk", "Collector", "Active", "success", { type: "Collector", value: "R 126,000", orders: "4", bookings: "1", activity: "12 Nov 2026" }, customerDetail("R 126,000", "4", "1", "j.carter@stonefield.co.uk", "London, United Kingdom"), 0),
    row("CUS-0644", "Naledi Khumalo", "naledi@khumalo.studio", "Booking Client", "Active", "success", { type: "Booking Client", value: "R 22,500", orders: "—", bookings: "3", activity: "11 Nov 2026" }, customerDetail("R 22,500", "0", "3", "naledi@khumalo.studio", "Cape Town, South Africa"), 1),
    row("CUS-0643", "David Rensburg", "david@rensburg.co.za", "Trade Partner", "Active", "success", { type: "Trade Partner", value: "R 310,000", orders: "8", bookings: "—", activity: "10 Nov 2026" }, customerDetail("R 310,000", "8", "0", "david@rensburg.co.za", "Stellenbosch, South Africa"), 2),
    row("CUS-0642", "Elena Moretti", "elena@morettiart.it", "Collector", "Inactive", "neutral", { type: "Collector", value: "R 96,000", orders: "3", bookings: "—", activity: "08 Nov 2026" }, customerDetail("R 96,000", "3", "0", "elena@morettiart.it", "Milan, Italy"), 0),
    row("CUS-0641", "Kabelo Maseko", "k.maseko@aurora.co.za", "Booking Client", "Active", "success", { type: "Booking Client", value: "R 18,400", orders: "—", bookings: "2", activity: "07 Nov 2026" }, customerDetail("R 18,400", "0", "2", "k.maseko@aurora.co.za", "Cape Town, South Africa"), 1),
  ],
  detailTabs: ["Overview", "Orders", "Bookings", "Invoices", "Communication", "Notes"],
  detailActions: ["Message customer", "Create booking"],
};

const orderDetail = (value: string, payment: string, fulfilment: string, edition: string) =>
  detail(
    [
      { label: "Order value", value },
      { label: "Payment", value: payment, tone: payment === "Paid" ? "success" : "warning" },
      { label: "Fulfilment", value: fulfilment, tone: fulfilment === "In Production" ? "info" : "neutral" },
      { label: "Edition", value: edition },
    ],
    [
      { label: "Artwork", value: "A Quiet Form — Edition II" },
      { label: "Format", value: "Fine Art Print · 60 × 90 cm" },
      { label: "Quantity", value: "1" },
      { label: "Delivery", value: "Cape Town, South Africa" },
    ],
    { progress: { current: payment === "Paid" ? 2 : 0, steps: ["Order received", "Payment confirmed", "In production", "Ready to ship", "Completed"] } },
  );

export const ordersWorkspace: WorkspaceConfig = {
  entity: "orders",
  eyebrow: "Orders",
  title: "Orders.",
  editorial: "Sales, editions and fulfilment.",
  subtitle: "Manage fine art orders, print editions and deliveries — from purchase to fulfilment.",
  intelligenceLabel: "Order intelligence (30 days)",
  metrics: [
    { label: "Total orders", value: "32", change: "+28% vs. previous period", tone: "success", icon: "box" },
    { label: "Order value", value: "R 184,260", change: "+14.6% vs. previous period", tone: "success", icon: "bars" },
    { label: "Average order value", value: "R 5,758", change: "+9.1% vs. previous period", tone: "success", icon: "trend" },
    { label: "Paid orders", value: "25", change: "78% of total orders", icon: "circle-check" },
    { label: "Pending payment", value: "5", change: "Needs attention →", tone: "warning", icon: "clock" },
    { label: "Fulfilment rate", value: "92%", change: "+4 pp vs. previous period", tone: "success", icon: "layers" },
  ],
  tabs: [
    { label: "All Orders", bucket: "all", count: 32 },
    { label: "Awaiting Payment", bucket: "Awaiting Payment", count: 5 },
    { label: "Processing", bucket: "Processing", count: 8 },
    { label: "In Production", bucket: "In Production", count: 6 },
    { label: "Ready to Ship", bucket: "Ready to Ship", count: 4 },
    { label: "Completed", bucket: "Completed", count: 9 },
  ],
  primaryAction: "New order",
  searchPlaceholder: "Search orders by number, customer, artwork or email…",
  filters: ["Order type", "Payment status", "Fulfilment status", "Date range"],
  columns: [
    { key: "customer", label: "Customer" },
    { key: "type", label: "Type" },
    { key: "items", label: "Items", align: "center" },
    { key: "value", label: "Value", align: "right" },
    { key: "payment", label: "Payment" },
    { key: "date", label: "Order date" },
  ],
  rows: [
    row("ORD-2026-0417", "ORD-2026-0417", "Edition II · #04 of 25", "In Production", "In Production", "info", { customer: "Michael Sinder", type: "Print", items: "1", value: "R 6,200", payment: "Paid", date: "18 Nov 2026" }, orderDetail("R 6,200", "Paid", "In Production", "#04 of 25"), 0),
    row("ORD-2026-0416", "ORD-2026-0416", "Edition I · #12 of 30", "Awaiting Payment", "Awaiting Payment", "warning", { customer: "Amanda Dlamini", type: "Print", items: "2", value: "R 14,800", payment: "Pending", date: "16 Nov 2026" }, orderDetail("R 14,800", "Pending", "Awaiting Payment", "Reserved"), 1),
    row("ORD-2026-0415", "ORD-2026-0415", "Edition I · #03 of 25", "Ready to Ship", "Ready to Ship", "success", { customer: "Thandiwe Mokoena", type: "Print", items: "1", value: "R 9,600", payment: "Paid", date: "14 Nov 2026" }, orderDetail("R 9,600", "Paid", "Ready to Ship", "#03 of 25"), 2),
    row("ORD-2026-0414", "ORD-2026-0414", "Edition II · #06 of 25", "Completed", "Completed", "neutral", { customer: "James Carter", type: "Print", items: "1", value: "R 5,800", payment: "Paid", date: "12 Nov 2026" }, orderDetail("R 5,800", "Paid", "Completed", "#06 of 25"), 0),
    row("ORD-2026-0413", "ORD-2026-0413", "Edition II · #07 of 30", "In Production", "In Production", "info", { customer: "Naledi Khumalo", type: "Framed", items: "1", value: "R 12,400", payment: "Paid", date: "11 Nov 2026" }, orderDetail("R 12,400", "Paid", "In Production", "#07 of 30"), 1),
    row("ORD-2026-0412", "ORD-2026-0412", "Edition II · #05 of 25", "Awaiting Payment", "Awaiting Payment", "warning", { customer: "David Rensburg", type: "Print", items: "3", value: "R 18,600", payment: "Pending", date: "10 Nov 2026" }, orderDetail("R 18,600", "Pending", "Awaiting Payment", "Reserved"), 2),
    row("ORD-2026-0411", "ORD-2026-0411", "Open Edition", "Completed", "Completed", "neutral", { customer: "Elena Moretti", type: "Print", items: "1", value: "R 4,900", payment: "Paid", date: "08 Nov 2026" }, orderDetail("R 4,900", "Paid", "Completed", "Open Edition"), 0),
    row("ORD-2026-0410", "ORD-2026-0410", "Edition II · #02 of 25", "Ready to Ship", "Ready to Ship", "success", { customer: "Kabelo Maseko", type: "Framed", items: "1", value: "R 11,500", payment: "Paid", date: "07 Nov 2026" }, orderDetail("R 11,500", "Paid", "Ready to Ship", "#02 of 25"), 1),
  ],
  detailTabs: ["Overview", "Items (1)", "Fulfilment", "Invoice", "Communication", "Activity"],
  detailActions: ["Update fulfilment", "Message customer", "View invoice"],
};

const editionDetail = (run: number, sold: number, available: number) =>
  detail(
    [
      { label: "Edition run", value: String(run) },
      { label: "Sold", value: String(sold) },
      { label: "Available", value: String(available) },
      { label: "Sell-through", value: `${Math.round((sold / run) * 100)}%` },
    ],
    [
      { label: "Edition", value: "Edition II" },
      { label: "Edition type", value: "Limited Edition" },
      { label: "Format", value: "60 × 90 cm" },
      { label: "Medium", value: "Fine Art Print" },
      { label: "Paper", value: "Hahnemühle Photo Rag" },
      { label: "Framing", value: "Unframed / Framed" },
    ],
    { editionRun: { total: run, sold } },
  );

export const editionsWorkspace: WorkspaceConfig = {
  entity: "editions",
  eyebrow: "Editions",
  title: "Editions.",
  editorial: "Limited works, defined by edition.",
  subtitle: "Manage your limited and open editions, inventory, pricing and sales performance.",
  intelligenceLabel: "Edition intelligence (all editions)",
  metrics: [
    { label: "Total editions", value: "14", change: "+27% vs. previous period", tone: "success", icon: "layers" },
    { label: "Total prints (run)", value: "420", change: "+20% vs. previous period", tone: "success", icon: "box" },
    { label: "Prints sold", value: "286", change: "+32% vs. previous period", tone: "success", icon: "chart" },
    { label: "Sell-through rate", value: "68%", change: "+12 pp vs. previous period", tone: "success", icon: "refresh" },
    { label: "Revenue (editions)", value: "R 1,842,600", change: "+18.6% vs. previous period", tone: "success", icon: "bars" },
    { label: "Low stock editions", value: "3", change: "Needs attention →", tone: "warning", icon: "alert" },
  ],
  tabs: [
    { label: "All Editions", bucket: "all", count: 14 },
    { label: "Limited Editions", bucket: "Limited", count: 9 },
    { label: "Open Editions", bucket: "Open", count: 5 },
    { label: "Active", bucket: "Active", count: 12 },
    { label: "Archived", bucket: "Archived", count: 2 },
  ],
  primaryAction: "New edition",
  searchPlaceholder: "Search editions by title, edition number or tag…",
  filters: ["Edition type", "Status", "Availability", "Sort: Newest"],
  columns: [
    { key: "type", label: "Type" },
    { key: "run", label: "Edition run", align: "center" },
    { key: "sold", label: "Sold", align: "center" },
    { key: "available", label: "Available", align: "center" },
    { key: "price", label: "Price (from)", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
  ],
  rows: [
    row("ED-0014", "A Quiet Form", "Edition II · #02 of 25", "Limited", "Active", "success", { type: "Limited", run: "25", sold: "17", available: "8", price: "R 6,200", revenue: "R 105,400" }, editionDetail(25, 17, 8), 0),
    row("ED-0013", "Salt & Stone", "Edition I · #01 of 30", "Limited", "Active", "success", { type: "Limited", run: "30", sold: "24", available: "6", price: "R 6,800", revenue: "R 163,200" }, editionDetail(30, 24, 6), 1),
    row("ED-0012", "Desert Light", "Edition I · #03 of 25", "Limited", "Active", "success", { type: "Limited", run: "25", sold: "18", available: "7", price: "R 5,900", revenue: "R 106,200" }, editionDetail(25, 18, 7), 2),
    row("ED-0011", "The Dune", "Edition I · #04 of 20", "Limited", "Sold Out", "neutral", { type: "Limited", run: "20", sold: "20", available: "0", price: "R 7,500", revenue: "R 150,000" }, editionDetail(20, 20, 0), 0),
    row("ED-0010", "Coastal Study", "Open Edition", "Open", "Active", "success", { type: "Open", run: "—", sold: "142", available: "—", price: "R 3,900", revenue: "R 553,800" }, editionDetail(200, 142, 58), 1),
    row("ED-0009", "Stonefield", "Edition II · #06 of 30", "Limited", "Active", "success", { type: "Limited", run: "30", sold: "12", available: "18", price: "R 6,200", revenue: "R 74,400" }, editionDetail(30, 12, 18), 2),
    row("ED-0008", "Horizon Line", "Open Edition", "Open", "Active", "success", { type: "Open", run: "—", sold: "85", available: "—", price: "R 3,600", revenue: "R 306,000" }, editionDetail(120, 85, 35), 0),
    row("ED-0007", "The Ridge", "Edition I · #08 of 25", "Limited", "Low Stock", "warning", { type: "Limited", run: "25", sold: "13", available: "12", price: "R 6,800", revenue: "R 88,400" }, editionDetail(25, 13, 12), 1),
  ],
  detailTabs: ["Overview", "Sales", "Inventory", "Pricing", "Production", "Activity"],
  detailActions: ["Create order", "Update inventory", "View on website"],
};

const bookingDetail = (value: string, date: string, status: string) =>
  detail(
    [
      { label: "Booking value", value },
      { label: "Shoot date", value: date },
      { label: "Duration", value: "8 hours" },
      { label: "Location", value: "Cape Town" },
    ],
    [
      { label: "Client", value: "Michael Sinder" },
      { label: "Company", value: "Coastline Advisory" },
      { label: "Shoot type", value: "Editorial" },
      { label: "Purpose", value: "Editorial feature" },
      { label: "Team size", value: "4 people" },
    ],
    { progress: { current: status === "Confirmed" ? 1 : status === "In Progress" ? 2 : 0, steps: ["Request", "Confirmed", "In progress", "Post-production", "Completed"] } },
  );

export const bookingsWorkspace: WorkspaceConfig = {
  entity: "bookings",
  eyebrow: "Bookings",
  title: "Bookings.",
  editorial: "Studio, location and client shoots.",
  subtitle: "Manage shoot bookings, schedules, crews, deliverables and client communication.",
  intelligenceLabel: "Booking intelligence (next 30 days)",
  metrics: [
    { label: "Total bookings", value: "127", change: "+11.4% vs. previous period", tone: "success", icon: "calendar" },
    { label: "Confirmed", value: "42", change: "+27% vs. previous period", tone: "success", icon: "circle-check" },
    { label: "Pending requests", value: "18", change: "Needs attention →", tone: "warning", icon: "clock" },
    { label: "Completed (30 days)", value: "36", change: "+20% vs. previous period", tone: "success", icon: "layers" },
    { label: "Booking value", value: "R 846,200", change: "+18.9% vs. previous period", tone: "success", icon: "bars" },
    { label: "Utilisation (studio)", value: "76%", change: "+8 pp vs. previous period", tone: "success", icon: "chart" },
  ],
  tabs: [
    { label: "All Bookings", bucket: "all", count: 127 },
    { label: "Confirmed", bucket: "Confirmed", count: 42 },
    { label: "Pending", bucket: "Pending", count: 18 },
    { label: "In Progress", bucket: "In Progress", count: 12 },
    { label: "Completed", bucket: "Completed", count: 36 },
    { label: "Cancelled", bucket: "Cancelled", count: 7 },
  ],
  primaryAction: "New booking",
  searchPlaceholder: "Search bookings by client, project or reference…",
  filters: ["Shoot type", "Date range", "Status", "Assigned to"],
  columns: [
    { key: "client", label: "Client" },
    { key: "type", label: "Shoot type" },
    { key: "date", label: "Date" },
    { key: "value", label: "Value", align: "right" },
    { key: "schedule", label: "Schedule" },
  ],
  rows: [
    row("BK-2026-0417", "Editorial / Coastline", "BK-2026-0417", "Confirmed", "Confirmed", "success", { client: "Michael Sinder", type: "Editorial", date: "20 Nov 2026", value: "R 48,000", schedule: "08:00–16:00" }, bookingDetail("R 48,000", "20 Nov 2026", "Confirmed"), 0),
    row("BK-2026-0416", "Portrait Series", "BK-2026-0416", "In Progress", "In Progress", "info", { client: "Amanda Dlamini", type: "Portrait", date: "24 Nov 2026", value: "R 18,500", schedule: "09:00–13:00" }, bookingDetail("R 18,500", "24 Nov 2026", "In Progress"), 1),
    row("BK-2026-0415", "Brand Campaign", "BK-2026-0415", "Pending", "Pending", "warning", { client: "Coastline Advisory", type: "Campaign", date: "28 Nov 2026", value: "R 126,000", schedule: "07:00–18:00" }, bookingDetail("R 126,000", "28 Nov 2026", "Pending"), 2),
    row("BK-2026-0414", "Architecture Study", "BK-2026-0414", "Confirmed", "Confirmed", "success", { client: "Stonefield Partners", type: "Architecture", date: "02 Dec 2026", value: "R 64,000", schedule: "08:00–16:00" }, bookingDetail("R 64,000", "02 Dec 2026", "Confirmed"), 0),
    row("BK-2026-0413", "Product / Still Life", "BK-2026-0413", "Confirmed", "Confirmed", "success", { client: "Aurora Gallery", type: "Product", date: "03 Dec 2026", value: "R 28,000", schedule: "09:00–15:00" }, bookingDetail("R 28,000", "03 Dec 2026", "Confirmed"), 1),
    row("BK-2026-0412", "Editorial / Desert", "BK-2026-0412", "In Progress", "In Progress", "info", { client: "Rensburg Studio", type: "Editorial", date: "05 Dec 2026", value: "R 52,000", schedule: "06:00–18:00" }, bookingDetail("R 52,000", "05 Dec 2026", "In Progress"), 2),
    row("BK-2026-0411", "Portrait Commission", "BK-2026-0411", "Confirmed", "Confirmed", "success", { client: "Elena Moretti", type: "Portrait", date: "10 Dec 2026", value: "R 22,500", schedule: "09:00–13:00" }, bookingDetail("R 22,500", "10 Dec 2026", "Confirmed"), 0),
    row("BK-2026-0410", "Campaign / Launch", "BK-2026-0410", "Pending", "Pending", "warning", { client: "Kabelo Maseko", type: "Campaign", date: "12 Dec 2026", value: "R 86,000", schedule: "07:00–17:00" }, bookingDetail("R 86,000", "12 Dec 2026", "Pending"), 1),
  ],
  detailTabs: ["Overview", "Details", "Crew & Resources", "Deliverables", "Communication"],
  detailActions: ["Edit booking", "Message client", "Manage deliverables"],
};

const invoiceDetail = (amount: string, paid: string, balance: string, due: string, status: string) =>
  detail(
    [
      { label: "Invoice amount", value: amount },
      { label: "Amount paid", value: paid },
      { label: "Balance", value: balance },
      { label: "Due date", value: due },
    ],
    [
      { label: "Customer", value: "Michael Sinder" },
      { label: "Type", value: "Order" },
      { label: "Edition", value: "A Quiet Form — Edition II" },
      { label: "Payment method", value: "EFT / QR" },
      { label: "Reference", value: "ORD-2026-0417" },
    ],
    status === "Paid" ? { callout: { title: "Payment received", text: `${amount} paid on 18 Nov 2026`, tone: "success" } } : {},
  );

export const invoicesWorkspace: WorkspaceConfig = {
  entity: "invoices",
  eyebrow: "Invoices",
  title: "Invoices.",
  editorial: "Billing, payments and revenue.",
  subtitle: "Create, manage and track invoices for orders, editions and photography bookings.",
  intelligenceLabel: "Invoice intelligence (30 days)",
  metrics: [
    { label: "Total invoices", value: "64", change: "+18.5% vs. previous period", tone: "success", icon: "file" },
    { label: "Invoiced value", value: "R 2,436,800", change: "+22.1% vs. previous period", tone: "success", icon: "layers" },
    { label: "Amount paid", value: "R 1,842,600", change: "+18.6% vs. previous period", tone: "success", icon: "trend" },
    { label: "Outstanding", value: "R 594,200", change: "24% of invoiced value", tone: "warning", icon: "clock" },
    { label: "Overdue", value: "R 72,400", change: "3 invoices", tone: "warning", icon: "alert" },
    { label: "Payment rate", value: "76%", change: "+8 pp vs. previous period", tone: "success", icon: "chart" },
  ],
  tabs: [
    { label: "All Invoices", bucket: "all", count: 64 },
    { label: "Draft", bucket: "Draft", count: 6 },
    { label: "Awaiting Payment", bucket: "Awaiting Payment", count: 14 },
    { label: "Partially Paid", bucket: "Partially Paid", count: 4 },
    { label: "Paid", bucket: "Paid", count: 37 },
    { label: "Overdue", bucket: "Overdue", count: 3 },
  ],
  primaryAction: "New invoice",
  searchPlaceholder: "Search invoices by number, customer or reference…",
  filters: ["Invoice type", "Status", "Date range"],
  columns: [
    { key: "customer", label: "Customer" },
    { key: "type", label: "Type" },
    { key: "issue", label: "Issue date" },
    { key: "due", label: "Due date" },
    { key: "amount", label: "Amount", align: "right" },
    { key: "balance", label: "Balance", align: "right" },
  ],
  rows: [
    row("INV-2026-0417", "INV-2026-0417", "ORD-2026-0417", "Paid", "Paid", "success", { customer: "Michael Sinder", type: "Order", issue: "18 Nov 2026", due: "25 Nov 2026", amount: "R 6,200", balance: "R 0" }, invoiceDetail("R 6,200", "R 6,200", "R 0", "25 Nov 2026", "Paid"), 0),
    row("INV-2026-0416", "INV-2026-0416", "BK-2026-0416", "Partially Paid", "Partially Paid", "info", { customer: "Amanda Dlamini", type: "Booking", issue: "16 Nov 2026", due: "23 Nov 2026", amount: "R 18,500", balance: "R 9,250" }, invoiceDetail("R 18,500", "R 9,250", "R 9,250", "23 Nov 2026", "Partially Paid"), 1),
    row("INV-2026-0415", "INV-2026-0415", "ORD-2026-0415", "Awaiting Payment", "Awaiting Payment", "warning", { customer: "Thandiwe Mokoena", type: "Order", issue: "14 Nov 2026", due: "21 Nov 2026", amount: "R 9,600", balance: "R 9,600" }, invoiceDetail("R 9,600", "R 0", "R 9,600", "21 Nov 2026", "Awaiting Payment"), 2),
    row("INV-2026-0414", "INV-2026-0414", "BK-2026-0414", "Paid", "Paid", "success", { customer: "James Carter", type: "Booking", issue: "12 Nov 2026", due: "19 Nov 2026", amount: "R 5,800", balance: "R 0" }, invoiceDetail("R 5,800", "R 5,800", "R 0", "19 Nov 2026", "Paid"), 0),
    row("INV-2026-0413", "INV-2026-0413", "ORD-2026-0413", "Awaiting Payment", "Awaiting Payment", "warning", { customer: "Naledi Khumalo", type: "Order", issue: "11 Nov 2026", due: "18 Nov 2026", amount: "R 12,400", balance: "R 12,400" }, invoiceDetail("R 12,400", "R 0", "R 12,400", "18 Nov 2026", "Awaiting Payment"), 1),
    row("INV-2026-0412", "INV-2026-0412", "ORD-2026-0412", "Paid", "Paid", "success", { customer: "David Rensburg", type: "Order", issue: "10 Nov 2026", due: "17 Nov 2026", amount: "R 18,600", balance: "R 0" }, invoiceDetail("R 18,600", "R 18,600", "R 0", "17 Nov 2026", "Paid"), 2),
    row("INV-2026-0411", "INV-2026-0411", "BK-2026-0411", "Overdue", "Overdue", "danger", { customer: "Elena Moretti", type: "Booking", issue: "08 Nov 2026", due: "15 Nov 2026", amount: "R 22,500", balance: "R 22,500" }, invoiceDetail("R 22,500", "R 0", "R 22,500", "15 Nov 2026", "Overdue"), 0),
    row("INV-2026-0410", "INV-2026-0410", "ORD-2026-0410", "Paid", "Paid", "success", { customer: "Kabelo Maseko", type: "Order", issue: "07 Nov 2026", due: "14 Nov 2026", amount: "R 86,000", balance: "R 0" }, invoiceDetail("R 86,000", "R 86,000", "R 0", "14 Nov 2026", "Paid"), 1),
  ],
  detailTabs: ["Overview", "Line items (1)", "Payments", "Communication", "Activity"],
  detailActions: ["Resend invoice", "Record payment", "Create credit note"],
};

const enquiryDetail = (type: string, source: string, received: string, response: string) =>
  detail(
    [
      { label: "Enquiry type", value: type },
      { label: "Source", value: source },
      { label: "Received", value: received },
      { label: "Response time", value: response },
    ],
    [
      { label: "Contact", value: "Michael Sinder" },
      { label: "Email", value: "m.sinder@coastline.co.za" },
      { label: "Phone", value: "+27 82 415 7690" },
      { label: "Location", value: "Cape Town, South Africa" },
    ],
    {
      description: "I’d like to know if Edition II of A Quiet Form is still available, and what the lead time is for a framed piece.",
      secondaryTitle: "Enquiry details",
      secondaryFacts: [
        { label: "Artwork", value: "A Quiet Form — Edition II" },
        { label: "Interest", value: "Purchase (1–2 prints)" },
        { label: "Owner", value: "LS" },
      ],
      tags: ["Limited Edition", "Purchase Intent", "Framing"],
    },
  );

export const enquiriesWorkspace: WorkspaceConfig = {
  entity: "enquiries",
  eyebrow: "Enquiries",
  title: "Enquiries.",
  editorial: "Interest, requests and opportunities.",
  subtitle: "Manage incoming enquiries, qualify opportunities and convert them into orders or bookings.",
  intelligenceLabel: "Enquiry intelligence (30 days)",
  metrics: [
    { label: "Total enquiries", value: "127", change: "+18.7% vs. previous period", tone: "success", icon: "inbox" },
    { label: "New enquiries", value: "41", change: "+24.2% vs. previous period", tone: "success", icon: "mail" },
    { label: "Qualified", value: "32", change: "+28.0% vs. previous period", tone: "success", icon: "trend" },
    { label: "Converted", value: "19", change: "+46.2% vs. previous period", tone: "success", icon: "layers" },
    { label: "Conversion rate", value: "15%", change: "+4 pp vs. previous period", tone: "success", icon: "chart" },
    { label: "Avg. response time", value: "1h 26m", change: "↓32% vs. previous period", tone: "success", icon: "clock" },
  ],
  tabs: [
    { label: "All Enquiries", bucket: "all", count: 127 },
    { label: "New", bucket: "New", count: 41 },
    { label: "In Progress", bucket: "In Progress", count: 36 },
    { label: "Qualified", bucket: "Qualified", count: 32 },
    { label: "Converted", bucket: "Converted", count: 19 },
    { label: "Closed", bucket: "Closed", count: 8 },
  ],
  primaryAction: "New enquiry",
  searchPlaceholder: "Search enquiries by name, email, subject or reference…",
  filters: ["Enquiry type", "Status", "Source", "Date range"],
  columns: [
    { key: "type", label: "Type" },
    { key: "source", label: "Source" },
    { key: "received", label: "Received" },
    { key: "owner", label: "Owner", align: "center" },
  ],
  rows: [
    row("ENQ-2026-0417", "Limited Edition Availability", "m.sinder@coastline.co.za", "Qualified", "Qualified", "success", { type: "Artwork", source: "Website", received: "18 Nov 2026, 10:24", owner: "LS" }, enquiryDetail("Artwork", "Website", "18 Nov 2026", "42m"), 0),
    row("ENQ-2026-0416", "Studio Shoot Request", "amanda@orioncapital.co.za", "In Progress", "In Progress", "info", { type: "Photography", source: "Website", received: "17 Nov 2026, 16:02", owner: "LS" }, enquiryDetail("Photography", "Website", "17 Nov 2026", "1h 08m"), 1),
    row("ENQ-2026-0415", "Custom Print & Framing", "t.mokoena@stonefield.co.za", "New", "New", "neutral", { type: "Print", source: "Email", received: "17 Nov 2026, 09:47", owner: "NM" }, enquiryDetail("Print", "Email", "17 Nov 2026", "Pending"), 2),
    row("ENQ-2026-0414", "Brand Campaign Collaboration", "j.carter@aurora.co.za", "Qualified", "Qualified", "success", { type: "Campaign", source: "Website", received: "16 Nov 2026, 14:09", owner: "LS" }, enquiryDetail("Campaign", "Website", "16 Nov 2026", "54m"), 0),
    row("ENQ-2026-0413", "Commission Enquiry", "naledi@khumalo.studio", "In Progress", "In Progress", "info", { type: "Commission", source: "Referral", received: "15 Nov 2026, 11:33", owner: "NM" }, enquiryDetail("Commission", "Referral", "15 Nov 2026", "2h 14m"), 1),
    row("ENQ-2026-0412", "Edition Enquiry — Salt & Stone", "d.rensburg@rensburg.co.za", "Converted", "Converted", "success", { type: "Artwork", source: "Website", received: "14 Nov 2026, 16:21", owner: "LS" }, enquiryDetail("Artwork", "Website", "14 Nov 2026", "38m"), 2),
    row("ENQ-2026-0411", "Exhibition & Licensing", "elena@morettiart.it", "Qualified", "Qualified", "success", { type: "Licensing", source: "Email", received: "12 Nov 2026, 10:08", owner: "NM" }, enquiryDetail("Licensing", "Email", "12 Nov 2026", "1h 42m"), 0),
    row("ENQ-2026-0410", "Event Coverage Request", "k.maseko@aurora.co.za", "Closed", "Closed", "neutral", { type: "Photography", source: "Website", received: "11 Nov 2026, 08:55", owner: "LS" }, enquiryDetail("Photography", "Website", "11 Nov 2026", "3h 05m"), 1),
  ],
  detailTabs: ["Overview", "Conversation", "Activity", "Notes", "Related"],
  detailActions: ["Reply", "Create booking", "Create order", "Add to campaign"],
};

const campaignDetail = (sent: string, open: string, click: string, conversions: string, revenue: string) =>
  detail(
    [
      { label: "Sent", value: sent },
      { label: "Open rate", value: open },
      { label: "Click rate", value: click },
      { label: "Conversions", value: conversions },
    ],
    [
      { label: "Target audience", value: "Clients (2,846)" },
      { label: "Channel", value: "Email" },
      { label: "Goal", value: "Drive sales (edition orders)" },
      { label: "Sent", value: "04 Nov 2026, 09:00" },
      { label: "Revenue", value: revenue },
    ],
    { callout: { title: "A Quiet Form", text: "Edition II · View edition", tone: "neutral" } },
  );

export const campaignsWorkspace: WorkspaceConfig = {
  entity: "campaigns",
  eyebrow: "Campaigns",
  title: "Campaigns.",
  editorial: "Marketing, launches and client engagement.",
  subtitle: "Plan, create, send and measure marketing campaigns across email, SMS and studio announcements.",
  intelligenceLabel: "Campaign performance (last 30 days)",
  metrics: [
    { label: "Total campaigns", value: "12", change: "+33.3% vs. previous period", tone: "success", icon: "layers" },
    { label: "Messages sent", value: "18,640", change: "+27.1% vs. previous period", tone: "success", icon: "megaphone" },
    { label: "Open rate", value: "54%", change: "+8 pp vs. previous period", tone: "success", icon: "image" },
    { label: "Click rate", value: "12%", change: "+4 pp vs. previous period", tone: "success", icon: "arrow" },
    { label: "Conversion rate", value: "5.8%", change: "+2.1 pp vs. previous period", tone: "success", icon: "bars" },
    { label: "Revenue influence", value: "R 486,200", change: "+41.8% vs. previous period", tone: "success", icon: "box" },
  ],
  tabs: [
    { label: "All Campaigns", bucket: "all", count: 12 },
    { label: "Drafts", bucket: "Draft", count: 3 },
    { label: "Scheduled", bucket: "Scheduled", count: 2 },
    { label: "Running", bucket: "Running", count: 1 },
    { label: "Completed", bucket: "Completed", count: 6 },
    { label: "Archived", bucket: "Archived", count: 0 },
  ],
  primaryAction: "New campaign",
  searchPlaceholder: "Search campaigns by name, audience or subject…",
  filters: ["Channel", "Goal", "Status", "Date range"],
  columns: [
    { key: "channel", label: "Channel" },
    { key: "audience", label: "Audience" },
    { key: "sent", label: "Sent", align: "right" },
    { key: "open", label: "Open rate", align: "center" },
    { key: "click", label: "Click rate", align: "center" },
    { key: "conversions", label: "Conversions", align: "center" },
  ],
  rows: [
    row("CAM-2026-0047", "A Quiet Form — Edition II", "Edition launch and pre-orders", "Completed", "Completed", "success", { channel: "Email", audience: "Clients (2,846)", sent: "2,846", open: "62%", click: "14%", conversions: "189" }, campaignDetail("2,846", "62%", "14%", "189", "R 186,200"), 0),
    row("CAM-2026-0046", "Studio Shoot Availability", "November & December slots", "Completed", "Completed", "success", { channel: "Email", audience: "Clients (1,920)", sent: "1,916", open: "58%", click: "11%", conversions: "96" }, campaignDetail("1,916", "58%", "11%", "96", "R 84,600"), 1),
    row("CAM-2026-0045", "Print & Framing Offer", "Limited-time framing promotion", "Completed", "Completed", "success", { channel: "Email", audience: "Clients (4,310)", sent: "4,302", open: "49%", click: "9%", conversions: "247" }, campaignDetail("4,302", "49%", "9%", "247", "R 112,400"), 2),
    row("CAM-2026-0044", "LGNDRY Exhibition Invite", "A Quiet Form — Cape Town", "Completed", "Completed", "success", { channel: "Email", audience: "Clients (3,108)", sent: "3,104", open: "68%", click: "18%", conversions: "312" }, campaignDetail("3,104", "68%", "18%", "312", "R 203,800"), 0),
    row("CAM-2026-0043", "Behind the Edit", "The process, the people, the craft", "Running", "Running", "info", { channel: "Social", audience: "Followers (12,400)", sent: "—", open: "—", click: "6.8%", conversions: "—" }, campaignDetail("—", "—", "6.8%", "—", "Tracking"), 1),
    row("CAM-2026-0042", "Commission Bookings Open", "Q1 2027 commissions", "Scheduled", "Scheduled", "warning", { channel: "Email", audience: "Clients (2,015)", sent: "—", open: "—", click: "—", conversions: "—" }, campaignDetail("Scheduled", "—", "—", "—", "—"), 2),
    row("CAM-2026-0041", "Year-End Studio Update", "Studio closures & next dates", "Completed", "Completed", "success", { channel: "Email", audience: "Clients (3,890)", sent: "3,882", open: "51%", click: "8%", conversions: "92" }, campaignDetail("3,882", "51%", "8%", "92", "R 42,000"), 0),
    row("CAM-2026-0040", "New Edition Alert", "Desert Light — Edition I", "Completed", "Completed", "success", { channel: "Email", audience: "Clients (2,720)", sent: "2,718", open: "56%", click: "13%", conversions: "176" }, campaignDetail("2,718", "56%", "13%", "176", "R 96,000"), 1),
  ],
  detailTabs: ["Overview", "Audience", "Content", "Performance", "Activity"],
  detailActions: ["View report", "Duplicate", "Edit campaign", "Resend"],
};

