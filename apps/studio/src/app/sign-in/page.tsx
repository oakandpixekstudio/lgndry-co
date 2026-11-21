import type { Metadata } from "next";
import { SignInScreen } from "@/features/auth/components/sign-in-screen";
import { isAuthConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <SignInScreen configured={isAuthConfigured()} next={next} linkProblem={error === "link"} />;
}
