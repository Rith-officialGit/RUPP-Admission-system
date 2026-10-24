"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Card, Field, PageTitle, btnPrimary, inputCls } from "@/components/ui";

const empty = { phone: "", dateOfBirth: "", gender: "", address: "", nationalId: "", schoolName: "", graduationYear: "", highSchoolGrade: "" };

export default function Profile() {
  const [f, setF] = useState<any>(empty);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/student/profile").then((p) => {
      if (p) setF(Object.fromEntries(Object.keys(empty).map((k) => [k, p[k] ?? ""])));
    });
  }, []);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(""); setMsg(""); setBusy(true);
    try {
      await api("/student/profile", {
        method: "PUT",
        body: {
          ...f,
          dateOfBirth: f.dateOfBirth || null,
          graduationYear: f.graduationYear ? Number(f.graduationYear) : null,
          highSchoolGrade: f.highSchoolGrade !== "" ? Number(f.highSchoolGrade) : null,
        },
      });
      setMsg("Profile saved.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="My profile" subtitle="Personal and educational details used for your application." />
      <form onSubmit={save}>
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Personal details">
            <div className="space-y-4">
              <Field label="Phone number"><input className={inputCls} required value={f.phone} onChange={set("phone")} /></Field>
              <Field label="Date of birth"><input className={inputCls} type="date" required value={f.dateOfBirth} onChange={set("dateOfBirth")} /></Field>
              <Field label="Gender">
                <select className={inputCls} value={f.gender} onChange={set("gender")}>
                  <option value="">Select…</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </Field>
              <Field label="National ID / passport number"><input className={inputCls} value={f.nationalId} onChange={set("nationalId")} /></Field>
              <Field label="Address"><textarea className={inputCls} rows={2} value={f.address} onChange={set("address")} /></Field>
            </div>
          </Card>
          <Card title="Education">
            <div className="space-y-4">
              <Field label="High school"><input className={inputCls} required value={f.schoolName} onChange={set("schoolName")} /></Field>
              <Field label="Graduation year"><input className={inputCls} type="number" min={1990} max={2100} value={f.graduationYear} onChange={set("graduationYear")} /></Field>
              <Field label="Final high-school grade (%)" hint="0 – 100, as shown on your diploma/transcript">
                <input className={inputCls} type="number" step="0.1" min={0} max={100} required value={f.highSchoolGrade} onChange={set("highSchoolGrade")} />
              </Field>
            </div>
          </Card>
        </div>
        <div className="mt-6"><button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div>
      </form>
    </>
  );
}
