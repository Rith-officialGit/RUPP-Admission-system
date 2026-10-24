"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, AuthUser, setAuth } from "@/lib/api";
import { Alert, Field, btnPrimary, inputCls } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await api<AuthUser>("/auth/login", { body: { email, password } });
      setAuth(u);
      router.push(u.role === "STUDENT" ? "/student" : "/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <Link href="/" className="text-xs font-semibold text-brand-600">← Royal University of Phnom Penh</Link>
          <h1 className="mt-2 text-2xl font-bold text-brand-900">Sign in</h1>
        </div>
        <Alert>{error}</Alert>
        <Field label="Email"><input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className={inputCls} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <div className="flex justify-between text-sm">
          <Link className="text-brand-600 hover:underline" href="/forgot-password">Forgot password?</Link>
          <Link className="text-brand-600 hover:underline" href="/register">Create account</Link>
        </div>
      </form>
    </main>
  );
}
