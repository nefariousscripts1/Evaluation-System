import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { verifyPasswordResetToken } from "@/lib/password-reset";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json({ message: "Reset token is required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const payload = verifyPasswordResetToken(token);
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: payload.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 400 }
    );
  }
}
