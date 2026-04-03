import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const academicYear = searchParams.get("academicYear");
  const role = searchParams.get("role");
  const department = searchParams.get("department");

  const where: any = {};
  if (academicYear) where.academicYear = academicYear;
  if (role) where.user = { role };
  if (department) where.user = { department: { contains: department } };

  const results = await prisma.result.findMany({
    where,
    include: { user: true },
    orderBy: { averageRating: "desc" },
  });

  const years = await prisma.result.findMany({
    distinct: ["academicYear"],
    select: { academicYear: true },
    orderBy: { academicYear: "desc" },
  });

  return NextResponse.json({
    results,
    years: years.map((y) => y.academicYear),
  });
}