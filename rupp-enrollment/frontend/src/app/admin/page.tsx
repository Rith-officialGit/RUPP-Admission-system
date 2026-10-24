"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Badge, Card, PageTitle, Stat } from "@/components/ui";

export default function AdminHome() {
  const [s, setS] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/admin/reports/summary").then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!s) return <p className="text-slate-500">Loading…</p>;

  const tasks = [
    { n: s.pendingReview, text: "applications waiting for review", href: "/admin/applications" },
    { n: s.eligibleUnscheduled, text: "eligible applicants not yet scheduled", href: "/admin/schedules" },
    { n: s.awaitingGrading, text: "exam attempts awaiting manual grading", href: "/admin/grading" },
  ];
  return (
    <>
      <PageTitle title="Admin dashboard" subtitle="Applicants, statistics and pending tasks." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Applicants" value={s.totalApplicants} />
        <Stat label="Upcoming exams" value={s.upcomingExams} tone="gold" />
        <Stat label="Pending review" value={s.pendingReview} tone="red" />
        <Stat label="Admitted (decided)" value={s.admittedTotal} tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Pending tasks">
          <ul className="divide-y divide-slate-100 text-sm">
            {tasks.map((t) => (
              <li key={t.text} className="flex items-center justify-between py-3">
                <span><b className="text-lg text-brand-700">{t.n}</b> {t.text}</span>
                <Link href={t.href} className="font-semibold text-brand-600 hover:underline">Open →</Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Applications by status">
          {Object.keys(s.byStatus).length === 0 ? <p className="text-sm text-slate-500">No submitted applications yet.</p> : (
            <ul className="space-y-2 text-sm">
              {Object.entries(s.byStatus).map(([k, v]: any) => (
                <li key={k} className="flex items-center justify-between"><Badge value={k} /><b>{v}</b></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
