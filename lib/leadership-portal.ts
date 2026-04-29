import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { SEMESTER_OPTIONS, isValidSemester } from "@/lib/evaluation-session";
import {
  ResultsNotReleasedError,
  assertResultsReleasedForAcademicYear,
  filterReleasedAcademicYears,
  getReleasedAcademicPeriods,
} from "@/lib/results-release";
import {
  getReportableRoleLabel,
  campusDirectorEvaluatedRoles,
  isCampusDirectorRoleFilter,
  type CampusDirectorRoleFilter,
  type ReportableRole,
} from "@/lib/reporting-roles";
import {
  buildSummaryCommentRecords,
  filterInstructorCommentRecords,
  filterSummaryCommentRecords,
  groupSummaryCommentRecordsByInstructor,
  paginateInstructorGroups,
  paginateSummaryCommentRecords,
  type SummaryCommentInstructorGroup,
  type SummaryCommentRecord,
} from "@/lib/summary-comments";
import {
  buildAccessibleResultsUserWhere,
  type ResultsAccessContext,
} from "@/lib/results-access";

export type RatingBreakdown = {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
};

export type LeadershipTargetResult = {
  id: number;
  academicYear: string;
  averageRating: number;
  instructor_id: number;
  instructor_name: string;
  instructor_role: string;
  department_id: string | null;
  college_id: string | null;
  semester: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
  };
};

export type LeadershipResultsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  myRatings: {
    evaluatorName: string;
    evaluatorRole: string;
    overallRating: number;
    breakdown: RatingBreakdown;
    totalRatings: number;
  };
  targetRatings: {
    averageRating: number;
    completionRate: number;
    completedCount: number;
    totalCount: number;
    results: LeadershipTargetResult[];
  };
};

export type LeadershipCommentItem = {
  id: number;
  comment: string;
  academicYear: string;
  evaluatorName: string;
  evaluatorRole: string;
};

export type LeadershipCommentsResponse = {
  academicYear: string;
  years: string[]; 
  semesters: string[];
  semester: string;
  mySummaryComments: LeadershipCommentItem[];
  targetComments: {
    selectedTarget: {
      id: number;
      name: string;
      label: string;
    } | null;
    targets: SummaryCommentInstructorGroup[];
    targetTotal: number;
    comments: SummaryCommentRecord[];
    total: number;
    targetCount: number;
  };
};

export type SingleTargetResultsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  averageRating: number;
  completionRate: number;
  completedCount: number;
  totalCount: number;
  results: LeadershipTargetResult[];
};

export type SingleTargetCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  selectedTarget: {
    id: number;
    name: string;
    label: string;
  } | null;
  targets: SummaryCommentInstructorGroup[];
  targetTotal: number;
  comments: SummaryCommentRecord[];
  total: number;
  targetCount: number;
};

export type CampusDirectorResultsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  role: CampusDirectorRoleFilter;
  averageRating: number;
  completionRate: number;
  completedCount: number;
  totalCount: number;
  results: LeadershipTargetResult[];
};

export type CampusDirectorCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  role: CampusDirectorRoleFilter;
  selectedTarget: {
    id: number;
    name: string;
    label: string;
  } | null;
  targets: SummaryCommentInstructorGroup[];
  targetTotal: number;
  comments: SummaryCommentRecord[];
  total: number;
  targetCount: number;
};

const commentSemesterOptions = ["all"] as const;

export function fallbackAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

