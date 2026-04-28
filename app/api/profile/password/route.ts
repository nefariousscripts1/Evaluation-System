import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { requireApiUserId } from "@/lib/server-auth";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { userId } = await requireApiUserId();
    const payload = await parseJsonBody(request, changePasswordSchema);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(payload.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return apiError("Current password is incorrect", 400);
    }

    const isSamePassword = await bcrypt.compare(payload.newPassword, user.password);

    if (isSamePassword) {
      return apiError("New password must be different from your current password", 400);
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return apiSuccess({
      message: "Password updated successfully",
      mustChangePassword: false,
    });
  } catch (error) {
    return handleApiError(error, "Failed to update password");
  }
}
