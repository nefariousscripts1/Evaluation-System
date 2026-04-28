import prisma from "@/lib/db";

export type DashboardScheduleSummary = {
  id: number;
  academicYear?: string | null;
  semester?: string | null;
  startDate: string | null;
  endDate: string | null;
  isOpen?: boolean;
  isActiveNow: boolean;
  accessCode?: string | null;
};

export type DashboardQuestionnaire = {
  id: number;
  questionText: string;
  isActive: boolean;
  createdAt: string;
};

export type DashboardFacultyMember = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
};

export type SecretaryDashboardPayload = {
  totalStudents: number;
  totalFaculty: number;
  totalQuestionnaires: number;
  displaySchedules: DashboardScheduleSummary[];
  latestQuestionnaires: DashboardQuestionnaire[];
  latestFaculty: DashboardFacultyMember[];
};

export const EMPTY_SECRETARY_DASHBOARD_PAYLOAD: SecretaryDashboardPayload = {
  totalStudents: 0,
  totalFaculty: 0,
  totalQuestionnaires: 0,
  displaySchedules: [],
  latestQuestionnaires: [],
  latestFaculty: [],
};

function logSettledError(label: string, result: PromiseSettledResult<unknown>) {
  if (result.status === "rejected") {
    console.error(`Secretary dashboard ${label} failed:`, result.reason);
  }
}

export async function getSecretaryDashboardData(): Promise<SecretaryDashboardPayload> {
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
      select: {
        id: true,
        questionText: true,
        isActive: true,
        createdAt: true,
      },
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

  logSettledError("totalStudents", totalStudentsResult);
  logSettledError("totalFaculty", totalFacultyResult);
  logSettledError("totalQuestionnaires", totalQuestionnairesResult);
  logSettledError("displaySchedules", displaySchedulesResult);
  logSettledError("latestQuestionnaires", latestQuestionnairesResult);
  logSettledError("latestFaculty", latestFacultyResult);

  const now = new Date();
  const displaySchedules =
    displaySchedulesResult.status === "fulfilled"
      ? displaySchedulesResult.value.map((schedule) => ({
          ...schedule,
          startDate: schedule.startDate?.toISOString() ?? null,
          endDate: schedule.endDate?.toISOString() ?? null,
          isActiveNow: schedule.isOpen && now >= schedule.startDate && now <= schedule.endDate,
        }))
      : [];

  return {
    totalStudents: totalStudentsResult.status === "fulfilled" ? totalStudentsResult.value : 0,
    totalFaculty: totalFacultyResult.status === "fulfilled" ? totalFacultyResult.value : 0,
    totalQuestionnaires:
      totalQuestionnairesResult.status === "fulfilled" ? totalQuestionnairesResult.value : 0,
    displaySchedules,
    latestQuestionnaires:
      latestQuestionnairesResult.status === "fulfilled"
        ? latestQuestionnairesResult.value.map((questionnaire) => ({
            ...questionnaire,
            createdAt: questionnaire.createdAt.toISOString(),
          }))
        : [],
    latestFaculty: latestFacultyResult.status === "fulfilled" ? latestFacultyResult.value : [],
  };
}