export function formatRoleLabel(role: string) {
  switch (role) {
    case "faculty":
      return "Instructor";
    case "campus_director":
      return "Campus Director";
    case "chairperson":
      return "Chairperson";
    case "director":
      return "Director of Instructions";
    default:
      return role
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function buildBreakdown(ratings: number[]): RatingBreakdown {
  return {
    fiveStar: ratings.filter((rating) => rating === 5).length,
    fourStar: ratings.filter((rating) => rating === 4).length,
    threeStar: ratings.filter((rating) => rating === 3).length,
    twoStar: ratings.filter((rating) => rating === 2).length,
    oneStar: ratings.filter((rating) => rating === 1).length,
  };
}

export async function resolveAcademicYears(options?: { releasedOnly?: boolean }) {
  const yearsFromResults = await prisma.result.findMany({
    distinct: ["academicYear"],
    select: { academicYear: true },
    orderBy: { academicYear: "desc" },
  });

  const yearsFromEvaluations = await prisma.evaluation.findMany({
    distinct: ["academicYear"],
    select: { academicYear: true },
    orderBy: { academicYear: "desc" },
  });

  const yearsFromSchedules = await prisma.schedule.findMany({
    distinct: ["academicYear"],
    select: { academicYear: true },
    orderBy: { academicYear: "desc" },
  });

  const years = Array.from(
    new Set([
      ...yearsFromResults.map((item) => item.academicYear),
      ...yearsFromEvaluations.map((item) => item.academicYear),
      ...yearsFromSchedules.map((item) => item.academicYear),
    ])
  );

  if (!options?.releasedOnly) {
    return years;
  }

  return filterReleasedAcademicYears(years);
}

async function resolveReleasedYearAndSemesters() {
  const periods = await getReleasedAcademicPeriods();
  const years = Array.from(new Set(periods.map((period) => period.academicYear)));
  const semestersByYear = new Map<string, string[]>();

  for (const year of years) {
    const availableSemesters = SEMESTER_OPTIONS.filter((semester) =>
      periods.some((period) => period.academicYear === year && period.semester === semester)
    );

    semestersByYear.set(year, availableSemesters);
  }

  return { years, semestersByYear };
}

function resolveSelectedSemester(requestedSemester: string | null, semesters: string[]) {
  if (requestedSemester && isValidSemester(requestedSemester) && semesters.includes(requestedSemester)) {
    return requestedSemester;
  }

  return semesters[0] ?? SEMESTER_OPTIONS[0];
}

async function buildTargetResultsFromEvaluations(params: {
  academicYear: string;
  semester: string;
  evaluatedUserWhere: Prisma.UserWhereInput;
}) {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      academicYear: params.academicYear,
      semester: params.semester,
      evaluated: params.evaluatedUserWhere,
    },
    include: {
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
        select: {
          rating: true,
        },
      },
    },
  });

  const groupedResults = new Map<number, LeadershipTargetResult & { ratingSum: number; ratingCount: number }>();

  for (const evaluation of evaluations) {
    const current =
      groupedResults.get(evaluation.evaluatedId) ??
      {
        id: evaluation.evaluatedId,
        academicYear: evaluation.academicYear,
        averageRating: 0,
        instructor_id: evaluation.evaluatedId,
        instructor_name: evaluation.evaluated.name || evaluation.evaluated.email,
        instructor_role: evaluation.evaluated.role,
        department_id: evaluation.evaluated.department ?? null,
        college_id: evaluation.evaluated.department ?? null,
        semester: evaluation.semester,
        user: evaluation.evaluated,
        ratingSum: 0,
        ratingCount: 0,
      };

    for (const answer of evaluation.answers) {
      current.ratingSum += answer.rating;
      current.ratingCount += 1;
    }

    groupedResults.set(evaluation.evaluatedId, current);
  }

  return Array.from(groupedResults.values())
    .map(({ ratingSum, ratingCount, ...result }) => ({
      ...result,
      averageRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0,
    }))
    .sort(
      (left, right) =>
        right.averageRating - left.averageRating || left.user.id - right.user.id
    );
}

