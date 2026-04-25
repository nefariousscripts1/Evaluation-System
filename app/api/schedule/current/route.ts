import { getActiveSchedule } from "@/lib/evaluation-session";
import { apiSuccess, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const schedule = await getActiveSchedule();

    return apiSuccess({
      scheduleId: schedule?.id ?? null,
      academicYear: schedule?.academicYear ?? null,
      semester: schedule?.semester ?? null,
      startDate: schedule?.startDate ?? null,
      endDate: schedule?.endDate ?? null,
      isOpen: Boolean(schedule),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load the current schedule");
  }
}
