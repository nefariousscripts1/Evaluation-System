import { redirect } from "next/navigation";
import LoginPageClient from "./LoginPageClient";
import { getValidatedStudentAccess } from "@/lib/student-access";

export default async function LoginPage() {
  const studentAccess = await getValidatedStudentAccess();

  if (studentAccess) {
    redirect("/student/evaluate");
  }

  return <LoginPageClient />;
}
