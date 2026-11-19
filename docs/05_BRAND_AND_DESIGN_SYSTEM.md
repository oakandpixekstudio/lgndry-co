# 05 — Brand, UI and Editorial Design Specification

**Brand:** LGNDRY.Co — fine-art photography and visual storytelling  
**Application:** Studio Desk CRM, with Intelligence Center as the flagship screen  
**Source priority:** latest screenshot for composition + source HTML for existing tokens/behaviours  
**Goal:** the unmistakable editorial restraint of the approved Zara-inspired LGNDRY e-commerce concept, without copying Zara brand assets or compromising software usability.

## 1. Brand character

LGNDRY.Co feels like a contemporary art publication, not an ordinary admin SaaS tool. Design with confidence: dramatic scale at the right moments, crisp functional text where it counts, careful negative space, precise lines and asymmetrical photography. The interface should **look exceptional and still allow staff to complete a task quickly**.

**Descriptors:** editorial, contemporary, quiet, considered, monochrome, cinematic, typographic, art-directed, efficient.

**Avoid:** generic thick card stacks; gradient dashboards; glassmorphism; cartoon illustrations; decorative badges; giant rounded pill navigation; oversaturated success/error colours; inconsistent component radii; low-contrast tiny text; large photos where they interfere with table scanning.

## 2. Logo and naming

- Wordmark: `LGNDRY` (heavy, tightly spaced), with `.Co` lighter/smaller top-right.
- Product descriptor in small uppercase: `STUDIO DESK / COMMERCE`.
- Exact product name in headings: **LGNDRY.Co Studio Desk**. Do not use `LGNRY`, `LEGENDARY`, or a randomly expanded company name in UI.
- Sidebar wordmark is white on near-black; never stretch it. Maintain clear internal margins.
- Use original approved logo artwork if supplied in future; until then use carefully matched live typography, not a pretend logo image.

## 3. Visual target anatomy (1672×941 screenshot)

1. **Viewport shell** — pale mineral white background. Dark, detached sidebar begins ~10px from top/left and ends ~10px from bottom. It has subtle corner rounding and a soft, subdued shadow.
2. **Sidebar** — near-black, compact but breathable, brand at top, secondary caption, control-room group, selected Overview with light ivory rectangular highlight, then subtle line icons/labels. Navigation order is fixed in `09_PROJECT_STRUCTURE.md` and the build prompt.
3. **Top bar** — floating-shell-compatible workspace top line with small breadcrumb `LGNDRY / INTELLIGENCE CENTER`, quiet search, keyboard shortcut, date, demo badge (demo environment only) and storefront link.
4. **Hero** — eyebrow date, giant title `The Intelligence *Center*.` with `The Intelligence` in heavy sans and `Center.` in italic serif; concise subtitle below. A narrow cropped monochrome abstract landscape image on the right.
5. **KPI rail** — seven evenly structured indicator cells divided by thin lines. Large values, tiny uppercase labels, restrained positive/attention indicators.
6. **Intelligence row** — revenue/orders chart left; collector signal panel middle; booking panel with compact calendar right. White/off-white panels, thin borders and accurate spacing.
7. **Operation row** — edition production and delivery watch left; artwork thumbnails/captions centre; studio insight actions right.
8. **Footer strip** — low-contrast warm panel with `Key takeaways.` italic serif title and three short numbered actions, ending in a clean black call-to-action.

The screenshot shows an **illustrative Intelligence Center**; preserve its visual rhythm, but update values/content from real data in production.

## 4. Core design tokens

Extracted from the original floating HTML where possible; other values are recommendations inferred from the screenshot and may be refined through visual QA.

