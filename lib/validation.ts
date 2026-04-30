import { Role } from "@prisma/client";
import { z } from "zod";
import { SEMESTER_OPTIONS } from "@/lib/evaluation-session";
import {
  campusDirectorEvaluatedRoles,
  reportableRoles,
  type CampusDirectorRoleFilter,
} from "@/lib/reporting-roles";

const CONTROL_CHARACTER_REGEX = /[\u0000-\u001F\u007F]/g;
const HTML_TAG_REGEX = /<[^>]*>/g;
const MULTIPLE_SPACES_REGEX = /[ \t]{2,}/g;
const MULTIPLE_NEWLINES_REGEX = /\n{3,}/g;

const DEPARTMENT_OPTIONS = ["CSM", "CTE", "SAS"] as const;
const STAFF_ROLES = [
  "faculty",
  "chairperson",
  "dean",
  "director",
  "campus_director",
  "secretary",
] as const;
const STAFF_ROLE_REQUIRED_MESSAGE = "Please select a role.";

function isStaffRole(value: string): value is (typeof STAFF_ROLES)[number] {
  return STAFF_ROLES.includes(value as (typeof STAFF_ROLES)[number]);
}

function normalizeWhitespace(value: string, preserveNewlines = false) {
  if (!preserveNewlines) {
    return value.replace(/\s+/g, " ").trim();
  }

  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(MULTIPLE_SPACES_REGEX, " ").trim())
    .join("\n")
    .replace(MULTIPLE_NEWLINES_REGEX, "\n\n")
    .trim();
}

export function sanitizeText(value: string, options?: { preserveNewlines?: boolean }) {
  const preserveNewlines = options?.preserveNewlines ?? false;

  return normalizeWhitespace(
    value.replace(CONTROL_CHARACTER_REGEX, " ").replace(HTML_TAG_REGEX, " "),
    preserveNewlines
  );
}

function sanitizeCode(value: string) {
  return sanitizeText(value).replace(/\s+/g, "").toUpperCase();
}

function sanitizeEmail(value: string) {
  return sanitizeText(value).toLowerCase();
}

function parseDepartments(value: unknown) {
  const values =
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => sanitizeText(item).toUpperCase())
          .filter(Boolean)
      : Array.isArray(value)
      ? value
          .map((item) => sanitizeText(String(item)).toUpperCase())
          .filter(Boolean)
      : [];

  return Array.from(new Set(values));
}

function normalizeOptionalText(value: unknown, maxLength: number, preserveNewlines = false) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const sanitized = sanitizeText(String(value), { preserveNewlines });
  return sanitized.length === 0 ? null : sanitized.slice(0, maxLength);
}

function buildAcademicYearRefinement(value: string) {
  const [startYear, endYear] = value.split("-").map(Number);
  return endYear === startYear + 1;
}

const departmentArraySchema = z
  .custom<string[]>((value) => Array.isArray(value) || typeof value === "string" || value == null)
  .transform((value) => parseDepartments(value))
  .superRefine((departments, ctx) => {
    if (departments.length > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "You can select up to three departments",
      });
    }

    for (const department of departments) {
      if (!DEPARTMENT_OPTIONS.includes(department as (typeof DEPARTMENT_OPTIONS)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "One or more departments are invalid",
        });
        break;
      }
    }
  });

export const idRouteParamSchema = z
  .object({
    id: z.string().regex(/^\d+$/, "Invalid record ID"),
  })
  .transform(({ id }) => ({
    id: Number.parseInt(id, 10),
  }));

export const emailSchema = z
  .string()
  .transform((value) => sanitizeEmail(value))
  .pipe(
    z
      .string()
      .min(1, "Email is required")
      .max(254, "Email is too long")
      .email("Invalid email address")
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password must be 72 characters or fewer");

export const staffRoleSchema = z
  .preprocess((value) => (typeof value === "string" ? value : ""), z.string())
  .transform((value) => sanitizeText(value).toLowerCase())
  .pipe(z.string().min(1, STAFF_ROLE_REQUIRED_MESSAGE))
  .refine(isStaffRole, STAFF_ROLE_REQUIRED_MESSAGE)
  .transform((value) => value as (typeof STAFF_ROLES)[number]);
export const appRoleSchema = z.nativeEnum(Role);
export const reportableRoleSchema = z.enum(reportableRoles);
export const semesterSchema = z.enum(SEMESTER_OPTIONS);

export const academicYearSchema = z
  .string()
  .transform((value) => sanitizeText(value))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Academic year must be in YYYY-YYYY format")
      .refine(buildAcademicYearRefinement, "Academic year must span consecutive years")
  );

