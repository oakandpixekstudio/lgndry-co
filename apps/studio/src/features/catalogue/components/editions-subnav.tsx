"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/editions", label: "Edition register", match: (p: string) => p === "/editions" },
  { href: "/editions/catalogue", label: "Catalogue", match: (p: string) => p.startsWith("/editions/catalogue") },
  { href: "/editions/website-images", label: "Website images", match: (p: string) => p.startsWith("/editions/website-images") },
];

/** Editions is one area with three views. The primary nav stays fixed; this strip moves between them. */
export function EditionsSubnav() {
  const pathname = usePathname();
  return (
    <nav className="cat-subnav" aria-label="Editions sections">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.match(pathname) ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