export async function getLeadershipResultsData(params: {
  request: Request;
  sessionUserId: number;
  sessionUserName?: string | null;
  sessionUserEmail?: string | null;
  viewerRoleLabel: string;
  targetRole: "faculty" | "chairperson" | "dean" | "director";
  accessContext: ResultsAccessContext;
}) {
  const {
    request,
    sessionUserId,
    sessionUserName,
    sessionUserEmail,
    viewerRoleLabel,
    targetRole,
    accessContext,
  } =
    params;

  const { years, semestersByYear } = await resolveReleasedYearAndSemesters();
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year")?.trim();
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  const semesters = semestersByYear.get(academicYear) ?? [...SEMESTER_OPTIONS];
  const semester = resolveSelectedSemester(searchParams.get("semester")?.trim() ?? null, semesters);

  await assertResultsReleasedForAcademicYear(academicYear, semester);

  const userEvaluations = await prisma.evaluation.findMany({
    where: {
      evaluatedId: sessionUserId,
      academicYear,
      semester,
    },
    include: {
      answers: {
        select: {
          rating: true,
        },
      },
    },
  });

  const userRatings = userEvaluations.flatMap((evaluation) =>
    evaluation.answers.map((answer) => answer.rating)
  );

  const overallRating =
    userRatings.length > 0
      ? Number(
          (
            userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length
          ).toFixed(2)
        )
      : 0;

  const accessibleTargetUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
    includeOwn: true,
    includeSubordinate: true,
    restrictToRoles: [accessContext.role, targetRole],
  });

  const targetResults = await buildTargetResultsFromEvaluations({
    academicYear,
    semester,
    evaluatedUserWhere: accessibleTargetUsersWhere,
  });

  const totalTargets = await prisma.user.count({
    where: accessibleTargetUsersWhere,
  });

  const averageRating =
    targetResults.length > 0
      ? Number(
          (
            targetResults.reduce((sum, result) => sum + result.averageRating, 0) /
            targetResults.length
          ).toFixed(2)
        )
      : 0;

  const completionRate =
    totalTargets > 0 ? Math.round((targetResults.length / totalTargets) * 100) : 0;

  const response: LeadershipResultsResponse = {
    academicYear,
    years,
    semesters,
    semester,
    myRatings: {
      evaluatorName: sessionUserName || sessionUserEmail || viewerRoleLabel,
      evaluatorRole: viewerRoleLabel,
      overallRating,
      breakdown: buildBreakdown(userRatings),
      totalRatings: userRatings.length,
    },
    targetRatings: {
      averageRating,
      completionRate,
      completedCount: targetResults.length,
      totalCount: totalTargets,
      results: targetResults,
    },
  };

  return response;
}

export async function getSingleTargetResultsData(params: {
  request: Request;
  targetRole: ReportableRole;
  accessContext: ResultsAccessContext;
}) {
  const { request, targetRole, accessContext } = params;
  const { years, semestersByYear } = await resolveReleasedYearAndSemesters();
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year")?.trim();
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  const semesters = semestersByYear.get(academicYear) ?? [...SEMESTER_OPTIONS];
  const semester = resolveSelectedSemester(searchParams.get("semester")?.trim() ?? null, semesters);

  await assertResultsReleasedForAcademicYear(academicYear, semester);

  const accessibleTargetUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
    includeOwn: true,
    includeSubordinate: true,
    restrictToRoles: [accessContext.role, targetRole],
  });

  const targetResults = await buildTargetResultsFromEvaluations({
    academicYear,
    semester,
    evaluatedUserWhere: accessibleTargetUsersWhere,
  });

  const totalTargets = await prisma.user.count({
    where: accessibleTargetUsersWhere,
  });

  const averageRating =
    targetResults.length > 0
      ? Number(
          (
            targetResults.reduce((sum, result) => sum + result.averageRating, 0) /
            targetResults.length
          ).toFixed(2)
        )
      : 0;

  const completionRate =
    totalTargets > 0 ? Math.round((targetResults.length / totalTargets) * 100) : 0;

  const response: SingleTargetResultsResponse = {
    academicYear,
    years,
    semesters,
    semester,
    averageRating,
    completionRate,
    completedCount: targetResults.length,
    totalCount: totalTargets,
    results: targetResults,
  };

  return response;
}

