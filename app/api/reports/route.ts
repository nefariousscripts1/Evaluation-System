import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== "secretary" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear");

    // Build where clause
    const where: any = {};
    if (academicYear) {
      where.academicYear = academicYear;
    }

    // Get all results for faculty members only
    const results = await prisma.result.findMany({
      where: {
        ...where,
        user: {
          role: {
            in: ["faculty", "chairperson", "dean", "director", "campus_director"]
          },
          deletedAt: null
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: {
        averageRating: "desc",
      },
    });

    // Get unique academic years from all results
    const yearsData = await prisma.result.findMany({
      distinct: ["academicYear"],
      select: { academicYear: true },
      orderBy: { academicYear: "desc" },
    });

    const years = yearsData.map((y) => y.academicYear);

    return NextResponse.json({
      results,
      years,
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports", results: [], years: [] },
      { status: 500 }
    );
  }
}
