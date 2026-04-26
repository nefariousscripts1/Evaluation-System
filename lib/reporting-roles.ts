export const reportableRoles = [
  "faculty",
  "chairperson",
  "dean",
  "director",
  "campus_director",
] as const;

export const campusDirectorEvaluatedRoles = [
  "faculty",
  "chairperson",
  "dean",
  "director",
] as const;

export type ReportableRole = (typeof reportableRoles)[number];
export type CampusDirectorEvaluatedRole = (typeof campusDirectorEvaluatedRoles)[number];
export type CampusDirectorRoleFilter = "all" | CampusDirectorEvaluatedRole;

export function isReportableRole(role: string): role is ReportableRole {
  return reportableRoles.includes(role as ReportableRole);
}

export function isCampusDirectorRoleFilter(role: string): role is CampusDirectorRoleFilter {
  return role === "all" || campusDirectorEvaluatedRoles.includes(role as CampusDirectorEvaluatedRole);
}

export function getReportableRoleLabel(role: string) {
  switch (role) {
    case "faculty":
      return "Instructor";
    case "chairperson":
      return "Chairperson";
    case "dean":
      return "Dean";
    case "director":
      return "Director of Instructions";
    case "campus_director":
      return "Campus Director";
    default:
      return role
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function getReportableRolePluralLabel(role: string) {
  switch (role) {
    case "faculty":
      return "Instructors";
    case "chairperson":
      return "Chairpersons";
    case "dean":
      return "Deans";
    case "director":
      return "Directors of Instructions";
    case "campus_director":
      return "Campus Directors";
    default:
      return `${role}s`;
  }
}

export function getCampusDirectorRoleFilterLabel(role: CampusDirectorRoleFilter) {
  return role === "all" ? "All Roles" : getReportableRoleLabel(role);
}

export function getCampusDirectorRoleFilterPluralLabel(role: CampusDirectorRoleFilter) {
  return role === "all" ? "evaluated roles" : getReportableRolePluralLabel(role);
}

export function getCampusDirectorRoleOptions() {
  return [
    { value: "all" as const, label: "All Roles" },
    ...campusDirectorEvaluatedRoles.map((role) => ({
      value: role,
      label: getReportableRoleLabel(role),
    })),
  ];
}
