"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { safeNext } from "@/lib/supabase/config";

interface SignInScreenProps {
  /** True when Supabase settings exist: real staff sign-in. False: the original demo screen. */
  configured: boolean;
  next?: string;
  linkProblem?: boolean;
}

export function SignInScreen({ configured, next, linkProblem = false }: SignInScreenProps) {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  // Demo mode keeps its sample login; real sign-in starts empty and never pre-fills credentials.
  const [email, setEmail] = useState(configured ? "" : "studio@lgndry.co.za");
  const [password, setPassword] = useState(configured ? "" : "studio-desk");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(linkProblem ? "That link has expired or was already used. Request a new one." : null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!configured) {
      window.setTimeout(() => router.push("/overview"), 520);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Sign-in is not connected yet.");
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setLoading(false);
      // One message for every failure, so the form never reveals which emails have accounts.
      setError("That email and password do not match. Check them and try again.");
      return;
    }
    router.replace(safeNext(next));
    router.refresh();
  };

  const forgotPassword = async () => {
    setError(null);
    setMessage(null);
    if (!configured) return;
    if (!email.trim()) {
      setError("Enter your email address first, then choose Forgot password.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/sign-in/update-password`,
    });
    setMessage("If an account exists for that email, a reset link is on its way.");
  };

  return (
    <main className="sign-in-page">
      <div className="sign-in-shade" />
      <section className="sign-in-panel" aria-labelledby="sign-in-title">
        <div className="sign-in-brand" aria-label="LGNDRY.Co">LGNDRY<span>.Co</span></div>
        <i className="sign-in-rule" />
        <h1 id="sign-in-title">Sign in</h1>
        <p>Welcome back. Access your studio desk.</p>
        <form onSubmit={submit}>
          <label className="sign-in-field">
            <Icon name="mail" size={23} />
            <span className="sr-only">Email address</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
          </label>
          <label className="sign-in-field">
            <Icon name="lock" size={23} />
            <span className="sr-only">Password</span>
            <input type={passwordVisible ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
            <button type="button" onClick={() => setPasswordVisible((current) => !current)} aria-label={passwordVisible ? "Hide password" : "Show password"}><Icon name="eye" size={23}/></button>
          </label>
          <div className="sign-in-options">
            {configured ? <span /> : (
              <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><i><Icon name="check" size={13}/></i><span>Remember me</span></label>
            )}
            <button type="button" onClick={forgotPassword}>Forgot password?</button>
          </div>
          {error ? <p className="sign-in-error" role="alert">{error}</p> : null}
          {message ? <p className="sign-in-note" role="status">{message}</p> : null}
          <button className="sign-in-submit" type="submit" disabled={loading}>{loading ? (configured ? "Signing in…" : "Opening Studio Desk…") : "Sign in"}</button>
        </form>
        <small>{configured ? "STAFF ACCESS ONLY · ASK THE OWNER FOR AN INVITATION" : "DEMO ACCESS · YOUR DETAILS STAY ON THIS DEVICE"}</small>
      </section>
    </main>
  );
}
