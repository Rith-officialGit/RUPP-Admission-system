"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Field, btnPrimary, inputCls } from "@/components/ui";

export default function ForgotPassword() {
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function request(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const r = await api("/auth/forgot-password", { body: { email } });
      setMsg(r.message);
      setStage("reset");
    } catch (err: any) {
      setError(err.message);
    }
  }
  async function reset(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const r = await api("/auth/reset-password", { body: { token, newPassword } });
      setMsg(r.message);
      setStage("request");
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-900">Reset password</h1>
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
        {stage === "request" ? (
          <form onSubmit={request} className="space-y-4">
            <Field label="Email"><input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <button className={`${btnPrimary} w-full`}>Send reset code</button>
            <button type="button" className="text-sm text-brand-600 hover:underline" onClick={() => setStage("reset")}>I already have a code</button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-4">
            <Field label="Reset code" hint="In development the code is printed in the backend console."><input className={inputCls} required value={token} onChange={(e) => setToken(e.target.value)} /></Field>
            <Field label="New password"><input className={inputCls} type="password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
            <button className={`${btnPrimary} w-full`}>Update password</button>
          </form>
        )}
        <Link className="block text-sm text-brand-600 hover:underline" href="/login">← Back to sign in</Link>
      </div>
    </main>
  );
}