async function buildCommentItemsForUser(userId: number, academicYear: string) {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      evaluatedId: userId,
      academicYear,
    },
    include: {
      evaluator: {
        select: {
          name: true,
          email: true,
          role: true,
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
    orderBy: { createdAt: "desc" },
  });

  return evaluations.flatMap((evaluation) => {
    const items: LeadershipCommentItem[] = [];
    const evaluatorName = evaluation.evaluator.name || evaluation.evaluator.email || "Evaluator";
    const evaluatorRole = formatRoleLabel(evaluation.evaluator.role);

    if (evaluation.generalComment?.trim()) {
      items.push({
        id: evaluation.id * 1000,
        comment: evaluation.generalComment.trim(),
        academicYear: evaluation.academicYear,
        evaluatorName,
        evaluatorRole,
      });
    }

    for (const answer of evaluation.answers) {
      if (answer.comment?.trim()) {
        items.push({
          id: answer.id,
          comment: answer.comment.trim(),
          academicYear: evaluation.academicYear,
          evaluatorName,
          evaluatorRole,
        });
      }
    }

    return items;
  });
}

async function buildTargetCommentRecords(params: {
  academicYear: string;
  semester?: string;
  evaluatedUserWhere: Prisma.UserWhereInput;
}) {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      academicYear: params.academicYear,
      ...(params.semester ? { semester: params.semester } : {}),
      evaluated: params.evaluatedUserWhere,
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
  });

  const labelByTargetId = new Map<number, string>();
  for (const evaluation of evaluations) {
    labelByTargetId.set(
      evaluation.evaluated.id,
      getReportableRoleLabel(evaluation.evaluated.role as ReportableRole)
    );
  }

  return {
    records: buildSummaryCommentRecords(evaluations),
    labelByTargetId,
  };
}

function buildGroupedTargetComments(params: {
  records: SummaryCommentRecord[];
  page: number;
  pageSize: number;
  search: string;
  commentSearch: string;
  selectedTargetId: number | null;
  labelByTargetId: Map<number, string>;
  fallbackTargetLabel?: string;
}) {
  const filteredRecords = filterSummaryCommentRecords(params.records, params.search);
  const targets = groupSummaryCommentRecordsByInstructor(filteredRecords);
  const paginatedTargets = paginateInstructorGroups(targets, params.page, params.pageSize);
  const matchingTargetIds = new Set(targets.map((target) => target.instructor_id));
  const validSelectedTargetId =
    params.selectedTargetId && matchingTargetIds.has(params.selectedTargetId)
      ? params.selectedTargetId
      : null;
  const selectedTargetGroup =
    validSelectedTargetId === null
      ? null
      : targets.find((target) => target.instructor_id === validSelectedTargetId) ?? null;
  const filteredComments =
    validSelectedTargetId === null
      ? []
      : filterInstructorCommentRecords(filteredRecords, validSelectedTargetId, params.commentSearch);

  return {
    selectedTarget:
      selectedTargetGroup === null
        ? null
        : {
            id: selectedTargetGroup.instructor_id,
            name: selectedTargetGroup.instructor_name,
            label:
              params.labelByTargetId.get(selectedTargetGroup.instructor_id) ??
              params.fallbackTargetLabel ??
              "Target",
          },
    targets: paginatedTargets,
    targetTotal: targets.length,
    comments:
      validSelectedTargetId === null
        ? []
        : paginateSummaryCommentRecords(filteredComments, params.page, params.pageSize),
    total: filteredComments.length,
    targetCount: matchingTargetIds.size,
  };
}