export const nameSchema = z
  .string()
  .transform((value) => sanitizeText(value))
  .pipe(
    z
      .string()
      .min(2, "Name is required")
      .max(120, "Name is too long")
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9\s.,'()&/-]*$/,
        "Name contains invalid characters"
      )
  );

export const categorySchema = z
  .string()
  .transform((value) => sanitizeText(value))
  .pipe(
    z
      .string()
      .min(1, "Category is required")
      .max(80, "Category is too long")
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9\s.,'()&/-]*$/,
        "Category contains invalid characters"
      )
  );

export const departmentStringSchema = departmentArraySchema.transform((departments) =>
  departments.length > 0 ? departments.join(", ") : null
);

export const studentIdSchema = z
  .string()
  .transform((value) => sanitizeText(value).toUpperCase())
  .pipe(
    z
      .string()
      .min(1, "Student ID is required")
      .max(40, "Student ID is too long")
      .regex(/^[A-Z0-9-]+$/, "Student ID may only contain letters, numbers, and hyphens")
  );

export const accessCodeSchema = z
  .string()
  .transform((value) => sanitizeCode(value))
  .pipe(
    z
      .string()
      .min(4, "Access code is required")
      .max(32, "Access code is too long")
      .regex(/^[A-HJ-NP-Z2-9]+$/, "Access code format is invalid")
  );

export const textSearchSchema = z
  .string()
  .transform((value) => sanitizeText(value))
  .pipe(z.string().max(120, "Search value is too long"));

export const optionalCommentSchema = z
  .any()
  .transform((value) => normalizeOptionalText(value, 2000, true));

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const studentRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: z.literal("student"),
  studentId: studentIdSchema,
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .transform((value) => sanitizeText(value))
    .pipe(z.string().min(1, "Reset token is required").max(4096, "Reset token is invalid")),
  password: passwordSchema,
});

export const staffLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: staffRoleSchema,
});

const rawAccessCodeSchema = z
  .string()
  .transform((value) => sanitizeCode(value))
  .pipe(
    z
      .string()
      .min(4, "Access code is required")
      .max(32, "Access code is too long")
      .regex(/^[A-HJ-NP-Z2-9]+$/, "Access code format is invalid")
  );

export const studentAccessStartSchema = z
  .object({
    accessCode: z.string().optional(),
    portalAccessCode: z.string().optional(),
    studentId: studentIdSchema,
  })
  .superRefine(({ accessCode, portalAccessCode }, ctx) => {
    const parsedAccessCode = rawAccessCodeSchema.safeParse(accessCode || portalAccessCode || "");

    if (!parsedAccessCode.success) {
      for (const issue of parsedAccessCode.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: issue.path,
        });
      }
    }
  })
  .transform(({ accessCode, portalAccessCode, studentId }) => ({
    accessCode: sanitizeCode(accessCode || portalAccessCode || ""),
    studentId,
  }));

export const instructorCodeSchema = z.object({
  instructorCode: accessCodeSchema,
});

export const evaluationAnswerSchema = z.object({
  questionId: z.coerce.number().int().positive("Invalid question ID"),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
});

export const evaluationSubmissionSchema = z.object({
  evaluatedId: z.coerce.number().int().positive("Invalid evaluated user ID"),
  scheduleId: z.coerce.number().int().positive("Invalid schedule ID").nullable().optional(),
  academicYear: academicYearSchema.optional(),
  semester: semesterSchema.optional(),
  answers: z.array(evaluationAnswerSchema).min(1, "Please answer all questions"),
  comment: optionalCommentSchema,
});

export const evaluationEligibilityQuerySchema = z.object({
  evaluatedId: z.coerce.number().int().positive("Please select a person to evaluate"),
  scheduleId: z.coerce.number().int().positive("Invalid schedule ID").nullable().optional(),
  academicYear: academicYearSchema,
  semester: semesterSchema,
});

export const evaluationFeedbackSchema = z.object({
  answers: z.array(evaluationAnswerSchema).min(1, "Please answer all questions"),
  comment: optionalCommentSchema,
});

export const staffUserCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: staffRoleSchema,
  department: departmentStringSchema.optional().default(null),
});

