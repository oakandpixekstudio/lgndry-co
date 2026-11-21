import { NextResponse, type NextRequest } from "next/server";
import { answer, fromThisSite, looksLikeBot, text } from "@/lib/form-guard";
import { callIntake, visitorHash } from "@/lib/intake";

const CATEGORIES = ["availability", "general", "commission"] as const;

/** Receives the three enquiry forms (private enquiry, contact, commission) and files them in the Studio Desk. */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return NextResponse.json({ ok: false, message: "Not allowed." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, message: "Please check the details and try again." }, { status: 400 });
  if (looksLikeBot(body)) return NextResponse.json({ ok: true }); // looks like success, stores nothing

  const category = CATEGORIES.find((c) => c === body.category) ?? "general";
  const details = body.details && typeof body.details === "object" ? (body.details as Record<string, unknown>) : {};
  const cleanDetails: Record<string, string> = {};
  for (const [key, value] of Object.entries(details).slice(0, 8)) cleanDetails[text(key, 40)] = text(value, 200);

  return answer(
    await callIntake("intake_enquiry", {
      name: text(body.name, 120),
      email: text(body.email, 254),
      message: text(body.message, 5000),
      category,
      phone: text(body.phone, 40),
      organisation: text(body.organisation, 120),
      topic: text(body.topic, 120),
      details: cleanDetails,
      artwork_slug: text(body.artworkSlug, 120),
      ip_hash: visitorHash(request.headers.get("x-forwarded-for")),
    }),
  );
}
