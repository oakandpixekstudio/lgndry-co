"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Photo } from "@/components/photo";
import { COLLECTIONS, WORKS, getWork, imageUrl, money, priceLabel } from "@/lib/catalogue";
import { lineTotal, removeLine, setQty, useCart } from "@/lib/cart-store";
import { MENU_LINKS, NAV, POLICY_LINKS, SITE } from "@/lib/site";
import { setBagOpen, useBagOpen } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

type Screen = "menu" | "search" | null;
const BAR_HEIGHT = 34;

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // An overlay belongs to the page it was opened on, so navigating away (links or back/forward) closes it.
  const [open, setOpen] = useState<{ screen: Screen; path: string }>({ screen: null, path: pathname });
  const screen = open.path === pathname ? open.screen : null;
  const setScreen = (s: Screen) => setOpen({ screen: s, path: pathname });
  const { count } = useCart();
  const bagOpen = useBagOpen();

  // Header glides up beneath the announcement bar, then pins and frosts.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (headerRef.current) headerRef.current.style.top = `${Math.max(0, BAR_HEIGHT - y)}px`;
      setScrolled(y > BAR_HEIGHT + 40);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("lock", screen !== null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen({ screen: null, path: pathname });
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [screen, pathname]);


  return (
    <>
      <header
        ref={headerRef}
        style={{ top: BAR_HEIGHT }}
        className={cn(
          "fixed inset-x-0 z-40 flex items-start justify-between gap-5 px-[var(--offset)] py-[22px] transition-[background,padding,border-color] duration-300",
          scrolled && "border-b border-black/10 bg-paper/95 py-4 backdrop-blur-md",
        )}
      >
        <Link href="/" aria-label="LGNDRY.Co home" className="text-[17px] leading-none font-extrabold tracking-[-0.1em] whitespace-nowrap">
          LGNDRY<small className="text-xs font-normal tracking-[-0.065em]">.Co</small>
        </Link>

        <nav aria-label="Primary" className="absolute left-1/2 hidden -translate-x-1/2 gap-9 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("text-[11px] tracking-[0.025em] uppercase underline-offset-[6px] hover:underline", active && "underline")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-[clamp(16px,2.4vw,34px)]">
          <button className="text-[11px] tracking-[0.025em] underline underline-offset-[3px] hover:opacity-60" onClick={() => setScreen("search")}>
            SEARCH
          </button>
          <button className="text-[11px] tracking-[0.025em] underline underline-offset-[3px] hover:opacity-60" onClick={() => setBagOpen(true)}>
            BAG <span className="ml-0.5 text-[10px]">({count})</span>
          </button>
          <button className="text-[11px] tracking-[0.025em] underline underline-offset-[3px] hover:opacity-60" onClick={() => setScreen("menu")}>
            MENU
          </button>
        </div>
      </header>

      <MenuScreen open={screen === "menu"} onClose={() => setScreen(null)} />
      <SearchScreen
        open={screen === "search"}
        onClose={() => setScreen(null)}
        onSubmit={(q) => {
          setScreen(null);
          router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
        }}
      />
      <BagDrawer open={bagOpen} onOpenChange={setBagOpen} />
    </>
  );
}

function ScreenShell({ open, label, onClose, children }: { open: boolean; label: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      data-open={open}
      className="screen-wipe fixed inset-0 z-[95] overflow-y-auto bg-paper"
    >
      <div className="flex items-center justify-between px-[var(--offset)] py-[25px]">
        <h2 className="m-0 text-[17px] tracking-[-0.09em]">{label === "Site navigation" ? "LGNDRY.Co" : "SEARCH"}</h2>
        <button className="text-xs underline underline-offset-[3px] transition-opacity hover:opacity-50" onClick={onClose}>
          EXIT [×]
        </button>
      </div>
      {children}
    </section>
  );
}

function MenuScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ScreenShell open={open} label="Site navigation" onClose={onClose}>
      <div className="grid min-h-[72vh] items-center gap-12 px-[var(--offset)] pb-16 lg:grid-cols-[1fr_320px]">
        <nav className="menu-nav flex flex-col">
          {MENU_LINKS.map((l, i) => (
            <div key={l.href} className="overflow-hidden pb-[0.06em]">
              <Link href={l.href} onClick={onClose} className="menu-link flex items-start gap-[30px] text-[clamp(44px,7.6vw,118px)] leading-[0.98] font-extrabold tracking-[-0.09em]">
                <span className="menu-line flex items-start gap-[30px]" style={{ transitionDelay: open ? `${280 + i * 85}ms` : "0ms" }}>
                  <span className="menu-num mt-[0.7em] text-xs font-normal tracking-normal">{String(i + 1).padStart(2, "0")}</span>
                  {l.label.toUpperCase()}
                  <span aria-hidden="true" className="menu-arrow mt-[0.18em] text-[0.45em] font-normal tracking-normal">
                    ↗︎
                  </span>
                </span>
              </Link>
            </div>
          ))}
        </nav>
        <aside className="menu-aside space-y-10 text-[13px] leading-relaxed">
          <div>
            <p className="micro mb-3 text-ash">Collections</p>
            <ul className="space-y-2">
              {COLLECTIONS.map((c) => (
                <li key={c.slug}>
                  <Link href={`/collections/${c.slug}`} onClick={onClose} className="hover:underline">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="micro mb-3 text-ash">Help</p>
            <ul className="space-y-2">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onClose} className="hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="micro mb-3 text-ash">Studio</p>
            <a href={`mailto:${SITE.email}`} className="break-all hover:underline">
              {SITE.email}
            </a>
            <p className="text-ash">{SITE.location}</p>
          </div>
        </aside>
      </div>
    </ScreenShell>
  );
}

