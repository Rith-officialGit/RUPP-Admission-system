"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, AuthUser, setAuth } from "@/lib/api";
import { Alert, Field, btnPrimary, inputCls } from "@/components/ui";

export default function Register() {
  const router = useRouter();
  const [f, setF] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (f.password !== f.confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      const u = await api<AuthUser>("/auth/register", { body: { fullName: f.fullName, email: f.email, password: f.password } });
      setAuth(u);
      router.push("/student/profile");
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
          <h1 className="mt-2 text-2xl font-bold text-brand-900">Create your applicant account</h1>
        </div>
        <Alert>{error}</Alert>
        <Field label="Full name"><input className={inputCls} required value={f.fullName} onChange={set("fullName")} /></Field>
        <Field label="Email"><input className={inputCls} type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label="Password" hint="At least 8 characters"><input className={inputCls} type="password" required minLength={8} value={f.password} onChange={set("password")} /></Field>
        <Field label="Confirm password"><input className={inputCls} type="password" required value={f.confirm} onChange={set("confirm")} /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Creating…" : "Register"}</button>
        <p className="text-sm text-slate-500">Already registered? <Link className="text-brand-600 hover:underline" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
