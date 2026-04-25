import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { sendFacultyResultsAvailableAnnouncement } from "@/lib/mailer";
import { requireApiSession } from "@/lib/server-auth";
import { resultsNotificationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await requireApiSession(["secretary"]);
    const { academicYear, semester } = await parseJsonBody(req, resultsNotificationSchema);

    const staffRecipients = await prisma.user.findMany({
      where: {
        role: { not: "secretary" },
        deletedAt: null,
        email: { not: "" },
      },
      select: {
        email: true,
      },
    });

    const recipients = Array.from(
      new Set(staffRecipients.map((user) => user.email.trim()).filter(Boolean))
    );

    if (recipients.length === 0) {
      return apiError("No staff members are available to notify for this session yet.", 400);
    }

    const announcement = await sendFacultyResultsAvailableAnnouncement({
      recipients,
      academicYear,
      semester,
    });

    return apiSuccess({
      message: "Staff results notification sent",
      announcement,
    });
  } catch (error) {
    return handleApiError(error, "Failed to send faculty results notification");
  }
}
