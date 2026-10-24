"use client";
import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Empty, PageTitle } from "@/components/ui";

export default function Notifications() {
  const [list, setList] = useState<any[] | null>(null);
  const load = () => api("/student/notifications").then(setList);
  useEffect(() => { load(); }, []);

  async function read(n: any) {
    if (n.seen) return;
    await api(`/student/notifications/${n.id}/read`, { method: "POST" });
    load();
  }

  return (
    <>
      <PageTitle title="Notifications" subtitle="Schedule reminders and result announcements." />
      {!list ? <p className="text-slate-500">Loading…</p> : list.length === 0 ? <Empty>No notifications yet.</Empty> : (
        <ul className="space-y-3">
          {list.map((n) => (
            <li key={n.id} onClick={() => read(n)} className={`cursor-pointer rounded-xl border p-4 ${n.seen ? "border-slate-200 bg-white" : "border-brand-500/40 bg-brand-50"}`}>
              <div className="flex justify-between gap-4">
                <div className="font-semibold text-slate-900">{n.title}{!n.seen && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>}</div>
                <div className="shrink-0 text-xs text-slate-400">{fmtDate(n.createdAt)}</div>
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
