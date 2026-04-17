import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  EvaluationSubmissionError,
  submitEvaluationRecord,
} from "@/lib/evaluation-submission";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const evaluatorRole = session.user.role ?? "";

  if (getAllowedEvaluatedRoles(evaluatorRole).length === 0) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const evaluatorId = Number.parseInt(session.user.id ?? "", 10);

    if (!Number.isInteger(evaluatorId)) {
      return NextResponse.json({ message: "Invalid session user ID" }, { status: 401 });
    }

    const payload = await req.json();
    const evaluation = await submitEvaluationRecord({
      evaluatorId,
      evaluatorRole,
      evaluatedId: payload?.evaluatedId,
      scheduleId: payload?.scheduleId,
      academicYear: payload?.academicYear,
      answers: payload?.answers,
      comment: payload?.comment,
    });

    return NextResponse.json({ success: true, evaluation }, { status: 201 });
  } catch (error) {
    console.error("Error submitting role evaluation:", error);

    if (error instanceof EvaluationSubmissionError) {
      return NextResponse.json(
        {
          message: error.message,
          ...(process.env.NODE_ENV !== "production" && error.details
            ? { details: error.details }
            : {}),
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to submit evaluation",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}
