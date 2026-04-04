"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  Home,
  User,
  ClipboardList,
  Calendar,
  FileText,
  LogOut,
  GraduationCap,
  BarChart3,
  Users,
  Star,
  ClipboardCheck,
  LayoutDashboard,
  BookOpen,
  School,
  Building2,
  Crown,
} from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  // Secretary Sidebar
  const secretaryNavItems = [
    { href: "/secretary/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/secretary/instructors", icon: <User size={18} />, label: "Manage Instructors" },
    { href: "/secretary/questionnaire", icon: <ClipboardList size={18} />, label: "Manage Questionnaires" },
    { href: "/secretary/schedule", icon: <Calendar size={18} />, label: "Evaluation Schedule" },
    { href: "/secretary/users", icon: <Users size={18} />, label: "Users Management" },
    { href: "/secretary/reports", icon: <FileText size={18} />, label: "View Evaluation Results" },
  ];

  // Student Sidebar
  const studentNavItems = [
    { href: "/student/evaluate", icon: <ClipboardCheck size={18} />, label: "Evaluate Instructor" },
  ];

  // Faculty Sidebar
  const facultyNavItems = [
    { href: "/faculty/results", icon: <BarChart3 size={18} />, label: "My Evaluation Results" },
    { href: "/faculty/comments", icon: <FileText size={18} />, label: "Feedback Comments" },
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

  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[280px] flex-col border-r border-[#d8d8d8] bg-white">
      {/* Header */}
      <div className="bg-[#24135f] px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white text-[#24135f]">
            <GraduationCap size={28} />
          </div>
          <div className="leading-tight text-white">
            <h1 className="text-[16px] font-extrabold">Digital Evaluation</h1>
            <h1 className="text-[16px] font-extrabold">System</h1>
            <p className="mt-1 text-[11px] text-white/85">{portalTitle}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-1 flex items-center gap-3 rounded-[8px] px-4 py-3 text-[14px] font-semibold transition ${
              isActive(item.href)
                ? "bg-[#24135f] text-white"
                : "text-[#24135f] hover:bg-[#f2f2f7]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#d8d8d8] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d9d9] text-[16px] font-bold text-[#24135f]">
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
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[6px] bg-red-50 py-2 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}