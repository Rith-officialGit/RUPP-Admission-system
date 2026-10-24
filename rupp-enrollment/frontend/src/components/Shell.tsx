"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { AuthUser, getAuth, setAuth } from "@/lib/api";

type NavItem = { href: string; label: string };

/** Role-guarded layout with sidebar navigation, shared by the student and admin portals. */
export default function Shell({ role, nav, children }: { role: "STUDENT" | "STAFF"; nav: NavItem[]; children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const a = getAuth();
    if (!a) return router.replace("/login");
    const isStaff = a.role === "ADMIN" || a.role === "OFFICER";
    if ((role === "STUDENT" && a.role !== "STUDENT") || (role === "STAFF" && !isStaff)) {
      return router.replace(isStaff ? "/admin" : "/student");
    }
    setUser(a);
  }, [role, router]);

  if (!user) return <div className="p-10 text-center text-slate-500">Loading…</div>;

  const logout = () => {
    setAuth(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen md:flex">
      <aside className={`${open ? "block" : "hidden"} w-full bg-brand-900 text-white md:block md:w-64 md:shrink-0`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-400 text-lg font-extrabold text-brand-900">R</div>
          <div>
            <div className="text-sm font-bold leading-tight">Royal University of Phnom Penh</div>
            <div className="text-xs text-white/60">{role === "STUDENT" ? "Applicant portal" : "Admission office"}</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((n) => {
            const active = n.href === path || (n.href !== "/admin" && n.href !== "/student" && path.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <button className="rounded border px-2 py-1 text-sm md:hidden" onClick={() => setOpen(!open)}>Menu</button>
          <div className="hidden text-sm text-slate-500 md:block">Enrollment &amp; Entrance Examination System</div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <div className="font-semibold text-slate-800">{user.fullName}</div>
              <div className="text-xs text-slate-500">{user.role}</div>
            </div>
            <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Sign out</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