| Token | Value | Usage |
|---|---|---|
| `--lg-paper` | `#f5f5f2` | workspace background; sourced from HTML |
| `--lg-white` | `#ffffff` | surface panels |
| `--lg-ink` | `#121212` | main text/black buttons |
| `--lg-sidebar` | `#141413` | floating navigation |
| `--lg-muted` | `#777771` | supporting text |
| `--lg-line` | `#dfdfd9` | subtle borders |
| `--lg-line-dark` | `#30302f` | sidebar rules |
| `--lg-highlight` | `#eceae4` | active/selected neutral surface |
| `--lg-warm` | `#bbb6aa` | restrained neutral accents |
| `--lg-success` | approximately `#337058` | small positive deltas only |
| `--lg-warning` | approximately `#9d5c3c` | small attention flags only |
| `--lg-display` | bold Arial/Helvetica-like sans, tight tracking | hero and values |
| `--lg-serif` | Georgia or comparable licensed serif italic | editorial emphasized words, artwork titles |
| `--lg-body` | Arial/Helvetica or approved neutral grotesk | operational labels, tables |

Do not fetch or distribute proprietary retail brand fonts. Use legally licensed, self-hosted or system fonts. Avoid new fonts unless their impact has been previewed on both desktop and mobile.

**Suggested implementation tokens:**

```css
:root {
  --lg-paper: #f5f5f2;
  --lg-white: #ffffff;
  --lg-ink: #121212;
  --lg-sidebar: #141413;
  --lg-muted: #777771;
  --lg-line: #dfdfd9;
  --lg-line-dark: #30302f;
  --lg-highlight: #eceae4;
  --lg-success: #337058;
  --lg-warning: #9d5c3c;
  --lg-sans: Arial, Helvetica, sans-serif;
  --lg-serif: Georgia, 'Times New Roman', serif;
}
```

