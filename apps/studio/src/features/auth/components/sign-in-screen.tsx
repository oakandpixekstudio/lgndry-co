"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function SignInScreen() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("studio@lgndry.co.za");
  const [password, setPassword] = useState("studio-desk");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    window.setTimeout(() => router.push("/overview"), 520);
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
            <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><i><Icon name="check" size={13}/></i><span>Remember me</span></label>
            <button type="button">Forgot password?</button>
          </div>
          <button className="sign-in-submit" type="submit" disabled={loading}>{loading ? "Opening Studio Desk…" : "Sign in"}</button>
        </form>
        <small>DEMO ACCESS · YOUR DETAILS STAY ON THIS DEVICE</small>
      </section>
    </main>
  );
}
