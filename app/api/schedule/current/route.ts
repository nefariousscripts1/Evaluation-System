import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const schedule = await prisma.schedule.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    academicYear: schedule?.academicYear || "2024-2025",
    isOpen: schedule?.isOpen || false,
  });
}