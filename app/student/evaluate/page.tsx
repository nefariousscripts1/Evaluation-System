import { redirect } from "next/navigation";
import StudentAccessPortal from "@/components/evaluation/StudentAccessPortal";
import { getStudentAccessPayload } from "@/lib/student-access";

export default async function StudentEvaluatePage() {
  const accessPayload = await getStudentAccessPayload();

  if (!accessPayload) {
    redirect("/login?mode=student");
  }

  return <StudentAccessPortal />;
}
  
