import { redirect } from "next/navigation";
import LoginPageClient from "./LoginPageClient";
import { getAppSession, getDefaultRouteForRole } from "@/lib/server-auth";
import { getValidatedStudentAccess } from "@/lib/student-access";

export default async function LoginPage() {
  const [session, studentAccess] = await Promise.all([
    getAppSession(),
    getValidatedStudentAccess(),
  ]);

  if (session) {
    redirect(getDefaultRouteForRole(session));
  }

  if (studentAccess) {
    redirect("/student/evaluate");
  }

  return <LoginPageClient />;
}
