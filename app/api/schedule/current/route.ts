import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const schedule = await prisma.schedule.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    academicYear: schedule?.academicYear ?? null,
    isOpen: schedule?.isOpen ?? false,
  });
}
