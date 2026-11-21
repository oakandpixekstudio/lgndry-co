"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// docs/04: strong password rules. Supabase also enforces its own minimum from the project settings.
const MIN_LENGTH = 12;

export function UpdatePasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError("The two passwords do not match.");
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = (await supabase?.auth.updateUser({ password })) ?? { error: new Error("not connected") };
    if (updateError) {
      setLoading(false);
      setError("Could not save the new password. Request a fresh reset link and try again.");
      return;
    }
    router.replace("/overview");
    router.refresh();
  };

  return (
    <main className="sign-in-page">
      <div className="sign-in-shade" />
      <section className="sign-in-panel" aria-labelledby="update-title">
        <div className="sign-in-brand" aria-label="LGNDRY.Co">LGNDRY<span>.Co</span></div>
        <i className="sign-in-rule" />
        <h1 id="update-title">New password</h1>
        <p>Choose a password of at least {MIN_LENGTH} characters.</p>
        <form onSubmit={submit}>
          <label className="sign-in-field">
            <Icon name="lock" size={23} />
            <span className="sr-only">New password</span>
            <input type={visible ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
            <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}><Icon name="eye" size={23} /></button>
          </label>
          <label className="sign-in-field">
            <Icon name="lock" size={23} />
            <span className="sr-only">Confirm new password</span>
            <input type={visible ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirm new password" required />
          </label>
          {error ? <p className="sign-in-error" role="alert">{error}</p> : null}
          <button className="sign-in-submit" type="submit" disabled={loading}>{loading ? "Saving…" : "Save password"}</button>
        </form>
      </section>
    </main>
  );
}