export async function getLeadershipCommentsData(params: {
  request: Request;
  sessionUserId: number;
  targetRole: ReportableRole;
  targetLabel: string;
  accessContext: ResultsAccessContext;
}) {
  const { request, sessionUserId, targetRole, targetLabel, accessContext } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "10", 10), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const commentSearch = searchParams.get("commentSearch")?.trim() ?? "";
  const selectedTargetId = Number.parseInt(searchParams.get("targetId") ?? "", 10);
  const requestedSemester = searchParams.get("semester")?.trim().toLowerCase() ?? "all";

  if (!commentSemesterOptions.includes(requestedSemester as (typeof commentSemesterOptions)[number])) {
    throw new Error("Invalid semester filter");
  }

  const years = await resolveAcademicYears({ releasedOnly: true });
  const requestedYear = searchParams.get("academicYear")?.trim() ?? "";
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const mySummaryComments = await buildCommentItemsForUser(sessionUserId, academicYear);
  const accessibleTargetUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
    includeOwn: true,
    includeSubordinate: true,
    restrictToRoles: [accessContext.role, targetRole],
  });
  const targetCommentData = await buildTargetCommentRecords({
    academicYear,
    evaluatedUserWhere: accessibleTargetUsersWhere,
  });
  const targetComments = buildGroupedTargetComments({
    records: targetCommentData.records,
    page,
    pageSize,
    search,
    commentSearch,
    selectedTargetId: Number.isInteger(selectedTargetId) && selectedTargetId > 0 ? selectedTargetId : null,
    labelByTargetId: targetCommentData.labelByTargetId,
    fallbackTargetLabel: targetLabel,
  });

  const response: LeadershipCommentsResponse = {
    academicYear,
    years,
    semesters: ["All Semesters"],
    semester: "all",
    mySummaryComments,
    targetComments,
  };

  return response;
}

export async function getSingleTargetCommentsData(params: {
  request: Request;
  targetRole: ReportableRole;
  targetLabel: string;
  accessContext: ResultsAccessContext;
}) {
  const { request, targetRole, targetLabel, accessContext } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "10", 10), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const commentSearch = searchParams.get("commentSearch")?.trim() ?? "";
  const selectedTargetId = Number.parseInt(searchParams.get("targetId") ?? "", 10);
  const requestedSemester = searchParams.get("semester")?.trim().toLowerCase() ?? "all";

  if (!commentSemesterOptions.includes(requestedSemester as (typeof commentSemesterOptions)[number])) {
    throw new Error("Invalid semester filter");
  }

  const years = await resolveAcademicYears({ releasedOnly: true });
  const requestedYear = searchParams.get("academicYear")?.trim() ?? "";
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const accessibleTargetUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
    includeOwn: true,
    includeSubordinate: true,
    restrictToRoles: [accessContext.role, targetRole],
  });
  const targetCommentData = await buildTargetCommentRecords({
    academicYear,
    evaluatedUserWhere: accessibleTargetUsersWhere,
  });
  const targetComments = buildGroupedTargetComments({
    records: targetCommentData.records,
    page,
    pageSize,
    search,
    commentSearch,
    selectedTargetId: Number.isInteger(selectedTargetId) && selectedTargetId > 0 ? selectedTargetId : null,
    labelByTargetId: targetCommentData.labelByTargetId,
    fallbackTargetLabel: targetLabel,
  });

  const response: SingleTargetCommentsResponse = {
    academicYear,
    years,
    semesters: ["All Semesters"],
    semester: "all",
    selectedTarget: targetComments.selectedTarget,
    targets: targetComments.targets,
    targetTotal: targetComments.targetTotal,
    comments: targetComments.comments,
    total: targetComments.total,
    targetCount: targetComments.targetCount,
  };

  return response;
}

function resolveCampusDirectorRoleFilter(requestedRole: string | null) {
  const normalizedRole = requestedRole?.trim().toLowerCase() ?? "all";
  return isCampusDirectorRoleFilter(normalizedRole) ? normalizedRole : "all";
}

