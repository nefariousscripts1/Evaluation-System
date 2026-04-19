import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "secretary") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalStudentsResult,
      totalFacultyResult,
      totalQuestionnairesResult,
      displaySchedulesResult,
      latestQuestionnairesResult,
      latestFacultyResult,
    ] = await Promise.allSettled([
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

    const logSettledError = (label: string, result: PromiseSettledResult<unknown>) => {
      if (result.status === "rejected") {
        console.error(`Secretary dashboard ${label} failed:`, result.reason);
      }
    };

    logSettledError("totalStudents", totalStudentsResult);
    logSettledError("totalFaculty", totalFacultyResult);
    logSettledError("totalQuestionnaires", totalQuestionnairesResult);
    logSettledError("displaySchedules", displaySchedulesResult);
    logSettledError("latestQuestionnaires", latestQuestionnairesResult);
    logSettledError("latestFaculty", latestFacultyResult);

    const totalStudents = totalStudentsResult.status === "fulfilled" ? totalStudentsResult.value : 0;
    const totalFaculty = totalFacultyResult.status === "fulfilled" ? totalFacultyResult.value : 0;
    const totalQuestionnaires =
      totalQuestionnairesResult.status === "fulfilled" ? totalQuestionnairesResult.value : 0;
    const displaySchedules =
      displaySchedulesResult.status === "fulfilled" ? displaySchedulesResult.value : [];
    const latestQuestionnaires =
      latestQuestionnairesResult.status === "fulfilled" ? latestQuestionnairesResult.value : [];
    const latestFaculty = latestFacultyResult.status === "fulfilled" ? latestFacultyResult.value : [];

    const now = new Date();

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      totalQuestionnaires,
      displaySchedules: displaySchedules.map((schedule) => ({
        ...schedule,
        startDate: schedule.startDate?.toISOString(),
        endDate: schedule.endDate?.toISOString(),
        isActiveNow: schedule.isOpen && now >= schedule.startDate && now <= schedule.endDate,
      })),
      latestQuestionnaires: latestQuestionnaires.map((q) => ({
        ...q,
        createdAt: q.createdAt?.toISOString(),
      })),
      latestFaculty,
    });
  } catch (error) {
    console.error("Secretary dashboard API failed:", error);
    return NextResponse.json(
      {
        totalStudents: 0,
        totalFaculty: 0,
        totalQuestionnaires: 0,
        displaySchedules: [],
        latestQuestionnaires: [],
        latestFaculty: [],
        error: "Failed to load dashboard data",
      },
      { status: 200 }
    );
  }
}
