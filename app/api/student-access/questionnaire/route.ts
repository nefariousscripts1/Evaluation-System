import prisma from "@/lib/db";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { getValidatedStudentAccess } from "@/lib/student-access";

export async function GET() {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return apiError("Unauthorized", 401);
    }

    const questions = await prisma.questionnaire.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { id: "asc" }],
    });

    return apiSuccess(questions, { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to load questionnaire");
  }
}
