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
} from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const getNavItems = () => {
    switch (role) {
      case "secretary":
        return [
          { href: "/secretary/dashboard", icon: <Home size={18} />, label: "Dashboard" },
          { href: "/secretary/instructors", icon: <User size={18} />, label: "Manage Instructors" },
          { href: "/secretary/questionnaire", icon: <ClipboardList size={18} />, label: "Manage Questionnaires" },
          { href: "/secretary/schedule", icon: <Calendar size={18} />, label: "Evaluation Schedule" },
          { href: "/secretary/users", icon: <Users size={18} />, label: "Users Management" },
          { href: "/secretary/reports", icon: <FileText size={18} />, label: "View Evaluation Results" },
        ];
      case "student":
        return [{ href: "/evaluate", icon: <Star size={18} />, label: "Evaluate Faculty" }];
      case "faculty":
        return [{ href: "/results", icon: <BarChart3 size={18} />, label: "My Results" }];
      case "chairperson":
        return [
          { href: "/evaluate", icon: <Star size={18} />, label: "Evaluate Faculty" },
          { href: "/results", icon: <BarChart3 size={18} />, label: "View Program Results" },
        ];
      case "dean":
        return [
          { href: "/evaluate", icon: <Star size={18} />, label: "Evaluate Chairperson" },
          { href: "/results", icon: <BarChart3 size={18} />, label: "View Department Results" },
        ];
      case "director":
        return [
          { href: "/evaluate", icon: <Star size={18} />, label: "Evaluate Dean" },
          { href: "/results", icon: <BarChart3 size={18} />, label: "View Institute Results" },
        ];
      case "campus_director":
        return [
          { href: "/evaluate", icon: <Star size={18} />, label: "Evaluate Director" },
          { href: "/results", icon: <BarChart3 size={18} />, label: "View Campus Results" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const roleDisplayName = role ? role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ") : "Portal";
  const initial = userName.charAt(0).toUpperCase() || "U";

  const isActive = (href: string) => {
    if (href === "/secretary/dashboard") return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[294px] flex-col border-r border-[#d8d8d8] bg-white">
      {/* Header */}
      <div className="bg-[#24135f] px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-white text-[#24135f]">
            <GraduationCap size={28} />
          </div>
          <div className="leading-tight text-white">
            <h1 className="text-[18px] font-extrabold">Digital Evaluation</h1>
            <h1 className="text-[18px] font-extrabold">System</h1>
            <p className="mt-1 text-[13px] text-white/85">{roleDisplayName} Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-0 py-5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mx-2 mb-1 flex items-center gap-3 rounded-[8px] px-6 py-4 text-[16px] font-semibold transition ${
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
      <div className="border-t border-[#d8d8d8] px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d9d9] text-lg font-bold text-[#24135f]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-[#24135f]">
              {userName}
            </p>
            <p className="truncate text-[11px] text-[#9b9b9b]">
              {userEmail}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-5 flex w-full items-center gap-2 pl-11 text-[14px] font-bold text-red-600 transition hover:text-red-700"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}