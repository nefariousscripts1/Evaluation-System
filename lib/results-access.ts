import type { Prisma, Role } from "@prisma/client";
import type { Session } from "next-auth";

export type ResultsViewerRole =
  | "campus_director"
  | "secretary"
  | "director"
  | "dean"
  | "chairperson"
  | "faculty";

export const resultsViewerRoles: Role[] = [
  "faculty",
  "chairperson",
  "dean",
  "director",
  "campus_director",
  "secretary",
];

export type ResultsAccessContext = {
  userId: number;
  role: ResultsViewerRole;
  department: string | null;
  departmentScope: string[];
  department_id: string | null;
  college_id: string | null;
};

export function normalizeResultsViewerRole(role: string | undefined | null): ResultsViewerRole | null {
  switch ((role || "").trim().toLowerCase()) {
    case "campus_director":
      return "campus_director";
    case "secretary":
      return "secretary";
    case "director":
    case "doi":
    case "director_of_instruction":
      return "director";
    case "dean":
      return "dean";
    case "chairperson":
      return "chairperson";
    case "faculty":
      return "faculty";
    default:
      return null;
  }
}

export function parseDepartmentScope(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getResultsAccessContext(session: Session) {
  const userId = Number.parseInt(session.user.id ?? "", 10);
  const normalizedRole = normalizeResultsViewerRole(session.user.role);

  if (!Number.isInteger(userId) || userId <= 0 || !normalizedRole) {
    return null;
  }

  const department = session.user.department ?? null;
  const departmentScope = parseDepartmentScope(department);

  return {
    userId,
    role: normalizedRole,
    department,
    departmentScope,
    department_id: department,
    college_id: department,
  } satisfies ResultsAccessContext;
}

function buildDepartmentVisibilityWhere(role: Role, departmentScope: string[]): Prisma.UserWhereInput | null {
  if (departmentScope.length === 0) {
    return null;
  }

  return {
    role,
    OR: departmentScope.map((scope) => ({
      department: { contains: scope },
    })),
  };
}

function roleAllowedByRestriction(role: Role, restrictToRoles?: Role[]) {
  return !restrictToRoles || restrictToRoles.includes(role);
}

export function buildAccessibleResultsUserWhere(
  context: ResultsAccessContext,
  options?: {
    includeOwn?: boolean;
    includeSubordinate?: boolean;
    restrictToRoles?: Role[];
  }
): Prisma.UserWhereInput {
  const includeOwn = options?.includeOwn ?? true;
  const includeSubordinate = options?.includeSubordinate ?? true;
  const restrictToRoles = options?.restrictToRoles;

  const ownCondition =
    includeOwn && (!restrictToRoles || roleAllowedByRestriction(context.role, restrictToRoles))
      ? ({ id: context.userId } satisfies Prisma.UserWhereInput)
      : null;

  let subordinateCondition: Prisma.UserWhereInput | null = null;

  if (includeSubordinate) {
    switch (context.role) {
      case "director":
        subordinateCondition = roleAllowedByRestriction("dean", restrictToRoles)
          ? { role: "dean" }
          : null;
        break;
      case "dean":
        subordinateCondition = roleAllowedByRestriction("chairperson", restrictToRoles)
          ? buildDepartmentVisibilityWhere("chairperson", context.departmentScope)
          : null;
        break;
      case "chairperson":
        subordinateCondition = roleAllowedByRestriction("faculty", restrictToRoles)
          ? buildDepartmentVisibilityWhere("faculty", context.departmentScope)
          : null;
        break;
      case "faculty":
        subordinateCondition = null;
        break;
      case "campus_director":
      case "secretary":
        subordinateCondition = restrictToRoles ? { role: { in: restrictToRoles } } : {};
        break;
      default:
        subordinateCondition = null;
        break;
    }
  }

  const orConditions = [ownCondition, subordinateCondition].filter(
    (condition): condition is Prisma.UserWhereInput => Boolean(condition)
  );

  if (orConditions.length === 0) {
    return {
      id: -1,
      deletedAt: null,
    };
  }

  if (context.role === "campus_director" || context.role === "secretary") {
    if (!includeOwn && includeSubordinate) {
      return {
        deletedAt: null,
        ...(restrictToRoles ? { role: { in: restrictToRoles } } : {}),
      };
    }

    if (includeOwn && !includeSubordinate) {
      return {
        id: context.userId,
        deletedAt: null,
      };
    }
  }

  return {
    deletedAt: null,
    OR: orConditions,
  };
}

export function getSubordinateResultsRole(role: ResultsViewerRole): Role | null {
  switch (role) {
    case "director":
      return "dean";
    case "dean":
      return "chairperson";
    case "chairperson":
      return "faculty";
    default:
      return null;
  }
}
