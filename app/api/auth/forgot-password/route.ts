import prisma from "@/lib/db";
import { apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { buildPasswordResetUrl, createPasswordResetToken } from "@/lib/password-reset";
import { getEmailDeliveryProvider, sendPasswordResetEmail } from "@/lib/mailer";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { email } = await parseJsonBody(req, forgotPasswordSchema);
    const isDevelopment = process.env.NODE_ENV !== "production";
    const deliveryProvider = getEmailDeliveryProvider();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, deletedAt: true },
    });

    if (user && !user.deletedAt) {
      const token = createPasswordResetToken(user.email);
      const resetUrl = buildPasswordResetUrl(token);
      const deliveryResult = await sendPasswordResetEmail({ email: user.email, resetUrl });

      return apiSuccess({
        message: deliveryResult.delivered
          ? "If an account exists for that email, a reset link has been sent."
          : isDevelopment
          ? "Email delivery is not configured in this environment. Use the dev reset link below."
          : "Password reset email is not configured yet. Please contact the administrator.",
        delivered: deliveryResult.delivered,
        deliveryConfigured: deliveryResult.provider !== "console",
        provider: deliveryResult.provider,
        ...(!deliveryResult.delivered && isDevelopment ? { resetUrl } : {}),
      });
    }

    return apiSuccess({
      message: deliveryProvider
        ? "If an account exists for that email, a reset link has been sent."
        : isDevelopment
        ? "Email delivery is not configured in this environment."
        : "Password reset email is not configured yet. Please contact the administrator.",
      delivered: false,
      deliveryConfigured: Boolean(deliveryProvider),
      provider: deliveryProvider ?? "console",
    });
  } catch (error) {
    return handleApiError(error, "Failed to process reset request");
  }
}
