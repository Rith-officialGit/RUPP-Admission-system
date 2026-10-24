"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Badge, Card, Field, PageTitle, btnGhost, btnPrimary, inputCls } from "@/components/ui";

const DOCS = [
  { type: "TRANSCRIPT", label: "High-school transcript / diploma", required: true },
  { type: "ID_CARD", label: "National ID or passport", required: true },
  { type: "PHOTO", label: "Passport-size photo", required: true },
  { type: "OTHER", label: "Other supporting document", required: false },
];

export default function Application() {
  const [majors, setMajors] = useState<any[]>([]);
  const [app, setApp] = useState<any>(null);
  const [majorId, setMajorId] = useState("");
  const [statement, setStatement] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hydrate = (a: any) => {
    setApp(a);
    if (a) { setMajorId(String(a.major?.id ?? "")); setStatement(a.statement ?? ""); }
  };
  useEffect(() => {
    api("/public/majors").then(setMajors);
    api("/student/application").then(hydrate);
  }, []);

  const editable = !app || app.status === "DRAFT" || app.status === "INCOMPLETE";
  const grouped = majors.reduce((acc: any, m: any) => {
    (acc[m.faculty.name] ||= []).push(m);
    return acc;
  }, {});
  const selected = majors.find((m) => String(m.id) === majorId);

  async function run(fn: () => Promise<any>, ok: string) {
    setError(""); setMsg(""); setBusy(true);
    try { const r = await fn(); hydrate(r); setMsg(ok); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  const save = () => run(() => api("/student/application", { body: { majorId: Number(majorId), statement } }), "Application saved.");
  const submit = () => run(() => api("/student/application/submit", { method: "POST" }), "Application submitted for review.");
  const upload = (docType: string, file?: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append("docType", docType);
    form.append("file", file);
    return run(() => api("/student/application/documents", { form }), "Document uploaded.");
  };

  return (
    <>
      <PageTitle title="Enrollment application" subtitle="Choose your program, upload documents and submit." />
      <Alert>{error}</Alert>
      <Alert kind="success">{msg}</Alert>
      {app?.status === "INCOMPLETE" && <Alert kind="info"><b>Officer feedback:</b> {app.officerNote}. Fix the items below and submit again.</Alert>}
      {app && <div className="mb-4 flex items-center gap-2 text-sm"><span className="text-slate-500">Status:</span><Badge value={app.status} /></div>}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="1 · Faculty and major">
          <div className="space-y-4">
            <Field label="Major">
              <select className={inputCls} disabled={!editable} value={majorId} onChange={(e) => setMajorId(e.target.value)}>
                <option value="">Select a major…</option>
                {Object.entries(grouped).map(([fac, list]: any) => (
                  <optgroup key={fac} label={fac}>{list.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>
                ))}
              </select>
            </Field>
            {selected && (
              <div className="rounded-lg bg-brand-50 p-3 text-sm text-slate-600">
                <div><b>Seats:</b> {selected.seats} · <b>Minimum grade:</b> {selected.minGrade}%</div>
                {selected.requirements && <div className="mt-1">{selected.requirements}</div>}
              </div>
            )}
            <Field label="Personal statement (optional)">
              <textarea className={inputCls} rows={4} disabled={!editable} value={statement} onChange={(e) => setStatement(e.target.value)} />
            </Field>
            {editable && <button className={btnPrimary} disabled={busy || !majorId} onClick={save}>{app ? "Update application" : "Save application"}</button>}
          </div>
        </Card>

        <Card title="2 · Required documents">
          {!app ? <p className="text-sm text-slate-500">Save your application first, then upload documents.</p> : (
            <ul className="space-y-3">
              {DOCS.map((d) => {
                const have = app.documents?.filter((x: any) => x.docType === d.type) || [];
                return (
                  <li key={d.type} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.label}{d.required && <span className="text-red-500"> *</span>}</span>
                      {have.length > 0 && <span className="text-xs font-semibold text-emerald-600">Uploaded</span>}
                    </div>
                    {have.map((h: any) => <div key={h.id} className="mt-1 truncate text-xs text-slate-500">{h.fileName}</div>)}
                    {editable && <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} className="mt-2 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:font-semibold file:text-brand-700" onChange={(e) => { upload(d.type, e.target.files?.[0]); e.target.value = ""; }} />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {app && editable && (
        <Card className="mt-6" title="3 · Submit">
          <p className="mb-4 text-sm text-slate-600">Make sure your profile and all required documents are complete. The system validates them when you submit.</p>
          <button className={btnPrimary} disabled={busy} onClick={submit}>Submit application</button>
        </Card>
      )}
      {app && !editable && <p className="mt-6 text-sm text-slate-500">Your application has been submitted and can no longer be edited.</p>}
    </>
  );
}
