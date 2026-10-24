"use client";
import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Alert, Badge, Card, Empty, PageTitle, btnPrimary, inputCls } from "@/components/ui";

export default function Grading() {
  const [list, setList] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("SUBMITTED");
  const [detail, setDetail] = useState<any>(null);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => api(`/admin/attempts?status=${filter}`).then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  async function open(id: number) {
    setError(""); setMsg("");
    const d = await api(`/admin/attempts/${id}`);
    setDetail(d);
    setMarks(Object.fromEntries(d.answers.filter((a: any) => a.questionType === "WRITTEN").map((a: any) => [a.answerId, a.awardedMarks ?? ""])));
  }
  async function save() {
    setError(""); setMsg("");
    try {
      const body = { marks: Object.entries(marks).filter(([, v]) => v !== "").map(([answerId, v]) => ({ answerId: Number(answerId), marks: Number(v) })) };
      const t = await api(`/admin/attempts/${detail.attempt.id}/grade`, { body });
      setMsg(t.status === "GRADED" ? `Graded — final score ${t.totalScore} / ${detail.totalMarks}.` : "Marks saved. Some written answers are still ungraded.");
      await open(detail.attempt.id); load();
    } catch (e: any) { setError(e.message); }
  }
  const t = detail?.attempt;

  return (
    <>
      <PageTitle title="Grading" subtitle="Objective questions are graded automatically. Award marks for written answers here." />
      <Alert>{error}</Alert>
      <Alert kind="success">{msg}</Alert>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" title="Attempts" actions={
          <select className={`${inputCls} !w-auto`} value={filter} onChange={(e) => { setFilter(e.target.value); setDetail(null); }}>
            <option value="SUBMITTED">Awaiting grading</option><option value="GRADED">Graded</option><option value="">All</option>
          </select>}>
          {!list ? <p className="text-sm text-slate-500">Loading…</p> : list.length === 0 ? <Empty>No attempts here.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {list.map((x) => (
                <li key={x.id}><button onClick={() => open(x.id)} className={`w-full px-2 py-3 text-left text-sm hover:bg-slate-50 ${t?.id === x.id ? "bg-brand-50" : ""}`}>
                  <div className="flex items-center justify-between"><span className="font-semibold">{x.application.student.fullName}</span><Badge value={x.status} /></div>
                  <div className="text-xs text-slate-500">{x.schedule.exam.title} · submitted {fmtDate(x.submittedAt)}</div>
                </button></li>
              ))}
            </ul>
          )}
        </Card>
        <div className="lg:col-span-3">
          {!detail ? <Empty>Select an attempt to view answers.</Empty> : (
            <Card title={t.application.student.fullName} actions={<Badge value={t.status} />}>
              <div className="mb-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-500">Auto</div><b>{t.autoScore}</b></div>
                <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-500">Manual</div><b>{t.manualScore}</b></div>
                <div className="rounded-lg bg-brand-50 p-2"><div className="text-xs text-slate-500">Total / {detail.totalMarks}</div><b>{t.status === "GRADED" ? t.totalScore : "—"}</b></div>
              </div>
              <ol className="space-y-4">
                {detail.answers.map((a: any, i: number) => (
                  <li key={a.answerId} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="mb-1 flex justify-between gap-3"><span><span className="mr-2 rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{a.subject}</span><b>{i + 1}.</b> {a.content}</span><span className="shrink-0 text-xs text-slate-400">{a.maxMarks} marks</span></div>
                    {a.questionType === "MCQ" ? (
                      <div className="text-xs">
                        <span>Answered: <b>{a.selectedIndex != null ? a.options[a.selectedIndex] : "— none —"}</b></span>{" · "}
                        <span>Correct: <b className="text-emerald-700">{a.options[a.correctIndex]}</b></span>{" · "}
                        <span className={a.awardedMarks > 0 ? "text-emerald-700" : "text-red-600"}>{a.awardedMarks} marks</span>
                      </div>
                    ) : (
                      <div>
                        <p className="mt-1 whitespace-pre-wrap rounded bg-slate-50 p-2 text-slate-700">{a.writtenText || <i className="text-slate-400">No answer</i>}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">Marks: <input className={`${inputCls} !w-24`} type="number" min={0} max={a.maxMarks} step={0.5} value={marks[a.answerId] ?? ""} onChange={(e) => setMarks({ ...marks, [a.answerId]: e.target.value })} /> / {a.maxMarks}</div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <div className="mt-5"><button className={btnPrimary} onClick={save}>Save marks</button></div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
