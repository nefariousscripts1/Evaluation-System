export const SEMESTER_OPTIONS = ["1st Semester", "2nd Semester"] as const;

type ScheduleLike = {
  isOpen: boolean;
  startDate: Date;
  endDate: Date;
};

export type ScheduleAvailabilityStatus =
  | "missing"
  | "closed"
  | "not_started"
  | "active"
  | "ended";

export function isScheduleActive(schedule: ScheduleLike, now = new Date()) {
  return schedule.isOpen && now >= schedule.startDate && now <= schedule.endDate;
}

export function getScheduleAvailabilityStatus(
  schedule: ScheduleLike | null | undefined,
  now = new Date()
): ScheduleAvailabilityStatus {
  if (!schedule) {
    return "missing";
  }

  if (!schedule.isOpen) {
    return "closed";
  }

  if (now < schedule.startDate) {
    return "not_started";
  }

  if (now > schedule.endDate) {
    return "ended";
  }

  return "active";
}

export function getScheduleAvailabilityMessage(status: ScheduleAvailabilityStatus) {
  switch (status) {
    case "not_started":
      return "The evaluation period has not started yet.";
    case "ended":
      return "The evaluation period has ended. You can no longer submit an evaluation.";
    case "closed":
      return "The evaluation period is currently closed.";
    case "missing":
      return "No evaluation schedule is available right now.";
    default:
      return "";
  }
}

export function isValidSemester(value: string): value is (typeof SEMESTER_OPTIONS)[number] {
  return SEMESTER_OPTIONS.includes(value as (typeof SEMESTER_OPTIONS)[number]);
}
