import prisma from "@/lib/db";
import { generateAccessCode } from "@/lib/evaluation-session";

async function generateUniqueInstructorCode(scheduleId: number) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = generateAccessCode(8);
    const existing = await prisma.instructorAccessCode.findFirst({
      where: {
        scheduleId,
        code: candidate,
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique instructor code");
}

export async function ensureInstructorAccessCodesForSchedule(
  scheduleId: number,
  instructorIds?: number[]
) {
  const normalizedInstructorIds =
    instructorIds?.filter((id, index, ids) => Number.isInteger(id) && id > 0 && ids.indexOf(id) === index) ??
    [];

  const instructors = await prisma.user.findMany({
    where: {
      role: "faculty",
      deletedAt: null,
      ...(normalizedInstructorIds.length > 0 ? { id: { in: normalizedInstructorIds } } : {}),
    },
    select: {
      id: true,
    },
    orderBy: { id: "asc" },
  });

  if (instructors.length === 0) {
    return [];
  }

  const existingCodes = await prisma.instructorAccessCode.findMany({
    where: {
      scheduleId,
      instructorId: { in: instructors.map((instructor) => instructor.id) },
    },
    select: {
      id: true,
      instructorId: true,
      code: true,
    },
  });

  const existingInstructorIds = new Set(existingCodes.map((record) => record.instructorId));
  const createdCodes = [];

  for (const instructor of instructors) {
    if (existingInstructorIds.has(instructor.id)) {
      continue;
    }

    const code = await generateUniqueInstructorCode(scheduleId);
    const created = await prisma.instructorAccessCode.create({
      data: {
        scheduleId,
        instructorId: instructor.id,
        code,
      },
      select: {
        id: true,
        instructorId: true,
        code: true,
      },
    });

    createdCodes.push(created);
  }

  return [...existingCodes, ...createdCodes];
}

export async function findInstructorAccessByCode(scheduleId: number, code: string) {
  return prisma.instructorAccessCode.findFirst({
    where: {
      scheduleId,
      code: code.trim().toUpperCase(),
      instructor: {
        role: "faculty",
        deletedAt: null,
      },
    },
    select: {
      id: true,
      instructorId: true,
      code: true,
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          role: true,
        },
      },
    },
  });
}
