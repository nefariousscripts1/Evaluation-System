import { Role } from "@prisma/client";

export type Department = "CSM" | "CTE" | "SAS";

export const VALID_ROLES: Role[] = [
  "student",
  "faculty",
  "chairperson",
  "dean",
  "director",
  "campus_director",
  "secretary",
];

export const VALID_DEPARTMENTS: Department[] = ["CSM", "CTE", "SAS"];

export function isValidRole(role: string): role is Role {
  return VALID_ROLES.includes(role as Role);
}

export function isValidDepartment(
  department: string
): department is Department {
  return VALID_DEPARTMENTS.includes(department as Department);
}
