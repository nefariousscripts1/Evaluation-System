import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { verifyPasswordResetToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { token, password } = await parseJsonBody(req, resetPasswordSchema);
    const payload = verifyPasswordResetToken(token);
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: payload.email },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    return apiSuccess({ message: "Password reset successfully" });
  } catch (error) {
    return handleApiError(error, "Failed to reset password");
  }
}
