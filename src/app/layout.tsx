import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/toaster";
import { CatalogueProvider } from "@/lib/catalogue-context";
import { getCatalogueSnapshot } from "@/lib/catalogue-source";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: "LGNDRY.Co — Limited-edition photographic prints",
    template: "%s — LGNDRY.Co",
  },
  description: SITE.description,
  openGraph: {
    title: "LGNDRY.Co — Found beauty in the mundane",
    description: SITE.description,
    locale: "en_ZA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const snapshot = await getCatalogueSnapshot();
  return (
    <html lang="en-ZA">
      <body className="flex min-h-screen flex-col">
        <noscript>
          <style>{`.cine-pending>.cine-clip{clip-path:none!important;opacity:1!important;filter:none!important}.cine-pending .cine-scale{transform:none!important}`}</style>
        </noscript>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-ink focus:px-4 focus:py-3 focus:text-xs focus:text-paper">
          Skip to content
        </a>
        <CatalogueProvider snapshot={snapshot}>
          <AnnouncementBar />
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </CatalogueProvider>
      </body>
    </html>
  );
}
