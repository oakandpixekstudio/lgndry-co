import { NextResponse, type NextRequest } from "next/server";
import { answer, fromThisSite, looksLikeBot, text } from "@/lib/form-guard";
import { callIntake, visitorHash } from "@/lib/intake";

/** Receives the newsletter sign-up and records the person's consent in the Studio Desk. */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return NextResponse.json({ ok: false, message: "Not allowed." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, message: "Please check the details and try again." }, { status: 400 });
  if (looksLikeBot(body)) return NextResponse.json({ ok: true });
  return answer(await callIntake("intake_newsletter", { email: text(body.email, 254), ip_hash: visitorHash(request.headers.get("x-forwarded-for")) }));
}
