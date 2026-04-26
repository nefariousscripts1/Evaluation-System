import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { sendFacultyResultsAvailableAnnouncement } from "@/lib/mailer";
import { requireApiSession } from "@/lib/server-auth";
import { resultsNotificationSchema } from "@/lib/validation";

const resultRecipientRoles = [
  "faculty",
  "chairperson",
  "dean",
  "director",
] as const;

export async function POST(req: Request) {
  try {
    await requireApiSession(["secretary"]);
    const { academicYear, semester } = await parseJsonBody(req, resultsNotificationSchema);

    const schedule = await prisma.schedule.findFirst({
      where: {
        academicYear,
        semester,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
      },
    });

    if (!schedule) {
      return apiError("Schedule not found for this Academic Year and Semester.", 404);
    }

    const resultRecipients = await prisma.result.findMany({
      where: {
        academicYear,
        user: {
          role: { in: [...resultRecipientRoles] },
          deletedAt: null,
          email: { not: "" },
        },
      },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    const recipients = Array.from(
      new Set(resultRecipients.map((result) => result.user.email.trim()).filter(Boolean))
    );

    if (recipients.length === 0) {
      return apiError("No evaluation results are available to notify for this session yet.", 400);
    }

    await prisma.schedule.update({
      where: { id: schedule.id },
      data: { resultsReleased: true },
    });

    let announcement:
      | {
          delivered: boolean;
          provider: string;
          recipientCount: number;
        }
      | undefined;

    try {
      announcement = await sendFacultyResultsAvailableAnnouncement({
        recipients,
        academicYear,
        semester,
      });
    } catch (error) {
      console.error("Staff results notification failed:", error);
      announcement = {
        delivered: false,
        provider: "failed",
        recipientCount: recipients.length,
      };
    }

    return apiSuccess({
      message: announcement.delivered
        ? "Staff results released and notification sent"
        : "Staff results were released, but email delivery is not configured or failed",
      announcement,
    });
  } catch (error) {
    return handleApiError(error, "Failed to send faculty results notification");
  }
}
