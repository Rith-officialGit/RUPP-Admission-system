"use client";
import { ReactNode } from "react";
import Shell from "@/components/Shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Shell
      role="STAFF"
      nav={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/programs", label: "Faculties & majors" },
        { href: "/admin/exams", label: "Exams & questions" },
        { href: "/admin/schedules", label: "Schedule & monitor" },
        { href: "/admin/applications", label: "Applications" },
        { href: "/admin/grading", label: "Grading" },
        { href: "/admin/admission", label: "Admission decisions" },
        { href: "/admin/reports", label: "Reports" },
      ]}
    >
      {children}
    </Shell>
  );
}
