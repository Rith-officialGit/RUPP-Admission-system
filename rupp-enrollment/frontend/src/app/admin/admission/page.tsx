"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Badge, Card, Empty, Field, PageTitle, btnGhost, btnPrimary, inputCls } from "@/components/ui";

export default function Admission() {
  const [majors, setMajors] = useState<any[]>([]);
  const [majorId, setMajorId] = useState("");
  const [board, setBoard] = useState<any>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { api("/admin/majors").then(setMajors); }, []);
  const load = (id = majorId) => id ? api(`/admin/admission/${id}`).then(setBoard).catch((e) => setError(e.message)) : setBoard(null);
  useEffect(() => { setMsg(""); setError(""); load(); }, [majorId]); // eslint-disable-line

  async function act(fn: () => Promise<any>, text: (r: any) => string) {
    setError(""); setMsg("");
    try { const r = await fn(); setMsg(text(r)); await load(); } catch (e: any) { setError(e.message); }
  }
  const evaluate = () => act(() => api(`/admin/admission/${majorId}/evaluate`, { method: "POST" }),
    (r) => `Evaluated: ${r.admitted} admitted, ${r.pending} waitlisted, ${r.notAdmitted} not admitted${r.skippedUngraded ? `, ${r.skippedUngraded} skipped (not fully graded)` : ""}. Review, then publish.`);
  const publish = () => confirm("Publish results to applicants? They will be notified.") &&
    act(() => api(`/admin/admission/${majorId}/publish`, { method: "POST" }), (r) => `Published ${r.published} decision(s) and notified applicants.`);
  const decide = (id: number, decision: string) => act(() => api(`/admin/admission/applications/${id}/decide`, { body: { decision } }), () => "Decision updated.");

  const m = board?.major;
  const unpublished = board?.rows.filter((r: any) => r.decision && !r.published).length ?? 0;

  return (
    <>
      <PageTitle title="Admission decisions" subtitle="Check exam results against admission requirements, decide, then publish." />
      <Alert>{error}</Alert>
      <Alert kind="success">{msg}</Alert>
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <Field label="Major">
              <select className={inputCls} value={majorId} onChange={(e) => setMajorId(e.target.value)}>
                <option value="">Select a major…</option>{majors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </Field>
          </div>
          {m && (
            <>
              <button className={btnGhost} onClick={evaluate}>Auto-evaluate</button>
              <button className={btnPrimary} disabled={!unpublished} onClick={publish}>Publish results ({unpublished})</button>
            </>
          )}
        </div>
        {m && (
          <p className="mt-3 text-sm text-slate-500">
            Rule: an applicant is <b>admitted</b> if the exam is passed and high-school grade ≥ {m.minGrade}%; the best scorers fill the {m.seats} seats, other qualified applicants are <b>waitlisted</b>, the rest are <b>not admitted</b>. You can override any decision before publishing.
          </p>
        )}
      </Card>

      {!board ? <Empty>Select a major to see its applicants.</Empty> : board.rows.length === 0 ? <Empty>No scheduled or examined applicants for this major yet.</Empty> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Applicant</th><th>Exam</th><th>Score</th><th>Exam passed</th><th>Grade req.</th><th>Decision</th><th>Override</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {board.rows.map((r: any) => (
                  <tr key={r.applicationId}>
                    <td className="py-2"><div className="font-medium">{r.studentName}</div><div className="text-xs text-slate-400">{r.email}</div></td>
                    <td><Badge value={r.attemptStatus} /></td>
                    <td>{r.percent != null ? `${r.percent}%` : "—"}</td>
                    <td>{r.examPassed == null ? "—" : r.examPassed ? "✓" : "✗"}</td>
                    <td className={r.gradeOk ? "text-emerald-600" : "text-red-600"}>{r.highSchoolGrade ?? "—"}% {r.gradeOk ? "✓" : "✗"}</td>
                    <td><Badge value={r.decision} />{r.published && <span className="ml-1 text-xs text-slate-400">published</span>}</td>
                    <td>
                      {r.status === "EXAM_COMPLETED" && !r.published && (
                        <select className={`${inputCls} !w-auto !py-1`} value="" onChange={(e) => e.target.value && decide(r.applicationId, e.target.value)}>
                          <option value="">Set…</option><option value="ADMITTED">Admitted</option><option value="PENDING">Pending</option><option value="NOT_ADMITTED">Not admitted</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
