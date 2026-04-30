import prisma from "@/lib/db";
import { getAllowedEvaluatedRoles } from "@/lib/role-evaluation";
import {
  getActiveSchedule,
  getScheduleAvailabilityMessage,
  getScheduleAvailabilityStatus,
  isScheduleActive,
  isValidSemester,
} from "@/lib/evaluation-session";

type SubmissionAnswerInput = {
  questionId: unknown;
  rating: unknown;
};

type SubmissionInput = {
  evaluatorId: number;
  evaluatorRole: unknown;
  evaluatedId: unknown;
  scheduleId?: unknown;
  academicYear: unknown;
  semester?: unknown;
  answers: unknown;
  comment?: unknown;
};

type NormalizedAnswer = {
  questionId: number;
  rating: number;
};

type NormalizedSubmission = {
  evaluatorId: number;
  evaluatorRole: string;
  evaluatedId: number;
  scheduleId: number;
  academicYear: string;
  semester: string;
  answers: NormalizedAnswer[];
  comment: string | null;
};

type NormalizedSubmissionContext = Omit<NormalizedSubmission, "answers" | "comment">;
type SubmissionContextInput = Omit<SubmissionInput, "answers" | "comment">;

export class EvaluationSubmissionError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status = 400, details?: string) {
    super(message);
    this.name = "EvaluationSubmissionError";
    this.status = status;
    this.details = details;
  }
}

function parsePositiveInt(value: unknown, fieldName: string) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.NaN;

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new EvaluationSubmissionError(`Invalid ${fieldName}`, 400);
  }

  return numericValue;
}

function normalizeComment(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new EvaluationSubmissionError("Invalid optional comment", 400);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAnswers(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new EvaluationSubmissionError("Please answer all questions", 400);
  }

  return value.map((answer, index) => {
    if (!answer || typeof answer !== "object") {
      throw new EvaluationSubmissionError(
        "Invalid answer payload",
        400,
        `Answer at position ${index + 1} is not an object`
      );
    }

    const { questionId, rating } = answer as SubmissionAnswerInput;
    const normalizedRating =
      typeof rating === "number"
        ? rating
        : typeof rating === "string"
        ? Number.parseInt(rating, 10)
        : Number.NaN;

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      throw new EvaluationSubmissionError(
        "Ratings must be whole numbers from 1 to 5",
        400,
        `Invalid rating for question ${String(questionId)}`
      );
    }

    return {
      questionId: parsePositiveInt(questionId, "question ID"),
      rating: normalizedRating,
    };
  });
}

