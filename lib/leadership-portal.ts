import prisma from "@/lib/db";
import { ResultsNotReleasedError, assertResultsReleasedForAcademicYear, filterReleasedAcademicYears } from "@/lib/results-release";
import {
  getReportableRoleLabel,
  isCampusDirectorRoleFilter,
  reportableRoles,
  type CampusDirectorRoleFilter,
  type ReportableRole,
} from "@/lib/reporting-roles";

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
    comments: Array<{
      id: number;
      comment: string;
    }>;
    total: number;
  };
};

export type SingleTargetResultsResponse = {
  academicYear: string;
  years: string[];
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
  comments: Array<{
    id: number;
    comment: string;
  }>;
  total: number;
};

export type CampusDirectorResultsResponse = {
  academicYear: string;
  years: string[];
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
  comments: Array<{
    id: number;
    comment: string;
  }>;
  total: number;
};

const semesterOptions = ["all"] as const;

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

export async function getLeadershipResultsData(params: {
  request: Request;
  sessionUserId: number;
  sessionUserName?: string | null;
  sessionUserEmail?: string | null;
  viewerRoleLabel: string;
  targetRole: "faculty" | "chairperson" | "dean" | "director";
}) {
  const { request, sessionUserId, sessionUserName, sessionUserEmail, viewerRoleLabel, targetRole } =
    params;

  const years = await resolveAcademicYears({ releasedOnly: true });
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year")?.trim();
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const userEvaluations = await prisma.evaluation.findMany({
    where: {
      evaluatedId: sessionUserId,
      academicYear,
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

  const targetResults = await prisma.result.findMany({
    where: {
      academicYear,
      user: {
        role: targetRole,
        deletedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: [{ averageRating: "desc" }, { userId: "asc" }],
  });

  const totalTargets = await prisma.user.count({
    where: {
      role: targetRole,
      deletedAt: null,
    },
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
}) {
  const { request, targetRole } = params;
  const years = await resolveAcademicYears({ releasedOnly: true });
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year")?.trim();
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const targetResults = await prisma.result.findMany({
    where: {
      academicYear,
      user: {
        role: targetRole,
        deletedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: [{ averageRating: "desc" }, { userId: "asc" }],
  });

  const totalTargets = await prisma.user.count({
    where: {
      role: targetRole,
      deletedAt: null,
    },
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
    averageRating,
    completionRate,
    completedCount: targetResults.length,
    totalCount: totalTargets,
    results: targetResults,
  };

  return response;
}

function normalizeCommentKey(comment: string) {
  return comment.trim().replace(/\s+/g, " ").toLowerCase();
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

async function buildTargetComments(params: {
  targetId: number;
  targetLabel?: string;
  academicYear: string;
  page: number;
  pageSize: number;
}) {
  const { targetId, targetLabel, academicYear, page, pageSize } = params;

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!target) {
    return {
      selectedTarget: null,
      comments: [] as Array<{ id: number; comment: string }>,
      total: 0,
    };
  }

  const rawItems = await buildCommentItemsForUser(targetId, academicYear);
  const seenComments = new Set<string>();
  const deduplicated = rawItems.filter((item) => {
    const normalized = normalizeCommentKey(item.comment);

    if (!normalized || seenComments.has(normalized)) {
      return false;
    }

    seenComments.add(normalized);
    return true;
  });

  const startIndex = (page - 1) * pageSize;

  return {
    selectedTarget: {
      id: target.id,
      name: target.name || target.email,
      label: targetLabel || getReportableRoleLabel(target.role as ReportableRole),
    },
    comments: deduplicated.slice(startIndex, startIndex + pageSize).map((item) => ({
      id: item.id,
      comment: item.comment,
    })),
    total: deduplicated.length,
  };
}

export async function getLeadershipCommentsData(params: {
  request: Request;
  sessionUserId: number;
  targetRole: ReportableRole;
  targetLabel: string;
}) {
  const { request, sessionUserId, targetRole, targetLabel } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "5", 10), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const selectedTargetId = Number.parseInt(searchParams.get("targetId") ?? "", 10);
  const requestedSemester = searchParams.get("semester")?.trim().toLowerCase() ?? "all";

  if (!semesterOptions.includes(requestedSemester as (typeof semesterOptions)[number])) {
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

  const selectedTarget =
    Number.isInteger(selectedTargetId) && selectedTargetId > 0
      ? await prisma.user.findFirst({
          where: {
            id: selectedTargetId,
            role: targetRole,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        })
      : search.length > 0
      ? await prisma.user.findFirst({
          where: {
            role: targetRole,
            deletedAt: null,
            OR: [{ name: { contains: search } }, { email: { contains: search } }],
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
          },
        })
      : await prisma.user.findFirst({
          where: {
            role: targetRole,
            deletedAt: null,
            evaluationsReceived: {
              some: {
                academicYear,
                OR: [
                  { generalComment: { not: null } },
                  { answers: { some: { comment: { not: null } } } },
                ],
              },
            },
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
          },
        });

  const targetComments = selectedTarget
    ? await buildTargetComments({
        targetId: selectedTarget.id,
        targetLabel,
        academicYear,
        page,
        pageSize,
      })
    : {
        selectedTarget: null,
        comments: [] as Array<{ id: number; comment: string }>,
        total: 0,
      };

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
}) {
  const { request, targetRole, targetLabel } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "5", 10), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const selectedTargetId = Number.parseInt(searchParams.get("targetId") ?? "", 10);
  const requestedSemester = searchParams.get("semester")?.trim().toLowerCase() ?? "all";

  if (!semesterOptions.includes(requestedSemester as (typeof semesterOptions)[number])) {
    throw new Error("Invalid semester filter");
  }

  const years = await resolveAcademicYears({ releasedOnly: true });
  const requestedYear = searchParams.get("academicYear")?.trim() ?? "";
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const selectedTarget =
    Number.isInteger(selectedTargetId) && selectedTargetId > 0
      ? await prisma.user.findFirst({
          where: {
            id: selectedTargetId,
            role: targetRole,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        })
      : search.length > 0
      ? await prisma.user.findFirst({
          where: {
            role: targetRole,
            deletedAt: null,
            OR: [{ name: { contains: search } }, { email: { contains: search } }],
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
          },
        })
      : await prisma.user.findFirst({
          where: {
            role: targetRole,
            deletedAt: null,
            evaluationsReceived: {
              some: {
                academicYear,
                OR: [
                  { generalComment: { not: null } },
                  { answers: { some: { comment: { not: null } } } },
                ],
              },
            },
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
          },
        });

  const targetComments = selectedTarget
    ? await buildTargetComments({
        targetId: selectedTarget.id,
        targetLabel,
        academicYear,
        page,
        pageSize,
      })
    : {
        selectedTarget: null,
        comments: [] as Array<{ id: number; comment: string }>,
        total: 0,
      };

  const response: SingleTargetCommentsResponse = {
    academicYear,
    years,
    semesters: ["All Semesters"],
    semester: "all",
    selectedTarget: targetComments.selectedTarget,
    comments: targetComments.comments,
    total: targetComments.total,
  };

  return response;
}

function resolveCampusDirectorRoleFilter(requestedRole: string | null) {
  const normalizedRole = requestedRole?.trim().toLowerCase() ?? "all";
  return isCampusDirectorRoleFilter(normalizedRole) ? normalizedRole : "all";
}

function getCampusDirectorRoles(role: CampusDirectorRoleFilter) {
  return role === "all" ? [...reportableRoles] : [role];
}

export async function getCampusDirectorResultsData(params: {
  request: Request;
}) {
  const { request } = params;
  const years = await resolveAcademicYears({ releasedOnly: true });
  const { searchParams } = new URL(request.url);
  const requestedYear = searchParams.get("year")?.trim();
  const academicYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  if (!academicYear) {
    throw new ResultsNotReleasedError(requestedYear || undefined);
  }

  await assertResultsReleasedForAcademicYear(academicYear);

  const role = resolveCampusDirectorRoleFilter(searchParams.get("role"));
  const roles = getCampusDirectorRoles(role);

  const results = await prisma.result.findMany({
    where: {
      academicYear,
      user: {
        role: { in: roles },
        deletedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      },
    },
    orderBy: [{ averageRating: "desc" }, { user: { role: "asc" } }, { userId: "asc" }],
  });

  const totalTargets = await prisma.user.count({
    where: {
      role: { in: roles },
      deletedAt: null,
    },
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
}) {
  const { request } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.max(Number.parseInt(searchParams.get("pageSize") ?? "5", 10), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const selectedTargetId = Number.parseInt(searchParams.get("targetId") ?? "", 10);
  const requestedSemester = searchParams.get("semester")?.trim().toLowerCase() ?? "all";

  if (!semesterOptions.includes(requestedSemester as (typeof semesterOptions)[number])) {
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

  const selectedTarget =
    Number.isInteger(selectedTargetId) && selectedTargetId > 0
      ? await prisma.user.findFirst({
          where: {
            id: selectedTargetId,
            role: { in: roles },
            deletedAt: null,
          },
          select: {
            id: true,
            role: true,
          },
        })
      : search.length > 0
      ? await prisma.user.findFirst({
          where: {
            role: { in: roles },
            deletedAt: null,
            OR: [{ name: { contains: search } }, { email: { contains: search } }],
          },
          orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
          select: {
            id: true,
            role: true,
          },
        })
      : await prisma.user.findFirst({
          where: {
            role: { in: roles },
            deletedAt: null,
            evaluationsReceived: {
              some: {
                academicYear,
                OR: [
                  { generalComment: { not: null } },
                  { answers: { some: { comment: { not: null } } } },
                ],
              },
            },
          },
          orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
          select: {
            id: true,
            role: true,
          },
        });

  const targetComments = selectedTarget
    ? await buildTargetComments({
        targetId: selectedTarget.id,
        targetLabel: getReportableRoleLabel(selectedTarget.role as ReportableRole),
        academicYear,
        page,
        pageSize,
      })
    : {
        selectedTarget: null,
        comments: [] as Array<{ id: number; comment: string }>,
        total: 0,
      };

  const response: CampusDirectorCommentsResponse = {
    academicYear,
    years,
    semesters: ["All Semesters"],
    semester: "all",
    role,
    selectedTarget: targetComments.selectedTarget,
    comments: targetComments.comments,
    total: targetComments.total,
  };

  return response;
}
