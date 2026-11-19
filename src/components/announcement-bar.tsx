import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="relative z-30 flex h-[34px] items-center justify-center gap-6 overflow-hidden bg-ink px-4 text-[10px] tracking-[0.12em] text-paper uppercase">
      <span className="hidden sm:inline">Archival prints · Certificate with every edition</span>
      <span className="hidden text-white/30 sm:inline">/</span>
      <Link href="/collectors-editions" className="underline underline-offset-4 hover:opacity-70">
        Collector&rsquo;s Editions — by private enquiry ↗
      </Link>
    </div>
  );
}