**Spacing:** use 4px base spacing with a curated series (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Aim for 20–32px within panels and 16–24px between dense dashboard modules, scaled by viewport. Avoid magic numbers scattered across components.

**Corners:** sidebar outer corners ~10px; most tables, inputs, buttons and dashboard panels **sharp or nearly square** (0–2px radius). Do not generalise another brand's global sharp-corner preference; LGNDRY screenshot allows modest sidebar rounding.

**Shadow:** restrained on sidebar and overlays only; avoid each KPI/panel having a strong drop shadow. Use lines to define structure.

## 5. Typography hierarchy

| Role | Desktop guideline | Mobile guideline | Notes |
|---|---|---|---|
| Intelligence Center title | clamp roughly 56–88px | 36–56px | mixed heavy sans/italic serif, tight tracking |
| Other page heading | 48–76px | 34–48px | may use editorial emphasized word |
| Section heading | 18–23px | 17–21px | confident, high contrast |
| KPI figure | 30–42px | 24–34px | tabular numbers recommended |
| Body | 12–14px, minimum functional legibility | 13–15px | avoid screenshot-scale tiny text in real app |
| Eyebrow/metadata | 10–11px uppercase with spacing | 10–11px | do not convey critical info only here |
| Buttons | 10–12px uppercase | 11–13px | rectangular, clear focus |
| Data tables | 12–13px | condensed summary rows | align amounts right, dates consistent |

The screenshot uses very small labels. **Operational accessibility overrides literal scale**: retain the design composition, but increase text where necessary to meet practical readability and accessibility.

## 6. Floating sidebar specification

- Desktop: `<aside>` with fixed/sticky floating placement, consistent inset ~10–14px, width responsive around 190–236px, height `calc(100dvh - 2 * inset)`, background `#141413`, radius ~10px, controlled shadow.
- Header contains logo and descriptor. Main nav entries 38–44px high with icon, label and optional square count badge. Active entry is warm-ivory with dark text; hover is subtler charcoal uplift.
- Sections: `CONTROL ROOM` above primary list; `ADMINISTRATION` above Settings; signed-in user panel at bottom.
- **Required order:** Overview / Customers / Orders / Editions / Bookings / Invoices / Enquiries / Inbox / Campaigns / Insights / Settings.
- If viewport is short, nav scrolls without truncating items or burying Settings; logout/profile remains reachable.
- Mobile/tablet: sidebar becomes accessible slide-in/dismissible overlay with solid backdrop; do not compress 11 labels into unusable permanently visible rail.
- Navigation count badges derive from **actionable** records, never fixed mock numbers in production.

## 7. Controls and component rules

- Use black rectangular primary CTAs, outline secondary CTAs and discreet underlined text actions. Favor `VIEW BOOKINGS →` over a neon filled button.
- Inputs: crisp borders, visible labels, concise validation text, strong keyboard focus and nonempty placeholders only as examples.
- Forms: use top-aligned labels, logical grouping, currency/date formats for South Africa; no hidden required fields.
- Tables: fine rules, compact high-density desktop, sticky headings where beneficial, keyboard-navigable rows, alternative compact mobile cards.
- Drawers: preserve original demo's right-side record-detail pattern; show breadcrumb and entity status, maintain focus management, distinguish `Edit` permissions.
- Alerts: neutral by default; orange/brown only for pending risk; green only for verifiable positive trends and paid states; error red for actual blocking errors.
- QR invoice panels: black/white scannable code with quiet caption, clear Pay Invoice action, amount and due date. QR canvas itself must be machine-rendered, not AI-generated or a decorative placeholder in production.
- Data visualisation: monochrome bars/lines; interactive legends and time-range controls; chart uses data-linked values; add accessible summary table and labels.

## 8. Editorial imagery

The hero artwork should resemble a cropped monochrome/abstract landscape or fine-art texture, drawing from **licensed LGNDRY assets**. Use `object-fit: cover`, intentional focal point and a stable aspect ratio. Artwork gallery imagery must map to actual catalog assets; default placeholders should be labelled `Sample artwork` in demo. Maintain grain/contrast artistically but do not compromise text readability.

**No Zara brand logos, assets or distinctive proprietary campaigns.** Reference is a style direction: oversized editorial type and offbeat composition, not a clone.

## 9. Responsive design and motion

- Breakpoints are implementation tools, not exact visual requirements; verify 390, 768, 1280, 1440 and 1672 widths.
- Keep hero title and KPI rail legible when panels stack. Allow chart width scroll only within deliberate chart container; never cause full-page horizontal overflow.
- On phones: KPI grid becomes 2 columns or horizontally scrollable labelled panels, with first actions visible; booking panel becomes a compact agenda list plus accessible calendar entry.
- Animations: fade/translate <200ms for drawers and state updates; respect `prefers-reduced-motion`; no forced parallax in internal CRM.
- Empty state: art-directed but factual (“No confirmed shoots this week.”), with a clear action if the role can create one.

## 10. Design QA checklist

- [ ] Target screenshot and rendered browser screenshot placed side by side for matching top-level proportions.
- [ ] Floating sidebar has visible breathing room; correct navigation order; Settings and user profile reachable.
- [ ] Correct bold + italic serif mixed hero; original branding preserved.
- [ ] Seven KPI labels/figures and distinct content panels follow target hierarchy.
- [ ] Booking calendar, collector signals and edition watch do not disappear at medium widths.
- [ ] Tables/inputs remain usable at realistic text zoom levels and narrow screens.
- [ ] Focus order, color contrast and icon labels pass accessibility inspection.
- [ ] No fake QR or fake customer records in production mode.
- [ ] Visual QA includes record pages (Invoices, Bookings, Inbox), not only overview.

## 11. Reference artifacts

- `../references/LGNDRY-Intelligence-Center-target.png`: latest approved screenshot; **primary layout reference**.
- `../references/lgndry-studio-crm-floating.html`: functional legacy prototype; **interaction/style reference**. Its current overview title (`A clearer picture.`) is **superseded** by target screenshot's (`The Intelligence Center.`).
- `../references/lgndry-editorial-storefront-optional.html`: complementary retail editorial aesthetic only.
