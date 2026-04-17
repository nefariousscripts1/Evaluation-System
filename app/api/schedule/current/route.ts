import { NextResponse } from "next/server";
import { getActiveSchedule } from "@/lib/evaluation-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const schedule = await getActiveSchedule();

  return NextResponse.json({
    scheduleId: schedule?.id ?? null,
    academicYear: schedule?.academicYear ?? null,
    startDate: schedule?.startDate ?? null,
    endDate: schedule?.endDate ?? null,
    isOpen: Boolean(schedule),
  });
}
