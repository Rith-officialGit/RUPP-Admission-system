"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Badge, Card, PageTitle, Stat, btnGhost } from "@/components/ui";

export default function Reports() {
  const [s, setS] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/admin/reports/summary").then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!s) return <p className="text-slate-500">Loading…</p>;

  const maxApplicants = Math.max(1, ...s.byMajor.map((m: any) => m.applicants));
  const csv = () => {
    const head = ["Major", "Faculty", "Seats", "Applicants", "Exams graded", "Avg %", "Pass rate %", "Admitted", "Waitlisted", "Not admitted"];
    const rows = s.byMajor.map((m: any) => [m.major, m.faculty, m.seats, m.applicants, m.examsGraded, m.avgPercent, m.passRate, m.admitted, m.waitlisted, m.notAdmitted]);
    const text = [head, ...rows].map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = "rupp-enrollment-report.csv";
    a.click();
  };

  return (
    <>
      <PageTitle title="Reports" subtitle="Applicants, exam scores, pass rates and enrollment statistics." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Applicants" value={s.totalApplicants} />
        <Stat label="Admitted (decided)" value={s.admittedTotal} tone="green" />
        <Stat label="Awaiting grading" value={s.awaitingGrading} tone="gold" />
        <Stat label="Pending review" value={s.pendingReview} tone="red" />
      </div>
      <Card className="mt-6" title="By major" actions={<button className={btnGhost} onClick={csv}>Export CSV</button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="py-2">Major</th><th className="w-48">Applicants vs seats</th><th>Graded</th><th>Avg score</th><th>Pass rate</th><th>Admitted</th><th>Waitlist</th><th>Rejected</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.byMajor.map((m: any) => (
                <tr key={m.majorId}>
                  <td className="py-3"><div className="font-medium">{m.major}</div><div className="text-xs text-slate-400">{m.faculty}</div></td>
                  <td>
                    <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(m.applicants / maxApplicants) * 100}%` }} /></div>
                    <div className="mt-1 text-xs text-slate-500">{m.applicants} applicants · {m.seats} seats</div>
                  </td>
                  <td>{m.examsGraded}</td><td>{m.avgPercent}%</td><td>{m.passRate}%</td>
                  <td className="font-semibold text-emerald-600">{m.admitted}</td><td>{m.waitlisted}</td><td className="text-red-600">{m.notAdmitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="mt-6" title="Applications by status">
        <div className="flex flex-wrap gap-3">
          {Object.entries(s.byStatus).map(([k, v]: any) => <div key={k} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><Badge value={k} /><b>{v}</b></div>)}
        </div>
      </Card>
    </>
  );
}
