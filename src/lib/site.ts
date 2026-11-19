export const SITE = {
  name: "LGNDRY.Co",
  legal: "LGNDRY.Co",
  tagline: "Found beauty in the mundane",
  description:
    "LGNDRY.Co is an independent visual studio in Limpopo, South Africa. Limited-edition archival photographic prints, collected one at a time.",
  // TODO(confirm): public contact address. Taken from the existing prototype footer.
  email: "info@lgndry-co.co.za",
  location: "Limpopo, South Africa",
  builderUrl: "https://www.oakandpixel.co.za/",
  builderName: "Oak & Pixel Studio",
  originalSite: "https://www.lgndry-co.co.za/",
} as const;

export const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collectors-editions", label: "Collector's Editions" },
  { href: "/collections/photographic-series", label: "Series" },
  { href: "/studio", label: "Studio" },
] as const;

export const MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/collectors-editions", label: "Collector's" },
  { href: "/studio", label: "Studio" },
  { href: "/commission", label: "Commission" },
  { href: "/contact", label: "Contact" },
] as const;

export const POLICY_LINKS = [
  { href: "/shipping-returns", label: "Shipping & returns" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms of sale" },
] as const;
