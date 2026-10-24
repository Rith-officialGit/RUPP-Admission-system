"use client";
import { useEffect, useState } from "react";
import { api, fmtDate, openFile } from "@/lib/api";
import { Alert, Badge, Card, Empty, Field, PageTitle, btnGhost, btnPrimary, inputCls } from "@/components/ui";

const STATUSES = ["", "PENDING_REVIEW", "INCOMPLETE", "ELIGIBLE", "EXAM_SCHEDULED", "EXAM_COMPLETED", "RESULT_PUBLISHED"];

export default function Applications() {
  const [list, setList] = useState<any[] | null>(null);
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [detail, setDetail] = useState<any>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = () => api(`/admin/applications?status=${status}`).then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [status]); // eslint-disable-line

  const open = async (id: number) => { setError(""); setNote(""); setDetail(await api(`/admin/applications/${id}`)); };
  async function review(decision: "ELIGIBLE" | "INCOMPLETE") {
    setError("");
    try {
      await api(`/admin/applications/${detail.application.id}/review`, { body: { decision, note } });
      setDetail(null); load();
    } catch (e: any) { setError(e.message); }
  }
  const a = detail?.application;
  const p = detail?.profile;

  return (
    <>
      <PageTitle title="Applications" subtitle="Review submitted applications: mark eligible, or ask for corrections." />
      <Alert>{error}</Alert>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" title="Applicants" actions={
          <select className={`${inputCls} !w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setDetail(null); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All submitted"}</option>)}
          </select>}>
          {!list ? <p className="text-sm text-slate-500">Loading…</p> : list.length === 0 ? <Empty>No applications in this state.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {list.map((x) => (
                <li key={x.id}>
                  <button onClick={() => open(x.id)} className={`w-full px-2 py-3 text-left text-sm hover:bg-slate-50 ${a?.id === x.id ? "bg-brand-50" : ""}`}>
                    <div className="flex items-center justify-between gap-2"><span className="font-semibold">{x.student.fullName}</span><Badge value={x.status} /></div>
                    <div className="text-xs text-slate-500">{x.major.name} · {fmtDate(x.submittedAt)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-3">
          {!detail ? <Empty>Select an application to review.</Empty> : (
            <Card title={a.student.fullName} actions={<Badge value={a.status} />}>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Email</dt><dd>{a.student.email}</dd></div>
                <div><dt className="text-slate-500">Major</dt><dd className="font-medium">{a.major.name} ({a.major.faculty.name})</dd></div>
                <div><dt className="text-slate-500">Phone</dt><dd>{p?.phone ?? "—"}</dd></div>
                <div><dt className="text-slate-500">Date of birth</dt><dd>{p?.dateOfBirth ?? "—"}</dd></div>
                <div><dt className="text-slate-500">High school</dt><dd>{p?.schoolName ?? "—"} ({p?.graduationYear ?? "—"})</dd></div>
                <div><dt className="text-slate-500">Final grade</dt>
                  <dd className={p?.highSchoolGrade >= a.major.minGrade ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                    {p?.highSchoolGrade ?? "—"}% <span className="font-normal text-slate-400">(min {a.major.minGrade}%)</span></dd></div>
                <div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd>{p?.address ?? "—"}</dd></div>
                {a.statement && <div className="sm:col-span-2"><dt className="text-slate-500">Personal statement</dt><dd className="whitespace-pre-wrap">{a.statement}</dd></div>}
              </dl>
              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold">Documents</div>
                <div className="flex flex-wrap gap-2">
                  {a.documents.length === 0 && <span className="text-sm text-slate-400">None uploaded</span>}
                  {a.documents.map((d: any) => <button key={d.id} className={btnGhost} onClick={() => openFile(`/admin/documents/${d.id}`).catch((e) => setError(e.message))}>{d.docType.replace("_", " ")} · {d.fileName}</button>)}
                </div>
              </div>
              {a.status === "PENDING_REVIEW" ? (
                <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                  <Field label="Note to applicant (required when requesting corrections)"><textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                  <div className="flex gap-2">
                    <button className={btnPrimary} onClick={() => review("ELIGIBLE")}>Mark eligible</button>
                    <button className={btnGhost} onClick={() => review("INCOMPLETE")}>Request corrections</button>
                  </div>
                </div>
              ) : a.officerNote && <p className="mt-4 text-sm text-slate-500"><b>Officer note:</b> {a.officerNote}</p>}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
