import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import DashboardContent from "./DashboardContent";

export default async function SecretaryDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") redirect("/login");

  // Fetch data
  const totalStudents = await prisma.user.count({
    where: { role: "student", deletedAt: null },
  });

  const totalFaculty = await prisma.user.count({
    where: {
      role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
      deletedAt: null,
    },
  });

  const totalQuestionnaires = await prisma.questionnaire.count({
    where: { isActive: true },
  });

  const displaySchedules = await prisma.schedule.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  const latestQuestionnaires = await prisma.questionnaire.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const latestFaculty = await prisma.user.findMany({
    where: {
      role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
      deletedAt: null,
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Pass raw data (dates as strings) - NO FUNCTIONS
  return (
    <DashboardContent
      totalStudents={totalStudents}
      totalFaculty={totalFaculty}
      totalQuestionnaires={totalQuestionnaires}
      displaySchedules={displaySchedules.map(schedule => ({
        ...schedule,
        startDate: schedule.startDate?.toISOString(),
        endDate: schedule.endDate?.toISOString(),
      }))}
      latestQuestionnaires={latestQuestionnaires.map(q => ({
        ...q,
        createdAt: q.createdAt?.toISOString(),
      }))}
      latestFaculty={latestFaculty}
    />
  );
}