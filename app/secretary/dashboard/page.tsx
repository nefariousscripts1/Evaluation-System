import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import DashboardContent from "./DashboardContent";

export default async function SecretaryDashboard() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "secretary") redirect("/login");

    const [totalStudents, totalFaculty, totalQuestionnaires, displaySchedules, latestQuestionnaires, latestFaculty] =
      await Promise.all([
        prisma.user.count({
          where: { role: "student", deletedAt: null },
        }),
        prisma.user.count({
          where: {
            role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
            deletedAt: null,
          },
        }),
        prisma.questionnaire.count({
          where: { isActive: true },
        }),
        prisma.schedule.findMany({
          orderBy: { createdAt: "desc" },
          take: 2,
        }),
        prisma.questionnaire.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.user.findMany({
          where: {
            role: { in: ["faculty", "chairperson", "dean", "director", "campus_director"] },
            deletedAt: null,
          },
          select: { id: true, name: true, email: true, role: true, department: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const now = new Date();

    return (
      <DashboardContent
        totalStudents={totalStudents}
        totalFaculty={totalFaculty}
        totalQuestionnaires={totalQuestionnaires}
        displaySchedules={displaySchedules.map((schedule) => ({
          ...schedule,
          startDate: schedule.startDate?.toISOString(),
          endDate: schedule.endDate?.toISOString(),
          isOpen: schedule.isOpen,
          isActiveNow:
            schedule.isOpen &&
            now >= schedule.startDate &&
            now <= schedule.endDate,
        }))}
        latestQuestionnaires={latestQuestionnaires.map((q) => ({
          ...q,
          createdAt: q.createdAt?.toISOString(),
        }))}
        latestFaculty={latestFaculty}
      />
    );
  } catch (error) {
    console.error("Secretary dashboard load failed:", error);
    return (
      <main className="px-4 py-4 sm:px-5 sm:py-6">
        <div className="mx-auto max-w-[1750px] rounded-[18px] border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-[24px] font-extrabold">Dashboard unavailable</h1>
          <p className="mt-2 text-sm">
            We couldn&apos;t load the secretary dashboard right now. Please reload the page or try
            again in a moment.
          </p>
        </div>
      </main>
    );
  }
}
