import prisma from "@/lib/db";
import { apiSuccess, handleApiError, parseJsonBody } from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import { questionnaireCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireApiSession();

    const questions = await prisma.questionnaire.findMany({
      orderBy: [{ category: "asc" }, { id: "asc" }],
    });

    return apiSuccess(questions, { preserveRoot: false });
  } catch (error) {
    return handleApiError(error, "Failed to load questionnaire");
  }
}

export async function POST(req: Request) {
  try {
    await requireApiSession(["secretary"]);
    const payload = await parseJsonBody(req, questionnaireCreateSchema);
    const question = await prisma.questionnaire.create({
      data: payload,
    });

    return apiSuccess({ question }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create questionnaire");
  }
}
