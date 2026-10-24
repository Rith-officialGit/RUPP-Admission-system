"use client";
import { FormEvent, useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Alert, Badge, Card, Empty, Field, PageTitle, btnGhost, btnPrimary, inputCls } from "@/components/ui";

export default function Schedules() {
  const [exams, setExams] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [eligible, setEligible] = useState<any[]>([]);
  const [examId, setExamId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [monitor, setMonitor] = useState<{ id: number; rows: any[] } | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => Promise.all([api("/admin/exams"), api("/admin/schedules")]).then(([e, s]) => { setExams(e); setSchedules(s); });
  useEffect(() => { load(); }, []);

  const exam = exams.find((e) => String(e.id) === examId);
  useEffect(() => {
    setPicked([]);
    if (!exam) return setEligible([]);
    api(`/admin/applications?status=ELIGIBLE&majorId=${exam.major.id}`).then(setEligible);
  }, [examId]); // eslint-disable-line

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      await api("/admin/schedules", { body: { examId: Number(examId), startTime: start, endTime: end, applicationIds: picked } });
      setMsg(`Exam scheduled for ${picked.length} applicant(s); they have been notified.`);
      setPicked([]); await load();
      if (exam) setEligible(await api(`/admin/applications?status=ELIGIBLE&majorId=${exam.major.id}`));
    } catch (err: any) { setError(err.message); }
  }
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const openMonitor = async (id: number) => setMonitor({ id, rows: await api(`/admin/schedules/${id}/monitor`) });

  return (
    <>
      <PageTitle title="Schedule & monitor examinations" subtitle="Set the date and time, choose eligible applicants, then track attempts live." />
      <Alert>{error}</Alert>
      <Alert kind="success">{msg}</Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Schedule an examination">
          <form onSubmit={create} className="space-y-3">
            <Field label="Exam">
              <select className={inputCls} required value={examId} onChange={(e) => setExamId(e.target.value)}>
                <option value="">Select…</option>{exams.map((x) => <option key={x.id} value={x.id}>{x.title} — {x.major?.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opens"><input className={inputCls} type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="Closes"><input className={inputCls} type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Eligible applicants ({picked.length} selected)</span>
                {eligible.length > 0 && <button type="button" className="text-xs font-semibold text-brand-600" onClick={() => setPicked(picked.length === eligible.length ? [] : eligible.map((a) => a.id))}>Select all</button>}
              </div>
              {!exam ? <p className="text-sm text-slate-400">Choose an exam first.</p> : eligible.length === 0 ? <Empty>No eligible applicants for {exam.major.name}.</Empty> : (
                <ul className="max-h-60 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200">
                  {eligible.map((a) => (
                    <li key={a.id}><label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={picked.includes(a.id)} onChange={() => toggle(a.id)} />{a.student.fullName}<span className="text-xs text-slate-400">{a.student.email}</span>
                    </label></li>
                  ))}
                </ul>
              )}
            </div>
            <button className={btnPrimary} disabled={!picked.length}>Schedule exam</button>
          </form>
        </Card>

        <Card title="Scheduled examinations">
          {schedules.length === 0 ? <Empty>Nothing scheduled yet.</Empty> : (
            <ul className="space-y-2">
              {schedules.map((s) => (
                <li key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{s.exam.title}</div>
                      <div className="text-xs text-slate-500">{fmtDate(s.startTime)} → {fmtDate(s.endTime)} · {s.applicantCount} applicants</div>
                    </div>
                    <button className={btnGhost} onClick={() => openMonitor(s.id)}>Monitor</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {monitor && (
        <Card className="mt-6" title={`Live monitor — schedule #${monitor.id}`} actions={<button className={btnGhost} onClick={() => openMonitor(monitor.id)}>Refresh</button>}>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Applicant</th><th>Attempt</th><th>Started</th><th>Submitted</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {monitor.rows.map((r) => (
                <tr key={r.applicationId}><td className="py-2 font-medium">{r.studentName}</td><td><Badge value={r.attemptStatus} /></td><td>{fmtDate(r.startedAt)}</td><td>{fmtDate(r.submittedAt)}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
