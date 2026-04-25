import prisma from "@/lib/db";
import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
  parseRouteParams,
} from "@/lib/api";
import { requireApiSession } from "@/lib/server-auth";
import {
  idRouteParamSchema,
  questionnaireUpdateSchema,
} from "@/lib/validation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const question = await prisma.questionnaire.findUnique({
      where: { id },
    });

    if (!question) {
      return apiError("Questionnaire not found", 404);
    }

    return apiSuccess({ question });
  } catch (error) {
    return handleApiError(error, "Failed to fetch questionnaire");
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    const payload = await parseJsonBody(req, questionnaireUpdateSchema);

    const question = await prisma.questionnaire.update({
      where: { id },
      data: payload,
    });

    return apiSuccess({ question });
  } catch (error) {
    return handleApiError(error, "Failed to update questionnaire");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiSession(["secretary"]);
    const { id } = parseRouteParams(await params, idRouteParamSchema);
    await prisma.questionnaire.delete({
      where: { id },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete questionnaire");
  }
}
