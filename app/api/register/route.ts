import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { studentRegistrationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const { email, password, name, role, studentId } = await parseJsonBody(
      req,
      studentRegistrationSchema
    );

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { studentId }],
      },
      select: { id: true },
    });

    if (existing) {
      return handleApiError(
        new Error("Email or student ID already exists"),
        "Email or student ID already exists"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        studentId,
      },
    });

    return apiSuccess({ message: "User created successfully" }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Internal server error");
  }
}
