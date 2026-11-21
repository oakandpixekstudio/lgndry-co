import { NextResponse, type NextRequest } from "next/server";
import { isAuthConfigured, safeNext } from "@/lib/supabase/config";
import { redirectKeepingCookies, updateSession } from "@/lib/supabase/session";

/**
 * First line of defence: signed-out visitors are sent to the sign-in page.
 * The studio layout checks again on the server (membership and role), so this file is never the only guard.
 *
 * With no Supabase settings the studio runs as before (demo mode, no sign-in).
 */
const PUBLIC_PATHS = ["/sign-in", "/auth"];

export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingCookies(url, response);
  }

  if (user && pathname === "/sign-in") {
    const url = request.nextUrl.clone();
    url.pathname = safeNext(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return redirectKeepingCookies(url, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|artwork-placeholders/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)"],
};