function SearchScreen({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (q: string) => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return WORKS.filter((w) => `${w.title} ${w.category} ${w.summary} ${w.collection.replace("-", " ")}`.toLowerCase().includes(term)).slice(0, 4);
  }, [q]);

  return (
    <ScreenShell open={open} label="Search artworks" onClose={onClose}>
      <form
        className="mx-[var(--offset)] mt-[10vh]"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(q.trim());
        }}
      >
        <label htmlFor="site-search" className="mb-5 block text-[11px]">
          LOOK FOR SOMETHING WORTH KEEPING.
        </label>
        <input
          id="site-search"
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the collection..."
          autoComplete="off"
          className="w-full rounded-none border-0 border-b-2 border-ink bg-transparent pb-3.5 text-[clamp(32px,6vw,91px)] tracking-[-0.07em] outline-none"
        />
        <p className="mt-4 text-xs text-ash">SEARCH BY WORK, CATEGORY OR COLLECTION. PRESS ENTER TO VIEW ALL RESULTS.</p>
      </form>

      <div className="mx-[var(--offset)] mt-12 pb-20">
        {results.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((w) => (
              <li key={w.slug}>
                <Link href={`/works/${w.slug}`} onClick={onClose} className="group block">
                  <Photo plain src={imageUrl(w.image)} alt="" tone={w.tone} focal={w.focal} className="aspect-[4/5]" sizes="25vw" />
                  <p className="mt-3 text-[11px] font-semibold group-hover:underline">{w.title}</p>
                  <p className="text-[10px] text-ash">{priceLabel(w)}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : q.trim() ? (
          <p className="text-[13px] text-ash">No works match &ldquo;{q.trim()}&rdquo;.</p>
        ) : (
          <div>
            <p className="micro mb-4 text-ash">Browse</p>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
              {COLLECTIONS.map((c) => (
                <li key={c.slug}>
                  <Link href={`/collections/${c.slug}`} onClick={onClose} className="underline underline-offset-4">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

function BagDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { lines, count, subtotal } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="z-[100] w-full gap-0 bg-paper p-0 sm:max-w-[500px]">
        <div className="flex items-center justify-between border-b border-line px-[29px] py-[27px]">
          <SheetTitle className="text-[31px] leading-none font-bold tracking-[-0.075em]">
            Shopping bag <span>({count})</span>
          </SheetTitle>
          <SheetClose render={<button className="text-xs underline underline-offset-4" />}>CLOSE [×]</SheetClose>
        </div>
        <SheetDescription className="sr-only">Review the artworks in your shopping bag.</SheetDescription>

        <div className="flex-1 overflow-auto px-[29px] py-[22px]">
          {lines.length === 0 ? (
            <div className="pt-[14vh]">
              <h3 className="mb-4 max-w-[300px] text-[42px] leading-[1.06] font-bold tracking-[-0.08em]">Nothing here. Yet.</h3>
              <p className="mb-6 text-[13px] text-ash">Great things start by looking closer.</p>
              <Link href="/shop" onClick={() => onOpenChange(false)} className="tlink">
                View the collection ↗︎
              </Link>
            </div>
          ) : (
            lines.map((l) => {
              const w = getWork(l.slug);
              if (!w) return null;
              return (
                <div key={l.key} className="mb-2.5 grid grid-cols-[90px_1fr] gap-3.5 border-b border-line pt-3 pb-[22px]">
                  <Link href={`/works/${w.slug}`} onClick={() => onOpenChange(false)}>
                    <Photo plain src={imageUrl(w.image)} alt={w.title} tone={w.tone} focal={w.focal} className="h-[116px]" sizes="90px" />
                  </Link>
                  <div>
                    <p className="mb-2 text-[15px] font-semibold">{w.title}</p>
                    <p className="mb-2 text-[11px] text-[#666]">
                      {w.collection === "photographic-series" ? "COMPLETE SET" : `${l.size} / ${l.finish.toUpperCase()}`}
                    </p>
                    <p className="text-[13px]">{money(lineTotal(l))}</p>
                    <QtyControls lineKey={l.key} qty={l.qty} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-ink px-[29px] pt-[26px] pb-7">
          <div className="mb-5 flex justify-between text-[13px] font-bold">
            <span>SUBTOTAL</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="grid gap-2.5">
            <Link href="/checkout" onClick={() => onOpenChange(false)} aria-disabled={!lines.length} className={cn("btn btn-dark", !lines.length && "pointer-events-none opacity-30")}>
              CHECKOUT <span>→</span>
            </Link>
            <Link href="/cart" onClick={() => onOpenChange(false)} className="btn btn-line">
              VIEW FULL BAG <span>↗︎</span>
            </Link>
          </div>
          <p className="mt-3.5 text-[10px] leading-relaxed text-ash">Prototype: prices are illustrative. Tax, shipping and payment are not connected.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function QtyControls({ lineKey, qty }: { lineKey: string; qty: number }) {
  return (
    <div className="mt-3.5 flex items-center gap-4 text-[11px]">
      <button className="px-1.5 text-[15px]" aria-label="Decrease quantity" onClick={() => setQty(lineKey, qty - 1)}>
        −
      </button>
      <span aria-live="polite">{qty}</span>
      <button className="px-1.5 text-[15px]" aria-label="Increase quantity" onClick={() => setQty(lineKey, qty + 1)}>
        +
      </button>
      <button className="ml-2.5 text-[10px] underline" onClick={() => removeLine(lineKey)}>
        REMOVE
      </button>
    </div>
  );
}
