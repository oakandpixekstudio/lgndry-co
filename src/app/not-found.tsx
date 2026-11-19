import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] flex-col justify-center px-[var(--offset)] pt-[140px] pb-24">
      <p className="micro mb-8">404 / NOT FOUND</p>
      <h1 className="display mb-12 text-[clamp(64px,12vw,190px)]">
        NOTHING
        <br />
        <span className="display-serif">here.</span>
      </h1>
      <p className="mb-10 max-w-[360px] text-[14px] leading-[1.75] text-[#555]">The page you are looking for has moved, or never existed. The collection is still where you left it.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-dark min-w-[260px]">
          Shop the collection <span>→</span>
        </Link>
        <Link href="/" className="btn btn-line">
          Home <span>↗︎</span>
        </Link>
      </div>
    </section>
  );
}
