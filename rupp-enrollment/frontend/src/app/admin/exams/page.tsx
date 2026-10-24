"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Card, Empty, Field, PageTitle, btnDanger, btnPrimary, inputCls } from "@/components/ui";

const emptyExam = { title: "", majorId: "", durationMinutes: "60", passPercent: "50", description: "" };
const emptyQ = { subject: "", content: "", questionType: "MCQ", options: ["", "", "", ""], correctIndex: 0, marks: "1" };

export default function Exams() {
  const [exams, setExams] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyExam);
  const [sel, setSel] = useState<any>(null);
  const [qs, setQs] = useState<any[]>([]);
  const [q, setQ] = useState<any>(emptyQ);
  const [error, setError] = useState("");

  const load = () => Promise.all([api("/admin/exams"), api("/admin/majors")]).then(([e, m]) => { setExams(e); setMajors(m); });
  const loadQs = (id: number) => api(`/admin/exams/${id}/questions`).then(setQs);
  useEffect(() => { load(); }, []);

  async function act(fn: () => Promise<any>) {
    setError("");
    try { await fn(); } catch (e: any) { setError(e.message); }
  }
  const createExam = (e: FormEvent) => { e.preventDefault(); act(async () => {
    const created = await api("/admin/exams", { body: { ...form, majorId: Number(form.majorId), durationMinutes: Number(form.durationMinutes), passPercent: Number(form.passPercent) } });
    setForm(emptyExam); await load(); setSel(created); setQs([]);
  }); };
  const pick = (ex: any) => { setSel(ex); setQ(emptyQ); loadQs(ex.id); };
  const addQ = (e: FormEvent) => { e.preventDefault(); act(async () => {
    await api(`/admin/exams/${sel.id}/questions`, { body: { ...q, marks: Number(q.marks), options: q.questionType === "MCQ" ? q.options : null } });
    setQ({ ...emptyQ, subject: q.subject }); await loadQs(sel.id); await load();
    setSel((await api("/admin/exams")).find((x: any) => x.id === sel.id));
  }); };
  const delQ = (id: number) => act(async () => {
    await api(`/admin/questions/${id}`, { method: "DELETE" }); await loadQs(sel.id); await load();
    setSel((await api("/admin/exams")).find((x: any) => x.id === sel.id));
  });
  const setOpt = (i: number, v: string) => setQ({ ...q, options: q.options.map((o: string, j: number) => (j === i ? v : o)) });

  return (
    <>
      <PageTitle title="Exams & questions" subtitle="One shared exam engine — each major gets its own subjects, questions and rules." />
      <Alert>{error}</Alert>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Create exam & assign to major">
            <form onSubmit={createExam} className="space-y-3">
              <Field label="Title"><input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Major (the exam is assigned to this program)">
                <select className={inputCls} required value={form.majorId} onChange={(e) => setForm({ ...form, majorId: e.target.value })}>
                  <option value="">Select…</option>{majors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (min)"><input className={inputCls} type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></Field>
                <Field label="Pass mark (%)"><input className={inputCls} type="number" min={0} max={100} value={form.passPercent} onChange={(e) => setForm({ ...form, passPercent: e.target.value })} /></Field>
              </div>
              <Field label="Subjects / description"><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <button className={btnPrimary}>Create exam</button>
            </form>
          </Card>
          <Card title="Exams">
            {exams.length === 0 ? <Empty>No exams yet.</Empty> : (
              <ul className="space-y-2">
                {exams.map((ex) => (
                  <li key={ex.id}>
                    <button onClick={() => pick(ex)} className={`w-full rounded-lg border p-3 text-left text-sm ${sel?.id === ex.id ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <div className="font-semibold">{ex.title}</div>
                      <div className="text-xs text-slate-500">{ex.major?.name} · {ex.durationMinutes} min · {ex.totalMarks} marks · pass {ex.passPercent}%</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {!sel ? <Empty>Select or create an exam to manage its questions.</Empty> : (
            <>
              <Card title={`Add question — ${sel.title}`}>
                <form onSubmit={addQ} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Subject"><input className={inputCls} placeholder="e.g. Mathematics" value={q.subject} onChange={(e) => setQ({ ...q, subject: e.target.value })} /></Field>
                    <Field label="Type">
                      <select className={inputCls} value={q.questionType} onChange={(e) => setQ({ ...q, questionType: e.target.value })}>
                        <option value="MCQ">Multiple choice (auto-graded)</option><option value="WRITTEN">Written (manual grading)</option>
                      </select>
                    </Field>
                    <Field label="Marks"><input className={inputCls} type="number" min={0.5} step={0.5} value={q.marks} onChange={(e) => setQ({ ...q, marks: e.target.value })} /></Field>
                  </div>
                  <Field label="Question"><textarea className={inputCls} rows={2} required value={q.content} onChange={(e) => setQ({ ...q, content: e.target.value })} /></Field>
                  {q.questionType === "MCQ" && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700">Options (select the correct one)</div>
                      {q.options.map((o: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="radio" name="correct" checked={q.correctIndex === i} onChange={() => setQ({ ...q, correctIndex: i })} />
                          <input className={inputCls} placeholder={`Option ${i + 1}`} value={o} onChange={(e) => setOpt(i, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  )}
                  <button className={btnPrimary}>Add question</button>
                </form>
              </Card>
              <Card title={`Questions (${qs.length}) · total ${sel.totalMarks} marks`}>
                {qs.length === 0 ? <Empty>No questions yet.</Empty> : (
                  <ol className="space-y-3">
                    {qs.map((x, i) => (
                      <li key={x.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div><span className="mr-2 rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{x.subject}</span><b>{i + 1}.</b> {x.content}</div>
                          <button className={btnDanger} onClick={() => confirm("Delete this question?") && delQ(x.id)}>Delete</button>
                        </div>
                        {x.questionType === "MCQ" ? (
                          <ul className="mt-2 grid gap-1 sm:grid-cols-2">{x.options.map((o: string, j: number) => <li key={j} className={j === x.correctIndex ? "font-semibold text-emerald-700" : "text-slate-600"}>{j === x.correctIndex ? "✓" : "○"} {o}</li>)}</ul>
                        ) : <p className="mt-2 text-xs text-slate-500">Written answer · graded manually</p>}
                        <div className="mt-1 text-xs text-slate-400">{x.marks} marks</div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