async function assertQuestionSetIsValid(answers: NormalizedAnswer[]) {
  const activeQuestions = await prisma.questionnaire.findMany({
    where: { isActive: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (activeQuestions.length === 0) {
    throw new EvaluationSubmissionError("No active questionnaire items are available", 400);
  }

  const allowedQuestionIds = new Set(activeQuestions.map((question) => question.id));
  const submittedQuestionIds = new Set<number>();

  for (const answer of answers) {
    if (!allowedQuestionIds.has(answer.questionId)) {
      throw new EvaluationSubmissionError(
        "One or more questionnaire items are no longer available",
        400,
        `Unexpected question ID ${answer.questionId}`
      );
    }

    if (submittedQuestionIds.has(answer.questionId)) {
      throw new EvaluationSubmissionError(
        "Duplicate answers were submitted",
        400,
        `Question ${answer.questionId} was provided more than once`
      );
    }

    submittedQuestionIds.add(answer.questionId);
  }

  const missingQuestionIds = activeQuestions
    .map((question) => question.id)
    .filter((questionId) => !submittedQuestionIds.has(questionId));

  if (missingQuestionIds.length > 0) {
    throw new EvaluationSubmissionError(
      "Please answer all required questions",
      400,
      `Missing question IDs: ${missingQuestionIds.join(", ")}`
    );
  }
}

async function resolveScheduleForSubmission(input: SubmissionContextInput) {
  const normalizedScheduleId =
    input.scheduleId === undefined || input.scheduleId === null || input.scheduleId === ""
      ? null
      : parsePositiveInt(input.scheduleId, "schedule");

  const normalizedAcademicYear =
    typeof input.academicYear === "string" && input.academicYear.trim().length > 0
      ? input.academicYear.trim()
      : null;
  const normalizedSemester =
    typeof input.semester === "string" && isValidSemester(input.semester.trim())
      ? input.semester.trim()
      : null;

  if ((normalizedAcademicYear && !normalizedSemester) || (!normalizedAcademicYear && normalizedSemester)) {
    throw new EvaluationSubmissionError(
      !normalizedAcademicYear ? "Please select an academic year." : "Please select a semester.",
      400
    );
  }

  const schedule = normalizedScheduleId
    ? await prisma.schedule.findUnique({
        where: { id: normalizedScheduleId },
        select: {
          id: true,
          academicYear: true,
          semester: true,
          startDate: true,
          endDate: true,
          isOpen: true,
        },
      })
    : normalizedAcademicYear && normalizedSemester
    ? await prisma.schedule.findFirst({
        where: {
          academicYear: normalizedAcademicYear,
          semester: normalizedSemester,
        },
        orderBy: [{ isOpen: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          academicYear: true,
          semester: true,
          startDate: true,
          endDate: true,
          isOpen: true,
        },
      })
    : await getActiveSchedule();

  if (!schedule) {
    throw new EvaluationSubmissionError(
      normalizedAcademicYear && normalizedSemester
        ? "No evaluation schedule is available for the selected academic year and semester."
        : "No active evaluation schedule is available right now.",
      400
    );
  }

  if (
    normalizedAcademicYear &&
    normalizedSemester &&
    (schedule.academicYear !== normalizedAcademicYear || schedule.semester !== normalizedSemester)
  ) {
    throw new EvaluationSubmissionError(
      "The selected academic year and semester do not match the evaluation schedule.",
      400
    );
  }

  const scheduleStatus = getScheduleAvailabilityStatus(schedule);
  if (scheduleStatus !== "active" || !isScheduleActive(schedule)) {
    throw new EvaluationSubmissionError(getScheduleAvailabilityMessage(scheduleStatus), 400);
  }

  return schedule;
}

async function normalizeSubmissionContext(
  input: SubmissionContextInput
): Promise<NormalizedSubmissionContext> {
  if (!Number.isInteger(input.evaluatorId) || input.evaluatorId <= 0) {
    throw new EvaluationSubmissionError("Invalid evaluator session", 401);
  }

  if (typeof input.evaluatorRole !== "string" || input.evaluatorRole.trim().length === 0) {
    throw new EvaluationSubmissionError("Invalid evaluator role", 401);
  }

  const schedule = await resolveScheduleForSubmission(input);

  const normalized = {
    evaluatorId: input.evaluatorId,
    evaluatorRole: input.evaluatorRole.trim(),
    evaluatedId: parsePositiveInt(input.evaluatedId, "evaluated instructor"),
    scheduleId: schedule.id,
    academicYear: schedule.academicYear,
    semester: schedule.semester,
  };

  if (normalized.evaluatorId === normalized.evaluatedId) {
    throw new EvaluationSubmissionError("You cannot evaluate yourself", 400);
  }

  return normalized;
}

async function assertNoDuplicateEvaluation(submission: NormalizedSubmissionContext) {
  const existingEvaluation = await prisma.evaluation.findFirst({
    where: {
      evaluatorId: submission.evaluatorId,
      evaluatedId: submission.evaluatedId,
      academicYear: submission.academicYear,
      semester: submission.semester,
    },
    select: { id: true },
  });

  if (existingEvaluation) {
    throw new EvaluationSubmissionError(
      "You have already evaluated this person for the selected academic year and semester.",
      409
    );
  }
}

function assertEvaluatorCanReviewRole(evaluatorRole: string, evaluatedRole: string) {
  const allowedRoles = getAllowedEvaluatedRoles(evaluatorRole);

  if (!allowedRoles.includes(evaluatedRole as never)) {
    throw new EvaluationSubmissionError(
      "You are not allowed to evaluate the selected user",
      403
    );
  }
}

export async function submitEvaluationRecord(input: SubmissionInput) {
  const context = await normalizeSubmissionContext(input);
  const submission: NormalizedSubmission = {
    ...context,
    answers: normalizeAnswers(input.answers),
    comment: normalizeComment(input.comment),
  };

  const evaluatedUser = await prisma.user.findFirst({
    where: {
      id: context.evaluatedId,
      deletedAt: null,
    },
    select: { id: true, role: true },
  });

  if (!evaluatedUser) {
    throw new EvaluationSubmissionError("Selected instructor could not be found", 404);
  }

  assertEvaluatorCanReviewRole(context.evaluatorRole, evaluatedUser.role);
  await assertNoDuplicateEvaluation(context);
  await assertQuestionSetIsValid(submission.answers);

  const evaluation = await prisma.$transaction(async (tx) => {
    const createdEvaluation = await tx.evaluation.create({
      data: {
        evaluatorId: submission.evaluatorId,
        evaluatedId: submission.evaluatedId,
        scheduleId: submission.scheduleId,
        academicYear: submission.academicYear,
        semester: submission.semester,
        generalComment: submission.comment,
        answers: {
          create: submission.answers.map((answer) => ({
            questionId: answer.questionId,
            rating: answer.rating,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    const averageRatingResult = await tx.evaluationAnswer.aggregate({
      where: {
        evaluation: {
          evaluatedId: submission.evaluatedId,
          academicYear: submission.academicYear,
        },
      },
      _avg: { rating: true },
    });

    const averageRating = averageRatingResult._avg.rating ?? 0;

    await tx.result.upsert({
      where: {
        userId_academicYear: {
          userId: submission.evaluatedId,
          academicYear: submission.academicYear,
        },
      },
      update: {
        averageRating,
      },
      create: {
        userId: submission.evaluatedId,
        academicYear: submission.academicYear,
        averageRating,
      },
    });

    return createdEvaluation;
  });

  return evaluation;
}

export async function assertEvaluationCanBeStarted(
  input: SubmissionContextInput
) {
  const submission = await normalizeSubmissionContext(input);
  const evaluatedUser = await prisma.user.findFirst({
    where: {
      id: submission.evaluatedId,
      deletedAt: null,
    },
    select: { id: true, role: true },
  });

  if (!evaluatedUser) {
    throw new EvaluationSubmissionError("Selected instructor could not be found", 404);
  }

  assertEvaluatorCanReviewRole(submission.evaluatorRole, evaluatedUser.role);
  await assertNoDuplicateEvaluation(submission);

  return {
    scheduleId: submission.scheduleId,
    academicYear: submission.academicYear,
    semester: submission.semester,
  };
}
