"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import AppLogo from "@/components/AppLogo";
import {
  Home,
  User,
  ClipboardList,
  Calendar,
  FileText,
  LogOut,
  BarChart3,
  Users,
  IdCard,
  Star,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  icon: LucideIcon | undefined;
  label: string;
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = session?.user?.role;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Secretary Sidebar
  const secretaryNavItems: NavItem[] = [
    { href: "/secretary/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/secretary/instructors", icon: User, label: "Manage Instructors" },
    { href: "/secretary/questionnaire", icon: ClipboardList, label: "Manage Questionnaires" },
    { href: "/secretary/schedule", icon: Calendar, label: "Evaluation Schedule" },
    { href: "/secretary/students", icon: IdCard, label: "Student Management" },
    { href: "/secretary/users", icon: Users, label: "Users Management" },
    { href: "/secretary/reports", icon: FileText, label: "Results" },
  ];

  // Student Sidebar
  const studentNavItems: NavItem[] = [
    { href: "/student/evaluate", icon: Star, label: "Evaluate Instructor" },
  ];

  // Faculty Sidebar
  const facultyNavItems: NavItem[] = [
    { href: "/results", icon: LayoutDashboard, label: "Results" },
    { href: "/faculty/ratings", icon: BarChart3, label: "View My Ratings" },
    { href: "/faculty/comments", icon: FileText, label: "View Comments" },
  ];

  // Chairperson Sidebar
  const chairpersonNavItems: NavItem[] = [
    { href: "/chairperson/results", icon: BarChart3, label: "View Evaluation Results" },
    { href: "/chairperson/evaluate", icon: Star, label: "Evaluate Faculty" },
    { href: "/chairperson/comments", icon: FileText, label: "View Comments" },
  ];

  // Dean Sidebar
  const deanNavItems: NavItem[] = [
    { href: "/dean/results", icon: BarChart3, label: "View Evaluation Results" },
    { href: "/dean/evaluate", icon: Star, label: "Evaluate Chairperson" },
    { href: "/dean/comments", icon: FileText, label: "View Comments" },
  ];

  // Director Sidebar
  const directorNavItems: NavItem[] = [
    { href: "/director/results", icon: BarChart3, label: "View Evaluation Results" },
    { href: "/director/evaluate", icon: Star, label: "Evaluate Dean" },
    { href: "/director/comments", icon: FileText, label: "View Comments" },
  ];

  // Campus Director Sidebar
  const campusDirectorNavItems: NavItem[] = [
    { href: "/campus-director/evaluate", icon: Star, label: "Evaluate DOI" },
    { href: "/campus-director/comments", icon: FileText, label: "View Comments" },
    { href: "/campus-director/results", icon: BarChart3, label: "View Ratings" },
  ];

  // Get sidebar items based on role
  const getNavItems = () => {
    switch (role) {
      case "secretary":
        return secretaryNavItems;
      case "student":
        return studentNavItems;
      case "faculty":
        return facultyNavItems;
      case "chairperson":
        return chairpersonNavItems;
      case "dean":
        return deanNavItems;
      case "director":
        return directorNavItems;
      case "campus_director":
        return campusDirectorNavItems;
      default:
        return [];
    }
  };

  // Get portal title based on role
  const getPortalTitle = () => {
    switch (role) {
      case "secretary":
        return "Secretary Portal";
      case "student":
        return "Student Portal";
      case "faculty":
        return "Faculty Portal";
      case "chairperson":
        return "Chairperson Portal";
      case "dean":
        return "Dean Portal";
      case "director":
        return "DOI Portal";
      case "campus_director":
        return "Campus Director Portal";
      default:
        return "Portal";
    }
  };

  const navItems = getNavItems();
  const portalTitle = getPortalTitle();
  const initial = userName.charAt(0).toUpperCase() || "U";

  const isActive = (href: string, label?: string) => {
    if (role === "faculty" && pathname === "/results") {
      return label === "Results";
    }

    if (role === "secretary" && href === "/secretary/reports") {
      return pathname?.startsWith("/secretary/reports") || pathname?.startsWith("/secretary/summary-comments");
    }

    return pathname?.startsWith(href);
  };

  return (
    <>
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed left-4 top-4 z-50 hidden h-12 w-12 items-center justify-center rounded-[18px] bg-[#24135f] text-white shadow-[0_18px_36px_rgba(36,19,95,0.18)] transition hover:bg-[#1b0f4d] lg:flex"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#24135f] text-white shadow-[0_18px_36px_rgba(36,19,95,0.18)] transition hover:bg-[#1b0f4d] lg:hidden"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close navigation overlay"
        />
      )}

      <div className={`hidden shrink-0 transition-all duration-300 lg:block ${collapsed ? "w-0" : "w-64"}`} />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-[280px] max-w-[85vw] flex-col border-r border-[#ede8f7] bg-white transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:w-64 lg:max-w-none ${collapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="w-full border-b border-white/10 bg-[#24135f] px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/10">
                <AppLogo className="h-12 w-12 object-contain" />
              </div>
              <div className="leading-tight text-white">
                <h1 className="text-[16px] font-extrabold">Digital Evaluation</h1>
                <h1 className="text-[16px] font-extrabold">System</h1>
                <p className="mt-1 text-[11px] text-white/85">{portalTitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/10 text-white transition hover:bg-white/20 lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {navItems.map((item) => {
            const Icon = item.icon ?? Home;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`mb-2 flex min-h-[46px] items-center gap-3 rounded-[16px] px-4 py-3 text-[14px] font-semibold transition ${
                  isActive(item.href, item.label)
                    ? "bg-[#24135f] text-white shadow-[0_16px_32px_rgba(36,19,95,0.18)]"
                    : "text-[#24135f] hover:bg-[#f7f4ff]"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="w-full border-t border-[#ede8f7] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1edfb] text-[16px] font-bold text-[#24135f] shadow-[0_10px_22px_rgba(36,19,95,0.08)]">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-[#24135f]">
                {userName}
              </p>
              <p className="truncate text-[10px] text-[#9b9b9b]">
                {userEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-red-100 bg-red-50 py-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
