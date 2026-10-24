"use client";
import { ReactNode } from "react";
import Shell from "@/components/Shell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <Shell
      role="STUDENT"
      nav={[
        { href: "/student", label: "Dashboard" },
        { href: "/student/profile", label: "My profile" },
        { href: "/student/application", label: "Application" },
        { href: "/student/exam", label: "Entrance exam" },
        { href: "/student/result", label: "Admission result" },
        { href: "/student/notifications", label: "Notifications" },
      ]}
    >
      {children}
    </Shell>
  );
}
