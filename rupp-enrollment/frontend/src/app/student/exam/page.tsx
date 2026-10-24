"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Alert, Badge, Card, Empty, PageTitle, btnPrimary, inputCls } from "@/components/ui";

type Answer = { selectedIndex?: number; writtenText?: string };

export default function ExamPage() {
  const [info, setInfo] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [left, setLeft] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const load = () => api("/student/exam").then(setInfo).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const submit = useCallback(async (auto = false) => {
    if (submitting.current || !session) return;
    submitting.current = true;
    setBusy(true);
    try {
      const payload = Object.entries(answers).map(([questionId, a]) => ({ questionId: Number(questionId), ...a }));
      await api("/student/exam/submit", { body: { answers: payload } });
      setSession(null);
      setDone(auto ? "Time is up — your answers were submitted automatically." : "Your answers were submitted successfully.");
      load();
    } catch (e: any) {
      setError(e.message);
      submitting.current = false;
    } finally {
      setBusy(false);
    }
  }, [answers, session]);

  // countdown + auto-submit
  useEffect(() => {
    if (!session) return;
    const deadline = new Date(session.deadline).getTime();
    const tick = () => {
      const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) submit(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session, submit]);

  async function start() {
    setError(""); setBusy(true);
    try { setSession(await api("/student/exam/start", { method: "POST" })); submitting.current = false; }
    catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  const setAns = (id: number, a: Answer) => setAnswers((p) => ({ ...p, [id]: { ...p[id], ...a } }));
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  // ----- exam in progress
  if (session) {
    const subjects: Record<string, any[]> = {};
    session.questions.forEach((q: any) => (subjects[q.subject || "General"] ||= []).push(q));
    let n = 0;
    return (
      <>
        <div className="sticky top-0 z-10 -mx-5 mb-6 flex items-center justify-between border-b bg-white/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
          <div className="font-semibold text-brand-900">{session.title}</div>
          <div className={`rounded-lg px-3 py-1 font-mono text-lg font-bold ${left < 300 ? "bg-red-100 text-red-700" : "bg-brand-50 text-brand-700"}`}>{mm}:{ss}</div>
        </div>
        <Alert>{error}</Alert>
        <div className="space-y-6">
          {Object.entries(subjects).map(([subject, qs]) => (
            <Card key={subject} title={subject}>
              <div className="space-y-6">
                {qs.map((q: any) => {
                  n += 1;
                  return (
                    <div key={q.id}>
                      <div className="mb-2 flex justify-between gap-4 text-sm font-medium text-slate-900">
                        <span>{n}. {q.content}</span><span className="shrink-0 text-xs text-slate-400">{q.marks} marks</span>
                      </div>
                      {q.questionType === "MCQ" ? (
                        <div className="space-y-2">
                          {q.options.map((o: string, i: number) => (
                            <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${answers[q.id]?.selectedIndex === i ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}>
                              <input type="radio" name={`q${q.id}`} checked={answers[q.id]?.selectedIndex === i} onChange={() => setAns(q.id, { selectedIndex: i })} />
                              {o}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea className={inputCls} rows={5} placeholder="Write your answer…" value={answers[q.id]?.writtenText ?? ""} onChange={(e) => setAns(q.id, { writtenText: e.target.value })} />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button className={btnPrimary} disabled={busy} onClick={() => { if (confirm("Submit your answers? You cannot change them afterwards.")) submit(false); }}>Submit exam</button>
        </div>
      </>
    );
  }

  // ----- overview
  return (
    <>
      <PageTitle title="Entrance examination" />
      <Alert>{error}</Alert>
      <Alert kind="success">{done}</Alert>
      {!info ? <p className="text-slate-500">Loading…</p> : !info.scheduled ? (
        <Empty>No examination has been scheduled for you yet. You will be notified once your application is approved and an exam is assigned.</Empty>
      ) : (
        <Card title={info.examTitle}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Opens</dt><dd className="font-medium">{fmtDate(info.startTime)}</dd></div>
            <div><dt className="text-slate-500">Closes</dt><dd className="font-medium">{fmtDate(info.endTime)}</dd></div>
            <div><dt className="text-slate-500">Duration</dt><dd className="font-medium">{info.durationMinutes} minutes</dd></div>
            <div><dt className="text-slate-500">Questions / marks</dt><dd className="font-medium">{info.questionCount} / {info.totalMarks}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Subjects</dt><dd className="font-medium">{info.subjects?.join(", ")}</dd></div>
            <div><dt className="text-slate-500">Your attempt</dt><dd><Badge value={info.attemptStatus} /></dd></div>
          </dl>
          {(info.attemptStatus === "NOT_STARTED" || info.attemptStatus === "IN_PROGRESS") ? (
            <div className="mt-6">
              <p className="mb-3 text-sm text-slate-500">The timer starts as soon as you begin and cannot be paused. Answers are submitted automatically when time runs out.</p>
              <button className={btnPrimary} disabled={busy} onClick={start}>{info.attemptStatus === "IN_PROGRESS" ? "Resume exam" : "Start exam"}</button>
            </div>
          ) : <p className="mt-6 text-sm text-slate-500">You have submitted this examination. Check the result page after results are published.</p>}
        </Card>
      )}
    </>
  );
}
