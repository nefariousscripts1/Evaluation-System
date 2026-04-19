import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendFacultyResultsAvailableAnnouncement } from "@/lib/mailer";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "secretary") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { academicYear, semester } = await req.json();
  const normalizedAcademicYear = String(academicYear ?? "").trim();
  const normalizedSemester = String(semester ?? "").trim();

  if (!normalizedAcademicYear || !normalizedSemester) {
    return NextResponse.json(
      { error: "Academic year and semester are required" },
      { status: 400 }
    );
  }

  const staffRecipients = await prisma.user.findMany({
    where: {
      role: { not: "secretary" },
      deletedAt: null,
      email: { not: "" },
    },
    select: {
      email: true,
      role: true,
    },
  });

  const recipients = Array.from(
    new Set(staffRecipients.map((user) => user.email.trim()).filter(Boolean))
  );

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No staff members are available to notify for this session yet." },
      { status: 400 }
    );
  }

  try {
    const announcement = await sendFacultyResultsAvailableAnnouncement({
      recipients,
      academicYear: normalizedAcademicYear,
      semester: normalizedSemester,
    });

    return NextResponse.json({
      message: "Staff results notification sent",
      announcement,
    });
  } catch (error) {
    console.error("Results notification failed:", error);
    return NextResponse.json(
      { error: "Failed to send faculty results notification" },
      { status: 500 }
    );
  }
}
