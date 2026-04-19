import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buildPasswordResetUrl, createPasswordResetToken } from "@/lib/password-reset";
import { getEmailDeliveryProvider, sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const isDevelopment = process.env.NODE_ENV !== "production";
    const deliveryProvider = getEmailDeliveryProvider();

    if (typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { email: true, deletedAt: true },
    });

    if (user && !user.deletedAt) {
      const token = createPasswordResetToken(user.email);
      const resetUrl = buildPasswordResetUrl(token);
      const deliveryResult = await sendPasswordResetEmail({ email: user.email, resetUrl });

      return NextResponse.json({
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

    return NextResponse.json({
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
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Failed to process reset request" }, { status: 500 });
  }
}
