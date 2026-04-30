import { randomInt } from "crypto";
import prisma from "@/lib/db";
import {
  getScheduleAvailabilityMessage,
  getScheduleAvailabilityStatus,
  isScheduleActive,
  isValidSemester,
  SEMESTER_OPTIONS,
  type ScheduleAvailabilityStatus,
} from "@/lib/schedule-config";

const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function getAcademicYearForDate(date: Date) {
  const year = date.getFullYear();
  return `${year}-${year + 1}`;
}

export function buildAcademicYearOptions(baseYear = new Date().getFullYear(), count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const year = baseYear - 1 + index;
    return `${year}-${year + 1}`;
  });
}

export function generateAccessCode(length = 6) {
  return Array.from({ length }, () =>
    ACCESS_CODE_ALPHABET[randomInt(0, ACCESS_CODE_ALPHABET.length)]
  ).join("");
}

export async function getActiveSchedule() {
  const schedules = await prisma.schedule.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return schedules.find((schedule) => isScheduleActive(schedule)) ?? null;
}

export async function getLatestOpenSchedule() {
  return prisma.schedule.findFirst({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getScheduleByAccessCode(accessCode: string) {
  const schedule = await prisma.schedule.findFirst({
    where: {
      accessCode: accessCode.trim().toUpperCase(),
      isOpen: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!schedule || !isScheduleActive(schedule)) {
    return null;
  }

  return schedule;
}

export async function closeAllActiveSchedules() {
  await prisma.schedule.updateMany({
    where: { isOpen: true },
    data: { isOpen: false },
  });
}

export {
  SEMESTER_OPTIONS,
  getScheduleAvailabilityMessage,
  getScheduleAvailabilityStatus,
  isScheduleActive,
  isValidSemester,
};
export type { ScheduleAvailabilityStatus };
