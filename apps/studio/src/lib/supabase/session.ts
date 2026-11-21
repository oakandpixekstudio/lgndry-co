import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

/** Refreshes the session cookie on every request and says who (if anyone) is signed in. Used by proxy.ts only. */
export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = NextResponse.next({ request });
  if (!config) return { response, user: null };

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims() checks the token's signature here, on this machine, so it costs no trip to Supabase (it only
  // calls out to refresh an expired token). getSession() would trust the cookie unchecked, which is not safe.
  // Access is still re-checked against the database below (an active staff role), so a removed person is locked out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims?.sub ? { id: data.claims.sub } : null;
  return { response, user };
}

/** A redirect that keeps any session cookies that were just refreshed. */
export function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
