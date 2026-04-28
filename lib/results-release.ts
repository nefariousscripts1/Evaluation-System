import prisma from "@/lib/db";

export class ResultsNotReleasedError extends Error {
  academicYear?: string;

  constructor(academicYear?: string) {
    super(
      academicYear
        ? `Evaluation results for ${academicYear} are not available yet. Please wait for the secretary to release them.`
        : "Evaluation results are not available yet. Please wait for the secretary to release them."
    );
    this.name = "ResultsNotReleasedError";
    this.academicYear = academicYear;
  }
}

export function isResultsNotReleasedError(error: unknown): error is ResultsNotReleasedError {
  return error instanceof ResultsNotReleasedError;
}

export async function getReleasedAcademicPeriods() {
  const [releasedSchedules, evaluationPeriods, resultYears] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        OR: [
          { resultsReleased: true },
          {
            isOpen: false,
            endDate: {
              lte: new Date(),
            },
          },
        ],
      },
      distinct: ["academicYear", "semester"],
      select: { academicYear: true, semester: true },
      orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
    }),
    prisma.evaluation.findMany({
      distinct: ["academicYear", "semester"],
      select: { academicYear: true, semester: true },
    }),
    prisma.result.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
    }),
  ]);

  const evaluationKeys = new Set(
    evaluationPeriods.map((period) => `${period.academicYear}::${period.semester}`)
  );
  const resultYearSet = new Set(resultYears.map((result) => result.academicYear));

  return releasedSchedules.filter(
    (schedule) =>
      evaluationKeys.has(`${schedule.academicYear}::${schedule.semester}`) ||
      resultYearSet.has(schedule.academicYear)
  );
}

export async function getReleasedAcademicYears() {
  const periods = await getReleasedAcademicPeriods();
  return Array.from(new Set(periods.map((period) => period.academicYear)));
}

export async function filterReleasedAcademicYears(years: string[]) {
  if (years.length === 0) {
    return [];
  }

  const releasedYears = new Set(await getReleasedAcademicYears());
  return years.filter((year) => releasedYears.has(year));
}

export async function assertResultsReleasedForAcademicYear(academicYear: string, semester?: string) {
  const releaseCount = await prisma.schedule.count({
    where: {
      academicYear,
      ...(semester ? { semester } : {}),
      OR: [
        { resultsReleased: true },
        {
          isOpen: false,
          endDate: {
            lte: new Date(),
          },
        },
      ],
    },
  });

  if (releaseCount === 0) {
    throw new ResultsNotReleasedError(academicYear);
  }
}
