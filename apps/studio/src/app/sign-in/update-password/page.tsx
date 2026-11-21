import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdatePasswordScreen } from "@/features/auth/components/update-password-screen";
import { isAuthConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };
// Depends on the visitor's session and on environment settings: never prerender at build time.
export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  if (!isAuthConfigured()) redirect("/sign-in");
  // Only reachable from an emailed link, which arrives with a session. No session: back to sign-in.
  const supabase = await createSupabaseServerClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) redirect("/sign-in?error=link");
  return <UpdatePasswordScreen />;
}
