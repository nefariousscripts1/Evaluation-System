import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import DashboardContent from "./DashboardContent";

export default async function SecretaryDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") redirect("/login");

  // Get total students
  const totalStudents = await prisma.user.count({
    where: { role: "student", deletedAt: null },
  });

  // Get total faculty/instructors
  const totalFaculty = await prisma.user.count({
    where: {
      role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
      deletedAt: null,
    },
  });

  // Get total active questionnaires
  const totalQuestionnaires = await prisma.questionnaire.count({
    where: { isActive: true },
  });

  // Get all schedules (both open and closed)
  const displaySchedules = await prisma.schedule.findMany({
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  // Get latest questionnaires
  const latestQuestionnaires = await prisma.questionnaire.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get latest faculty/instructors
  const latestFaculty = await prisma.user.findMany({
    where: {
      role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
      deletedAt: null,
    },
    select: { id: true, name: true, email: true, role: true, department: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <DashboardContent
      totalStudents={totalStudents}
      totalFaculty={totalFaculty}
      totalQuestionnaires={totalQuestionnaires}
      displaySchedules={displaySchedules.map(schedule => ({
        ...schedule,
        startDate: schedule.startDate?.toISOString(),
        endDate: schedule.endDate?.toISOString(),
        isOpen: schedule.isOpen,
      }))}
      latestQuestionnaires={latestQuestionnaires.map(q => ({
        ...q,
        createdAt: q.createdAt?.toISOString(),
      }))}
      latestFaculty={latestFaculty}
    />
  );
}