export const staffUserUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }

      const sanitized = sanitizeText(value);
      return sanitized.length === 0 ? undefined : passwordSchema.parse(sanitized);
    }),
  role: staffRoleSchema,
  department: departmentStringSchema.optional().default(null),
});

export const instructorCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  department: departmentStringSchema.optional().default(null),
  role: z.literal("faculty"),
});

export const instructorUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  department: departmentStringSchema.optional().default(null),
  role: z.literal("faculty"),
});

export const studentRecordSchema = z.object({
  studentId: studentIdSchema,
});

export const ownProfileUpdateSchema = z.object({
  name: nameSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "New password and confirmation do not match",
      });
    }
  });

export const questionnaireCreateSchema = z.object({
  questionText: z
    .string()
    .transform((value) => sanitizeText(value, { preserveNewlines: true }))
    .pipe(z.string().min(10, "Question text is too short").max(500, "Question text is too long")),
  category: categorySchema,
  isActive: z.coerce.boolean().optional().default(true),
});

export const questionnaireUpdateSchema = questionnaireCreateSchema.extend({
  isActive: z.coerce.boolean(),
});

const scheduleDateSchema = z
  .string()
  .transform((value) => sanitizeText(value))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), "Invalid date")
  )
  .transform((value) => {
    return new Date(`${value}T00:00:00.000Z`);
  });

export const scheduleMutationSchema = z
  .object({
    academicYear: academicYearSchema,
    semester: semesterSchema,
    startDate: scheduleDateSchema,
    endDate: scheduleDateSchema,
    isOpen: z.coerce.boolean(),
    scheduleId: z.coerce.number().int().positive().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date",
        path: ["endDate"],
      });
    }
  });

export const scheduleDeleteQuerySchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Invalid schedule ID")
    .transform((value) => Number.parseInt(value, 10)),
});

export const resultsNotificationSchema = z.object({
  academicYear: academicYearSchema,
  semester: semesterSchema,
});

export const reportsQuerySchema = z.object({
  academicYear: academicYearSchema.optional(),
  semester: z.union([semesterSchema, z.undefined()]),
  role: z
    .string()
    .optional()
    .transform((value) => sanitizeText(value || "").toLowerCase())
    .refine(
      (value) =>
        value === "" ||
        value === "all" ||
        campusDirectorEvaluatedRoles.includes(value as typeof campusDirectorEvaluatedRoles[number]),
      "Invalid role filter"
    )
    .transform((value) => (value || "all") as CampusDirectorRoleFilter),
});

const positivePageQuerySchema = z
  .string()
  .regex(/^\d+$/, "Pagination value must be a positive number")
  .transform((value) => Number.parseInt(value, 10));

export const summaryCommentsQuerySchema = z.object({
  search: textSearchSchema.optional().default(""),
  commentSearch: textSearchSchema.optional().default(""),
  academicYear: academicYearSchema.optional(),
  semester: z.union([semesterSchema, z.undefined()]),
  instructorId: z
    .string()
    .regex(/^\d+$/, "Invalid instructor ID")
    .transform((value) => Number.parseInt(value, 10))
    .optional(),
  page: positivePageQuerySchema.optional().default(1),
  pageSize: positivePageQuerySchema.optional().default(10),
});

export const leadershipCommentsQuerySchema = z.object({
  search: textSearchSchema.optional().default(""),
  commentSearch: textSearchSchema.optional().default(""),
  academicYear: academicYearSchema.optional(),
  semester: z.string().optional().default("all"),
  page: positivePageQuerySchema.optional().default(1),
  pageSize: positivePageQuerySchema.optional().default(5),
  targetId: z
    .string()
    .regex(/^\d+$/, "Invalid target ID")
    .transform((value) => Number.parseInt(value, 10))
    .optional(),
});

export const yearQuerySchema = z.object({
  year: academicYearSchema.optional(),
});

export const campusDirectorTargetQuerySchema = z.object({
  role: z
    .string()
    .optional()
    .transform((value) => sanitizeText(value || "").toLowerCase())
    .refine(
      (value) =>
        value === "" ||
        value === "all" ||
        campusDirectorEvaluatedRoles.includes(value as typeof campusDirectorEvaluatedRoles[number]),
      "Invalid role filter"
    )
    .transform((value) => (value || "all") as CampusDirectorRoleFilter),
});
