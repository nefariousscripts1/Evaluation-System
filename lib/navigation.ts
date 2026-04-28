import {
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  IdCard,
  LayoutDashboard,
  Star,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/lib/server-auth";

export type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match?: "exact" | "startsWith";
  aliases?: string[];
};

type NavigationConfig = {
  portalTitle: string;
  items: NavigationItem[];
};

const profileNavigationItem: NavigationItem = {
  href: "/profile",
  icon: User,
  label: "My Profile",
  match: "exact",
};

const SECRETARY_ITEMS: NavigationItem[] = [
  { href: "/secretary/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/secretary/instructors", icon: User, label: "Manage Instructors" },
  { href: "/secretary/questionnaire", icon: ClipboardList, label: "Manage Questionnaires" },
  { href: "/secretary/schedule", icon: Calendar, label: "Evaluation Session" },
  { href: "/secretary/students", icon: IdCard, label: "Student Management" },
  { href: "/secretary/users", icon: Users, label: "Users Management" },
  {
    href: "/secretary/reports",
    icon: FileText,
    label: "Results",
    aliases: ["/secretary/summary-comments"],
  },
];

const ROLE_NAVIGATION: Partial<Record<AppRole, NavigationConfig>> = {
  secretary: {
    portalTitle: "Secretary Portal",
    items: SECRETARY_ITEMS,
  },
  student: {
    portalTitle: "Student Portal",
    items: [{ href: "/student/evaluate", icon: Star, label: "Evaluate Instructor" }],
  },
  faculty: {
    portalTitle: "Faculty Portal",
    items: [
      { href: "/results", icon: LayoutDashboard, label: "Results", match: "exact" },
      { href: "/faculty/ratings", icon: BarChart3, label: "View My Ratings" },
      { href: "/faculty/comments", icon: FileText, label: "View Comments" },
    ],
  },
  chairperson: {
    portalTitle: "Chairperson Portal",
    items: [
      { href: "/chairperson/results", icon: BarChart3, label: "View Evaluation Results" },
      { href: "/chairperson/evaluate", icon: Star, label: "Evaluate Faculty" },
      { href: "/chairperson/comments", icon: FileText, label: "View Comments" },
    ],
  },
  dean: {
    portalTitle: "Dean Portal",
    items: [
      { href: "/dean/results", icon: BarChart3, label: "View Evaluation Results" },
      { href: "/dean/evaluate", icon: Star, label: "Evaluate Chairperson" },
      { href: "/dean/comments", icon: FileText, label: "View Comments" },
    ],
  },
  director: {
    portalTitle: "DOI Portal",
    items: [
      { href: "/director/results", icon: BarChart3, label: "View Evaluation Results" },
      { href: "/director/evaluate", icon: Star, label: "Evaluate Dean" },
      { href: "/director/comments", icon: FileText, label: "View Comments" },
    ],
  },
  campus_director: {
    portalTitle: "Campus Director Portal",
    items: [
      { href: "/campus-director/evaluate", icon: Star, label: "Evaluate DOI" },
      { href: "/campus-director/comments", icon: FileText, label: "View Comments" },
      { href: "/campus-director/results", icon: BarChart3, label: "View Ratings" },
    ],
  },
};

export function getNavigationConfig(role?: string | null): NavigationConfig {
  if (!role) {
    return { portalTitle: "Portal", items: [] };
  }

  const config = ROLE_NAVIGATION[role as AppRole];

  if (!config) {
    return { portalTitle: "Portal", items: [] };
  }

  return {
    ...config,
    items: [...config.items, profileNavigationItem],
  };
}

export function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.match === "exact") {
    return pathname === item.href || item.aliases?.includes(pathname) === true;
  }

  return (
    pathname.startsWith(item.href) ||
    item.aliases?.some((alias) => pathname.startsWith(alias)) === true
  );
}
