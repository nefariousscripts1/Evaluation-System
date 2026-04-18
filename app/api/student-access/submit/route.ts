import { NextResponse } from "next/server";
import {
  EvaluationSubmissionError,
  submitEvaluationRecord,
} from "@/lib/evaluation-submission";
import { getValidatedStudentAccess } from "@/lib/student-access";

export async function POST(req: Request) {
  try {
    const access = await getValidatedStudentAccess();

    if (!access) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!access.target) {
      return NextResponse.json({ message: "Instructor code validation is required" }, { status: 400 });
    }

    const payload = await req.json();
    const evaluation = await submitEvaluationRecord({
      evaluatorId: access.student.id,
      evaluatorRole: "student",
      evaluatedId: access.target.id,
      scheduleId: access.schedule.id,
      academicYear: access.schedule.academicYear,
      answers: payload?.answers,
      comment: payload?.comment,
    });

    return NextResponse.json({ success: true, evaluation }, { status: 201 });
  } catch (error) {
    console.error("Student access submit error:", error);

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

    return NextResponse.json({ message: "Failed to submit evaluation" }, { status: 500 });
  }
}
