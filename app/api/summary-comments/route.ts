import prisma from "@/lib/db";
import { SEMESTER_OPTIONS } from "@/lib/evaluation-session";
import { apiSuccess, handleApiError, parseSearchParams } from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import {
  buildAccessibleResultsUserWhere,
  getResultsAccessContext,
  resultsViewerRoles,
} from "@/lib/results-access";
import {
  buildSummaryCommentRecords,
  filterInstructorCommentRecords,
  filterSummaryCommentRecords,
  groupSummaryCommentRecordsByInstructor,
  paginateInstructorGroups,
  paginateSummaryCommentRecords,
} from "@/lib/summary-comments";
import { summaryCommentsQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(resultsViewerRoles);
    const accessContext = getResultsAccessContext(session);
    const { search, commentSearch, academicYear, semester, instructorId, page, pageSize } = parseSearchParams(
      request,
      summaryCommentsQuerySchema
    );

    if (!accessContext) {
      return apiSuccess({
        viewerRole: null,
        academicYear: "",
        semester: semester || "",
        years: [],
        semesters: SEMESTER_OPTIONS,
        selectedInstructor: null,
        instructors: [],
        instructorTotal: 0,
        comments: [],
        total: 0,
        instructorCount: 0,
      });
    }

    const accessibleUsersWhere = buildAccessibleResultsUserWhere(accessContext);
    const [yearsFromEvaluations, yearsFromSchedules] = await Promise.all([
      prisma.evaluation.findMany({
        where: {
          evaluated: accessibleUsersWhere,
        },
        distinct: ["academicYear"],
        select: { academicYear: true },
        orderBy: { academicYear: "desc" },
      }),
      prisma.schedule.findMany({
        distinct: ["academicYear"],
        select: { academicYear: true },
        orderBy: { academicYear: "desc" },
      }),
    ]);

    const years = Array.from(
      new Set([
        ...yearsFromEvaluations.map((item) => item.academicYear),
        ...yearsFromSchedules.map((item) => item.academicYear),
      ])
    );

    const selectedAcademicYear = academicYear || years[0] || "";

    const evaluations = selectedAcademicYear
      ? await prisma.evaluation.findMany({
          where: {
            academicYear: selectedAcademicYear,
            ...(semester ? { semester } : {}),
            evaluated: accessibleUsersWhere,
            OR: [
              { generalComment: { not: null } },
              { answers: { some: { comment: { not: null } } } },
            ],
          },
          select: {
            id: true,
            academicYear: true,
            semester: true,
            createdAt: true,
            generalComment: true,
            evaluated: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
              },
            },
            answers: {
              where: { comment: { not: null } },
              select: {
                id: true,
                comment: true,
              },
            },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        })
      : [];

    const allComments = filterSummaryCommentRecords(buildSummaryCommentRecords(evaluations), search);
    const instructorGroups = groupSummaryCommentRecordsByInstructor(allComments);
    const paginatedInstructorGroups = paginateInstructorGroups(instructorGroups, page, pageSize);
    const matchingInstructorIds = new Set(instructorGroups.map((comment) => comment.instructor_id));
    const selectedInstructorId =
      typeof instructorId === "number" && matchingInstructorIds.has(instructorId) ? instructorId : null;
    const selectedInstructor =
      selectedInstructorId === null
        ? null
        : instructorGroups.find((group) => group.instructor_id === selectedInstructorId) ?? null;
    const filteredInstructorComments =
      selectedInstructorId === null
        ? []
        : filterInstructorCommentRecords(allComments, selectedInstructorId, commentSearch);
    const detailComments =
      selectedInstructorId === null
        ? []
        : paginateSummaryCommentRecords(filteredInstructorComments, page, pageSize);
    const detailTotal = filteredInstructorComments.length;

    return apiSuccess({
      viewerRole: accessContext.role,
      academicYear: selectedAcademicYear,
      semester: semester || "",
      years,
      semesters: SEMESTER_OPTIONS,
      selectedInstructor,
      instructors: paginatedInstructorGroups,
      instructorTotal: instructorGroups.length,
      comments: detailComments,
      total: detailTotal,
      instructorCount: matchingInstructorIds.size,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch summary comments");
  }
}