function getCampusDirectorRoles(role: CampusDirectorRoleFilter) {
  return role === "all" ? [...campusDirectorEvaluatedRoles] : [role];
}

export async function getCampusDirectorResultsData(params: {
  request: Request;
  accessContext: ResultsAccessContext;
}) {
  const { request, accessContext } = params;
  const { years, semestersByYear } = await resolveReleasedYearAndSemesters();
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year")?.trim();
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  const semesters = semestersByYear.get(academicYear) ?? [...SEMESTER_OPTIONS];
  const semester = resolveSelectedSemester(searchParams.get("semester")?.trim() ?? null, semesters);

  await assertResultsReleasedForAcademicYear(academicYear, semester);

  const role = resolveCampusDirectorRoleFilter(searchParams.get("role"));
  const roles = getCampusDirectorRoles(role);
  const visibleRoles = role === "all" ? [...roles, accessContext.role] : roles;
  const accessibleTargetUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
    includeOwn: role === "all",
    includeSubordinate: true,
    restrictToRoles: visibleRoles,
  });

  const results = await buildTargetResultsFromEvaluations({
    academicYear,
    semester,
    evaluatedUserWhere: accessibleTargetUsersWhere,
  });

  const totalTargets = await prisma.user.count({
    where: accessibleTargetUsersWhere,
  });

  const averageRating =
    results.length > 0
      ? Number(
          (results.reduce((sum, result) => sum + result.averageRating, 0) / results.length).toFixed(2)
        )
      : 0;

  const completionRate =
    totalTargets > 0 ? Math.round((results.length / totalTargets) * 100) : 0;

  const response: CampusDirectorResultsResponse = {
    academicYear,
    years,
    semesters,
    semester,
    role,
    averageRating,
    completionRate,
    completedCount: results.length,
    totalCount: totalTargets,
    results,
  };

  return response;
}

export async function getCampusDirectorCommentsData(params: {
  request: Request;
  accessContext: ResultsAccessContext;
}) {
  const { request, accessContext } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "10", 10), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const commentSearch = searchParams.get("commentSearch")?.trim() ?? "";
  const selectedTargetId = Number.parseInt(searchParams.get("targetId") ?? "", 10);
  const requestedSemester = searchParams.get("semester")?.trim().toLowerCase() ?? "all";

  if (!commentSemesterOptions.includes(requestedSemester as (typeof commentSemesterOptions)[number])) {
    throw new Error("Invalid semester filter");
  }

  const years = await resolveAcademicYears({ releasedOnly: true });
  const requestedYear = searchParams.get("academicYear")?.trim() ?? "";
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const role = resolveCampusDirectorRoleFilter(searchParams.get("role"));
  const roles = getCampusDirectorRoles(role);
  const visibleRoles = role === "all" ? [...roles, accessContext.role] : roles;
  const accessibleTargetUsersWhere = buildAccessibleResultsUserWhere(accessContext, {
    includeOwn: role === "all",
    includeSubordinate: true,
    restrictToRoles: visibleRoles,
  });
  const targetCommentData = await buildTargetCommentRecords({
    academicYear,
    evaluatedUserWhere: accessibleTargetUsersWhere,
  });
  const targetComments = buildGroupedTargetComments({
    records: targetCommentData.records,
    page,
    pageSize,
    search,
    commentSearch,
    selectedTargetId: Number.isInteger(selectedTargetId) && selectedTargetId > 0 ? selectedTargetId : null,
    labelByTargetId: targetCommentData.labelByTargetId,
  });

  const response: CampusDirectorCommentsResponse = {
    academicYear,
    years,
    semesters: ["All Semesters"],
    semester: "all",
    role,
    selectedTarget: targetComments.selectedTarget,
    targets: targetComments.targets,
    targetTotal: targetComments.targetTotal,
    comments: targetComments.comments,
    total: targetComments.total,
    targetCount: targetComments.targetCount,
  };

  return response;
}
