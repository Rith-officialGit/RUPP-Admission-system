"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Card, Empty, PageTitle } from "@/components/ui";

export default function Result() {
  const [r, setR] = useState<any>(null);
  useEffect(() => { api("/student/result").then(setR); }, []);
  if (!r) return <p className="text-slate-500">Loading…</p>;

  const msg: Record<string, string> = {
    ADMITTED: "Congratulations! You have been admitted.",
    PENDING: "You are on the waiting list. We will contact you if a seat becomes available.",
    NOT_ADMITTED: "We are sorry — you were not admitted this time.",
  };
  return (
    <>
      <PageTitle title="Admission result" />
      {!r.published ? (
        <Empty>Your result has not been published yet. You will receive a notification when it is available.</Empty>
      ) : (
        <Card>
          <div className="flex flex-col items-center py-6 text-center">
            <Badge value={r.decision} />
            <h2 className="mt-4 text-2xl font-bold text-brand-900">{msg[r.decision]}</h2>
            <p className="mt-2 text-slate-600">{r.major} — {r.faculty}</p>
            {r.score != null && (
              <p className="mt-4 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
                Entrance exam score: <b>{r.score}</b> / {r.totalMarks} ({r.percent}%)
              </p>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
