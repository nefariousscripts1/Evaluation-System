import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { getActiveSchedule } from "@/lib/evaluation-session";
import { ensureInstructorAccessCodesForSchedule } from "@/lib/instructor-access";
import { requireApiSession } from "@/lib/server-auth";
import { instructorCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireApiSession(["secretary"]);

    const activeSchedule = await getActiveSchedule();

    if (activeSchedule) {
      await ensureInstructorAccessCodesForSchedule(activeSchedule.id);
    }

    const instructors = await prisma.user.findMany({
      where: { role: "faculty", deletedAt: null },
      select: { id: true, name: true, email: true, role: true, department: true },
      orderBy: { name: "asc" },
    });

    const activeCodes = activeSchedule
      ? await prisma.instructorAccessCode.findMany({
          where: {
            scheduleId: activeSchedule.id,
            instructorId: { in: instructors.map((item) => item.id) },
          },
          select: { instructorId: true, code: true },
        })
      : [];

    const activeCodeMap = new Map(activeCodes.map((item) => [item.instructorId, item.code]));

    return apiSuccess({
      activeSchedule: activeSchedule
        ? {
            id: activeSchedule.id,
            academicYear: activeSchedule.academicYear,
            semester: activeSchedule.semester,
          }
        : null,
      instructors: instructors.map((instructor) => ({
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role,
        department: instructor.department,
        activeInstructorCode: activeCodeMap.get(instructor.id) ?? null,
      })),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    ) {
      return apiError(
        "Database connection failed. Check DATABASE_URL and run Prisma migrations.",
        500
      );
    }

    return handleApiError(error, "Failed to load instructors");
  }
}

export async function POST(req: Request) {
  try {
    await requireApiSession(["secretary"]);
    const payload = await parseJsonBody(req, instructorCreateSchema);
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const instructor = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        mustChangePassword: true,
        department: payload.department,
        role: payload.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
      },
    });

    const activeSchedule = await getActiveSchedule();
    if (activeSchedule) {
      await ensureInstructorAccessCodesForSchedule(activeSchedule.id, [instructor.id]);
    }

    return apiSuccess({ instructor }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("An instructor with this email address already exists", 400);
    }

    return handleApiError(error, "Failed to create instructor");
  }
}
