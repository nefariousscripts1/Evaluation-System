import { redirect } from "next/navigation";
import { getDefaultRouteForRole, getAppSession } from "@/lib/server-auth";
import { getValidatedStudentAccess } from "@/lib/student-access";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, studentAccess] = await Promise.all([
    getAppSession(),
    getValidatedStudentAccess(),
  ]);

  if (session && session.user.role !== "student") {
    redirect(getDefaultRouteForRole(session));
  }

  if (!studentAccess) {
    redirect("/login?mode=student");
  }

  return <div className="min-h-screen w-full bg-[#f5f4f7]">{children}</div>;
}
