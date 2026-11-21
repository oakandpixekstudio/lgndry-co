import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Tells the site the catalogue changed so visitors see it within moments instead of at the next five-minute refresh.
 * The Studio Desk calls this after publishing. It needs the shared secret in the `x-revalidate-secret` header.
 * With no REVALIDATE_SECRET configured the route is switched off.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return NextResponse.json({ error: "Not enabled." }, { status: 503 });

  const given = Buffer.from(request.headers.get("x-revalidate-secret") ?? "");
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }

  // expire: 0 means the next visitor waits for the fresh catalogue instead of being shown the old one while it loads.
  revalidateTag("catalogue", { expire: 0 });
  return NextResponse.json({ ok: true });
}
