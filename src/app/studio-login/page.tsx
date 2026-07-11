"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole, Radio } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudioLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }) });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) { setError(result.error || "Access denied."); return; }
    router.replace("/studio");
    router.refresh();
  };

  return (
    <main className="studio-login-page">
      <div className="login-image" />
      <section className="login-card">
        <Link href="/" className="back-link"><ArrowLeft size={14} /> Public signal</Link>
        <div className="login-mark"><Radio size={20} /></div>
        <span>OWNER FREQUENCY / PRIVATE</span>
        <h1>Enter creator studio.</h1>
        <p>Public records are open. Drafts, uploads and production controls require the owner passcode.</p>
        <form onSubmit={submit}>
          <label><span>STUDIO PASSCODE</span><div><LockKeyhole size={15} /><input type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} autoComplete="current-password" autoFocus /></div></label>
          {error && <div className="login-error">{error}</div>}
          <button className="studio-primary-button" disabled={loading || !passcode}>{loading ? "Checking signal…" : "Open studio"}</button>
        </form>
        <small>Session cookies are HTTP-only. The passcode is never stored in the browser.</small>
      </section>
    </main>
  );
}
