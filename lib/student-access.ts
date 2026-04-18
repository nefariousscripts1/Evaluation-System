import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { isScheduleActive } from "@/lib/evaluation-session";

const COOKIE_NAME = "student_access_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

type StudentAccessPayload = {
  studentUserId: number;
  studentId: string;
  scheduleId: number;
  instructorId: number | null;
  expiresAt: number;
};

function getSecret() {
  return process.env.NEXTAUTH_SECRET || "digital-evaluation-system-student-access";
}

function signValue(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encodePayload(payload: StudentAccessPayload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signValue(encoded);
  return `${encoded}.${signature}`;
}

function decodePayload(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = signValue(encoded);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Number.isInteger(parsed.studentUserId) ||
      typeof parsed.studentId !== "string" ||
      !Number.isInteger(parsed.scheduleId) ||
      (parsed.instructorId !== null && !Number.isInteger(parsed.instructorId)) ||
      !Number.isInteger(parsed.expiresAt)
    ) {
      return null;
    }

    return parsed as StudentAccessPayload;
  } catch {
    return null;
  }
}

export async function setStudentAccessCookie(payload: Omit<StudentAccessPayload, "expiresAt">) {
  const expiresAt = Date.now() + COOKIE_MAX_AGE_SECONDS * 1000;
  const token = encodePayload({
    ...payload,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearStudentAccessCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getStudentAccessPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = decodePayload(token);

  if (!payload || payload.expiresAt <= Date.now()) {
    await clearStudentAccessCookie();
    return null;
  }

  return payload;
}

export async function getValidatedStudentAccess() {
  const payload = await getStudentAccessPayload();

  if (!payload) {
    return null;
  }

  const [student, schedule, instructorAccess] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.studentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        deletedAt: true,
      },
    }),
    prisma.schedule.findUnique({
      where: { id: payload.scheduleId },
      select: {
        id: true,
        academicYear: true,
        startDate: true,
        endDate: true,
        isOpen: true,
        accessCode: true,
        semester: true,
      },
    }),
    prisma.instructorAccessCode.findFirst({
      where: payload.instructorId
        ? {
            scheduleId: payload.scheduleId,
            instructorId: payload.instructorId,
          }
        : { id: -1 },
      select: {
        id: true,
        code: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            deletedAt: true,
          },
        },
      },
    }),
  ]);

  if (
    !student ||
    student.deletedAt ||
    student.role !== "student" ||
    student.studentId !== payload.studentId ||
    !schedule ||
    !isScheduleActive(schedule)
  ) {
    await clearStudentAccessCookie();
    return null;
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      studentId: student.studentId ?? payload.studentId,
    },
    schedule,
    target:
      instructorAccess && !instructorAccess.instructor.deletedAt && instructorAccess.instructor.role === "faculty"
        ? {
            id: instructorAccess.instructor.id,
            name: instructorAccess.instructor.name,
            email: instructorAccess.instructor.email,
            role: instructorAccess.instructor.role,
            department: instructorAccess.instructor.department,
            code: instructorAccess.code,
          }
        : null,
  };
}
