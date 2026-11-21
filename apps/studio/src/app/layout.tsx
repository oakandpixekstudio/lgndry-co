import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LGNDRY.Co Studio Desk", template: "%s / LGNDRY.Co Studio Desk" },
  description: "LGNDRY.Co Studio Desk: commerce, collectors, bookings and studio operations.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
