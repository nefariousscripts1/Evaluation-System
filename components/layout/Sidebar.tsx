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
  Star,
  ClipboardCheck,
  LayoutDashboard,
  Crown,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Menu,
  X,
} from "lucide-react";

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
  const secretaryNavItems = [
    { href: "/secretary/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/secretary/instructors", icon: <User size={18} />, label: "Manage Instructors" },
    { href: "/secretary/questionnaire", icon: <ClipboardList size={18} />, label: "Manage Questionnaires" },
    { href: "/secretary/schedule", icon: <Calendar size={18} />, label: "Evaluation Schedule" },
    { href: "/secretary/users", icon: <Users size={18} />, label: "Users Management" },
    { href: "/secretary/reports", icon: <FileText size={18} />, label: "View Evaluation Results" },
    { href: "/secretary/summary-comments", icon: <MessageSquareText size={18} />, label: "View Summary Comments" },
  ];

  // Student Sidebar
  const studentNavItems = [
    { href: "/student/evaluate", icon: <ClipboardCheck size={18} />, label: "Evaluate Instructor" },
  ];

  // Faculty Sidebar
  const facultyNavItems = [
    { href: "/results", icon: <LayoutDashboard size={18} />, label: "Results" },
    { href: "/faculty/ratings", icon: <BarChart3 size={18} />, label: "View My Ratings" },
    { href: "/faculty/comments", icon: <FileText size={18} />, label: "View Comments" },
  ];

  // Chairperson Sidebar
  const chairpersonNavItems = [
    { href: "/chairperson/evaluate", icon: <Star size={18} />, label: "Evaluate Faculty" },
    { href: "/chairperson/results", icon: <BarChart3 size={18} />, label: "Program Results" },
  ];

  // Dean Sidebar
  const deanNavItems = [
    { href: "/dean/evaluate", icon: <Star size={18} />, label: "Evaluate Chairperson" },
    { href: "/dean/results", icon: <BarChart3 size={18} />, label: "Department Results" },
  ];

  // Director Sidebar
  const directorNavItems = [
    { href: "/director/evaluate", icon: <Star size={18} />, label: "Evaluate Dean" },
    { href: "/director/results", icon: <BarChart3 size={18} />, label: "Institute Results" },
  ];

  // Campus Director Sidebar
  const campusDirectorNavItems = [
    { href: "/campus-director/evaluate", icon: <Crown size={18} />, label: "Evaluate Director" },
    { href: "/campus-director/results", icon: <BarChart3 size={18} />, label: "Campus Results" },
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
        return "Director Portal";
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

    return pathname?.startsWith(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#24135f] text-white shadow-lg transition hover:bg-[#1b0f4d] lg:hidden"
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

      <div className={`hidden shrink-0 transition-all duration-300 lg:block ${collapsed ? "w-20" : "w-64"}`} />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[#d8d8d8] bg-white transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "lg:w-20 lg:items-center" : "lg:w-64"}`}
      >
        {/* Header */}
        <div className={`w-full bg-[#24135f] ${collapsed ? "lg:flex lg:justify-center lg:px-2 lg:py-3" : "px-5 py-6"}`}>
          <div className={`flex items-center justify-between gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
            {(!collapsed || mobileOpen) && (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white p-1">
                  <AppLogo className="h-full w-full object-contain" />
                </div>
                <div className="leading-tight text-white">
                  <h1 className="text-[16px] font-extrabold">Digital Evaluation</h1>
                  <h1 className="text-[16px] font-extrabold">System</h1>
                  <p className="mt-1 text-[11px] text-white/85">{portalTitle}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden h-9 w-9 items-center justify-center rounded-[6px] bg-white/10 text-white transition hover:bg-white/20 lg:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-5 ${collapsed ? "w-full px-3 lg:px-2" : "px-3"}`}>
          {navItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`mb-1 flex items-center rounded-[8px] py-3 text-[14px] font-semibold transition ${
                collapsed ? "gap-3 px-4 lg:justify-center lg:px-0" : "gap-3 px-4"
              } ${
                isActive(item.href, item.label)
                  ? "bg-[#24135f] text-white"
                  : "text-[#24135f] hover:bg-[#f2f2f7]"
              }`}
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              {item.icon}
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={`w-full border-t border-[#d8d8d8] py-5 ${collapsed ? "px-5 lg:px-2" : "px-5"}`}>
          <div className={`flex items-center ${collapsed ? "gap-3 lg:justify-center lg:gap-0" : "gap-3"}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d9d9] text-[16px] font-bold text-[#24135f]">
              {initial}
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#24135f]">
                  {userName}
                </p>
                <p className="truncate text-[10px] text-[#9b9b9b]">
                  {userEmail}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`mt-4 flex rounded-[6px] bg-red-50 py-2 text-[13px] font-bold text-red-600 transition hover:bg-red-100 ${
              collapsed ? "w-full items-center justify-center gap-2 lg:mx-auto lg:h-10 lg:w-10 lg:px-0" : "w-full items-center justify-center gap-2"
            }`}
            title={collapsed && !mobileOpen ? "Sign Out" : undefined}
          >
            <LogOut size={14} />
            {(!collapsed || mobileOpen) && "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
