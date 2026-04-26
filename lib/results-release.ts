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

export async function getReleasedAcademicYears() {
  const [releasedSchedules, resultYears] = await Promise.all([
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
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    }),
    prisma.result.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
    }),
  ]);

  const yearsWithResults = new Set(resultYears.map((result) => result.academicYear));

  return releasedSchedules
    .map((schedule) => schedule.academicYear)
    .filter((academicYear) => yearsWithResults.has(academicYear));
}

export async function filterReleasedAcademicYears(years: string[]) {
  if (years.length === 0) {
    return [];
  }

  const releasedYears = new Set(await getReleasedAcademicYears());
  return years.filter((year) => releasedYears.has(year));
}

export async function assertResultsReleasedForAcademicYear(academicYear: string) {
  const releaseCount = await prisma.schedule.count({
    where: {
      academicYear,
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
