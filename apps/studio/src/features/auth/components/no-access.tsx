"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import "../../../styles/auth.css";

/** Signed in with a valid account that has no staff role. Nothing about the studio is shown. */
export function NoAccess({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    await createSupabaseBrowserClient()?.auth.signOut();
    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <main className="sign-in-page">
      <div className="sign-in-shade" />
      <section className="sign-in-panel" aria-labelledby="no-access-title">
        <div className="sign-in-brand" aria-label="LGNDRY.Co">LGNDRY<span>.Co</span></div>
        <i className="sign-in-rule" />
        <h1 id="no-access-title">No access yet</h1>
        <p>
          You are signed in as <b>{email}</b>, but this account has not been given a role in the Studio Desk.
          Ask the studio owner to invite you, then sign in again.
        </p>
        <button className="sign-in-submit" type="button" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</button>
      </section>
    </main>
  );
}
