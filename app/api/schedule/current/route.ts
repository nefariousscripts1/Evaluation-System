import {
  getActiveSchedule,
  getLatestOpenSchedule,
  getScheduleAvailabilityMessage,
  getScheduleAvailabilityStatus,
} from "@/lib/evaluation-session";
import { apiSuccess, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeSchedule = await getActiveSchedule();
    const schedule = activeSchedule ?? (await getLatestOpenSchedule());
    const status = getScheduleAvailabilityStatus(schedule);

    return apiSuccess({
      scheduleId: schedule?.id ?? null,
      academicYear: schedule?.academicYear ?? null,
      semester: schedule?.semester ?? null,
      startDate: schedule?.startDate ?? null,
      endDate: schedule?.endDate ?? null,
      isOpen: Boolean(schedule?.isOpen),
      isActive: status === "active",
      status,
      message: getScheduleAvailabilityMessage(status),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load the current schedule");
  }
}
