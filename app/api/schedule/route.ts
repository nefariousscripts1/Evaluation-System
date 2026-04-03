import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedule = await prisma.schedule.findFirst({
    orderBy: { createdAt: "desc" },
  });
  
  return NextResponse.json(schedule);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { academicYear, startDate, endDate, isOpen } = await req.json();
  
  const schedule = await prisma.schedule.upsert({
    where: { academicYear },
    update: { startDate, endDate, isOpen },
    create: { academicYear, startDate, endDate, isOpen },
  });
  
  return NextResponse.json(schedule);
}