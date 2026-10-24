"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Alert, Badge, Card, PageTitle, btnPrimary } from "@/components/ui";

const STEPS = ["Profile", "Program", "Application", "Review", "Exam", "Result"];

export default function StudentHome() {
  const [profile, setProfile] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/student/profile"), api("/student/application"), api("/student/exam")])
      .then(([p, a, e]) => { setProfile(p); setApp(a); setExam(e); })
      .catch((e) => setError(e.message))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="text-slate-500">Loading…</p>;

  const s = app?.status as string | undefined;
  let step = 0;
  let next = { text: "Complete your student profile to get started.", href: "/student/profile", cta: "Complete profile" };
  if (profile && !app) { step = 1; next = { text: "Choose the faculty and major you want to apply to.", href: "/student/application", cta: "Select a major" }; }
  if (app && (s === "DRAFT")) { step = 2; next = { text: "Upload your documents and submit your application.", href: "/student/application", cta: "Finish application" }; }
  if (s === "INCOMPLETE") { step = 2; next = { text: "An officer asked for corrections: " + (app.officerNote || ""), href: "/student/application", cta: "Fix application" }; }
  if (s === "PENDING_REVIEW") { step = 3; next = { text: "Your application is being reviewed by the admission office.", href: "/student/application", cta: "View application" }; }
  if (s === "ELIGIBLE") { step = 4; next = { text: "You are eligible! Your exam schedule will be sent to you soon.", href: "/student/exam", cta: "Exam details" }; }
  if (s === "EXAM_SCHEDULED") { step = 4; next = { text: `Exam: ${exam?.examTitle} — opens ${fmtDate(exam?.startTime)}.`, href: "/student/exam", cta: "Go to exam" }; }
  if (s === "EXAM_COMPLETED") { step = 5; next = { text: "Exam submitted. Results will be published after grading and admission review.", href: "/student/result", cta: "Check result" }; }
  if (s === "RESULT_PUBLISHED") { step = 6; next = { text: "Your admission result has been published.", href: "/student/result", cta: "View result" }; }

  return (
    <>
      <PageTitle title="Applicant dashboard" subtitle="Follow your admission progress step by step." />
      <Alert>{error}</Alert>
      <Card className="mb-6">
        <ol className="flex flex-wrap gap-y-4">
          {STEPS.map((name, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={name} className="flex min-w-[110px] flex-1 flex-col items-center text-center">
                <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${done ? "bg-emerald-500 text-white" : current ? "bg-brand-600 text-white ring-4 ring-brand-100" : "bg-slate-200 text-slate-500"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <div className={`mt-2 text-xs font-medium ${current ? "text-brand-700" : "text-slate-500"}`}>{name}</div>
              </li>
            );
          })}
        </ol>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Next step">
          <p className="text-sm text-slate-600">{next.text}</p>
          <Link href={next.href} className={`${btnPrimary} mt-4`}>{next.cta}</Link>
        </Card>
        <Card title="Application status">
          {app ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><Badge value={app.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Major</dt><dd className="font-medium">{app.major?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Faculty</dt><dd className="font-medium">{app.major?.faculty?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Submitted</dt><dd>{fmtDate(app.submittedAt)}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">You have not started an application yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
