import { NextResponse, type NextRequest } from "next/server";
import { SITE } from "@/lib/site";
import type { IntakeResult } from "@/lib/intake";

/** Plain-language answers for every way a form post can end. Returns JSON the forms understand. */
export function answer(result: IntakeResult) {
  if (result.ok) return NextResponse.json({ ok: true, ref: result.ref });
  switch (result.code) {
    case "invalid":
      return NextResponse.json({ ok: false, message: `Please check the ${result.field ?? "details"} and try again.` }, { status: 422 });
    case "rate_limited":
      return NextResponse.json({ ok: false, message: "That is a lot of messages in a short time. Please try again in a little while." }, { status: 429 });
    case "not_configured":
      return NextResponse.json({ ok: false, message: `We cannot take messages through this page yet. Please email ${SITE.email}.` }, { status: 503 });
    default:
      return NextResponse.json({ ok: false, message: `Something went wrong on our side. Please try again, or email ${SITE.email}.` }, { status: 502 });
  }
}

/**
 * Cheap, quiet bot checks. A bot gets a normal-looking success so it learns nothing, but nothing is stored:
 *  - the hidden "website" field must be empty (people never see it)
 *  - the form must have been open for at least two seconds
 * Returns true when the post should be silently dropped.
 */
export function looksLikeBot(body: Record<string, unknown>): boolean {
  if (typeof body.website === "string" && body.website.trim() !== "") return true;
  const startedAt = Number(body.startedAt);
  return !Number.isFinite(startedAt) || Date.now() - startedAt < 2000;
}

/** The post must come from this site (stops other websites posting through a visitor's browser). */
export function fromThisSite(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
