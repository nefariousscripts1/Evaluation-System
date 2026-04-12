import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buildPasswordResetUrl, createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

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
      await sendPasswordResetEmail({ email: user.email, resetUrl });

      return NextResponse.json({
        message: "If an account exists for that email, a reset link has been sent.",
        ...(process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
          ? { resetUrl }
          : {}),
      });
    }

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Failed to process reset request" }, { status: 500 });
  }
}
