"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Star, UserRound } from "lucide-react";
import PortalPageLoader from "@/components/ui/PortalPageLoader";

type EvaluationTarget = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
};

type Question = {
  id: number;
  questionText: string;
  isActive?: boolean;
};

type StudentSession = {
  student: {
    id: number;
    name: string | null;
    email: string;
    studentId: string;
  };
  schedule: {
    id: number;
    academicYear: string;
    startDate: string;
    endDate: string;
  };
  submittedTargetIds: number[];
};

export default function StudentAccessPortal() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [targets, setTargets] = useState<EvaluationTarget[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, { rating: number }>>({});
  const [finalComment, setFinalComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPortal = async () => {
      try {
        const sessionRes = await fetch("/api/student-access/session", { cache: "no-store" });

        if (sessionRes.status === 401) {
          router.push("/login?mode=student");
          return;
        }

        const sessionData = await sessionRes.json();

        if (!sessionRes.ok) {
          throw new Error(sessionData.message || "Failed to load student access session");
        }

        setSession(sessionData);

        const [targetsRes, questionsRes] = await Promise.all([
          fetch("/api/student-access/targets", { cache: "no-store" }),
          fetch("/api/student-access/questionnaire", { cache: "no-store" }),
        ]);

        const targetsData = await targetsRes.json();
        const questionsData = await questionsRes.json();

        if (!targetsRes.ok) {
          throw new Error(targetsData.message || "Failed to load evaluation targets");
        }

        if (!questionsRes.ok) {
          throw new Error(questionsData.message || "Failed to load questionnaire");
        }

        setTargets(targetsData);
        setQuestions(questionsData.filter((question: Question) => question.isActive !== false));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student evaluation portal");
      } finally {
        setLoading(false);
      }
    };

    void loadPortal();
  }, [router]);

  const submittedTargetIds = useMemo(
    () => new Set(session?.submittedTargetIds ?? []),
    [session?.submittedTargetIds]
  );

  const selectedTarget = targets.find((target) => String(target.id) === selectedTargetId);
  const answeredCount = questions.filter((question) => answers[question.id]?.rating).length;
  const remainingTargets = targets.filter((target) => !submittedTargetIds.has(target.id));

  function handleNext() {
    if (!selectedTargetId) {
      setError("Please select an instructor to evaluate");
      return;
    }

    if (submittedTargetIds.has(Number(selectedTargetId))) {
      setError("You have already submitted this evaluation");
      return;
    }

    setError("");
    setStep(2);
  }

  function handleBack() {
    setStep(1);
    setError("");
  }

  async function handleSubmit() {
    if (!selectedTargetId) {
      setError("Please select an instructor to evaluate");
      return;
    }

    const unanswered = questions.filter((question) => !answers[question.id]?.rating);
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} unanswered)`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/student-access/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatedId: Number.parseInt(selectedTargetId, 10),
          answers: questions.map((question) => ({
            questionId: question.id,
            rating: answers[question.id].rating,
          })),
          comment: finalComment,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.details && data?.message
            ? `${data.message} (${data.details})`
            : data?.message || "Failed to submit evaluation";
        throw new Error(message);
      }

      setSession((current) =>
        current
          ? {
              ...current,
              submittedTargetIds: Array.from(
                new Set([...current.submittedTargetIds, Number.parseInt(selectedTargetId, 10)])
              ),
            }
          : current
      );
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setStep(1);
    setSelectedTargetId("");
    setAnswers({});
    setFinalComment("");
    setError("");
  }

  async function handleLeaveSession() {
    await fetch("/api/student-access/end", {
      method: "POST",
    }).catch(() => null);

    router.push("/login?mode=student");
    router.refresh();
  }

  if (loading) {
    return (
      <PortalPageLoader
        title="Student Evaluation Access"
        description="Loading your temporary evaluation session..."
        cards={2}
      />
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[24px] border border-[#e7e0f3] bg-white p-8 text-center shadow-[0_14px_40px_rgba(36,19,95,0.08)]">
          <h1 className="text-2xl font-extrabold text-[#24135f]">Student access required</h1>
          <p className="mt-3 text-sm text-[#6f678d]">
            Please enter your access code and Student ID first.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login?mode=student")}
            className="mt-6 rounded-[14px] bg-[#24135f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1b0f4d]"
          >
            Go to Student Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-5 pt-10 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-[28px] bg-[#24135f] px-5 py-6 text-white shadow-[0_22px_52px_rgba(36,19,95,0.18)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                Student Access
              </p>
              <h1 className="mt-2 text-[28px] font-extrabold leading-tight sm:text-[34px]">
                Evaluate Instructor
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-[15px]">
                Your access code is valid only for this evaluation opening. Each instructor can be
                evaluated once during this session.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="rounded-[20px] border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85 shadow-[0_14px_30px_rgba(17,10,49,0.16)] backdrop-blur">
                <p className="font-semibold">{session.student.name || "Student"}</p>
                <p className="text-white/70">Student ID: {session.student.studentId}</p>
                <p className="text-white/70">{session.schedule.academicYear}</p>
              </div>
              <button
                type="button"
                onClick={handleLeaveSession}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <LogOut size={16} />
                End Session
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Select Instructor", active: step === 1, complete: step > 1 },
            { label: "Answer Questions", active: step === 2, complete: step > 2 },
            { label: "Submit", active: step === 3, complete: false },
          ].map((item, index) => (
            <div
              key={item.label}
              className={`rounded-[18px] border px-4 py-3 text-sm font-semibold shadow-[0_10px_26px_rgba(36,19,95,0.06)] ${
                item.active
                  ? "border-[#24135f] bg-white text-[#24135f]"
                  : item.complete
                  ? "border-[#ccead6] bg-[#f1fbf4] text-[#18794e]"
                  : "border-[#e1dced] bg-white/80 text-[#756b95]"
              }`}
            >
              {index + 1}. {item.label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="rounded-[28px] border border-[#e7e0f3] bg-white px-4 py-5 shadow-[0_18px_42px_rgba(36,19,95,0.08)] sm:px-8 sm:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 className="text-[22px] font-bold text-[#24135f]">Choose an Instructor</h2>
                <p className="mt-2 text-sm text-[#6f678d]">
                  Pick the instructor you want to evaluate for this evaluation opening.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                      Instructor
                    </label>

                    <div className="relative">
                      <select
                        value={selectedTargetId}
                        onChange={(e) => setSelectedTargetId(e.target.value)}
                        className="h-12 w-full appearance-none rounded-[14px] border border-[#d2cae8] bg-white px-4 pr-12 text-sm text-[#24135f] outline-none transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/15"
                      >
                        <option value="">Select an instructor</option>
                        {targets.map((target) => {
                          const alreadySubmitted = submittedTargetIds.has(target.id);
                          return (
                            <option key={target.id} value={target.id} disabled={alreadySubmitted}>
                              {`${target.name || target.email} - ${alreadySubmitted ? "Already submitted" : target.role.replace(/_/g, " ")}`}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#24135f]"
                      />
                    </div>

                    {remainingTargets.length === 0 && (
                      <p className="mt-3 text-sm text-[#18794e]">
                        You have already submitted all available instructor evaluations for this
                        session.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#efe7fb] bg-white p-5 shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#24135f] text-white shadow-[0_12px_24px_rgba(36,19,95,0.14)]">
                  <UserRound size={28} />
                </div>

                {selectedTarget ? (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-bold text-[#24135f]">
                      {selectedTarget.name || selectedTarget.email}
                    </h3>
                    <p className="text-sm text-[#6f678d]">
                      {selectedTarget.role.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-[#6f678d]">
                      {selectedTarget.department || "No department listed"}
                    </p>
                    <p className="text-sm text-[#6f678d]">{selectedTarget.email}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-[#24135f]">Ready when you are</h3>
                    <p className="mt-2 text-sm text-[#6f678d]">
                      Choose an instructor to preview the evaluation target before continuing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                disabled={remainingTargets.length === 0}
                className="app-btn-primary min-h-[44px] w-full px-6 py-3 sm:w-auto"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-[28px] border border-[#e7e0f3] bg-white px-4 py-5 shadow-[0_18px_42px_rgba(36,19,95,0.08)] sm:px-8 sm:py-8">
            <div className="flex flex-col gap-3 border-b border-[#eee7fb] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-[#24135f]">
                  Evaluating {selectedTarget?.name || selectedTarget?.email}
                </h2>
                <p className="mt-2 text-sm text-[#6f678d]">
                  Rate each statement from strongly disagree to strongly agree.
                </p>
              </div>
              <div className="rounded-full border border-[#ebe4f9] bg-[#faf8ff] px-4 py-2 text-sm font-semibold text-[#24135f] shadow-[0_8px_20px_rgba(36,19,95,0.05)]">
                {answeredCount} of {questions.length} answered
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-[20px] border border-[#efe8fb] bg-white p-4 shadow-[0_10px_24px_rgba(36,19,95,0.05)] sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#24135f] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm font-semibold text-[#24135f] sm:text-base">
                      {question.questionText}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: { rating },
                          }))
                        }
                        className="min-h-[44px] min-w-[44px] rounded-full border border-[#e3d7ff] bg-white p-2 transition hover:border-[#24135f]"
                        aria-label={`Rate ${rating} stars`}
                      >
                        <Star
                          size={24}
                          className={
                            answers[question.id]?.rating >= rating
                              ? "fill-[#ffc627] text-[#ffc627]"
                              : "text-[#cbc4df]"
                          }
                        />
                      </button>
                    ))}

                    {answers[question.id]?.rating && (
                      <span className="text-sm font-semibold text-[#24135f]">
                        {
                          ["", "Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"][
                            answers[question.id].rating
                          ]
                        }
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="rounded-[20px] border border-[#efe8fb] bg-white p-4 shadow-[0_10px_24px_rgba(36,19,95,0.05)] sm:p-5">
                <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                  Optional Overall Comment
                </label>
                <textarea
                  value={finalComment}
                  onChange={(e) => setFinalComment(e.target.value)}
                  rows={4}
                  placeholder="Share any constructive feedback..."
                  className="app-textarea"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="app-btn-secondary min-h-[44px] px-6 py-3"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="app-btn-primary min-h-[44px] px-6 py-3"
              >
                {submitting ? "Submitting..." : "Submit Evaluation"}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-[28px] border border-[#dbeadf] bg-white px-4 py-10 text-center shadow-[0_18px_42px_rgba(36,19,95,0.08)] sm:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eaf8ee] text-[32px] text-[#18794e]">
              ✓
            </div>
            <h2 className="mt-5 text-[28px] font-extrabold text-[#24135f]">
              Evaluation Submitted Successfully!
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#6f678d] sm:text-base">
              Your feedback has been recorded for this evaluation session.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {remainingTargets.length > 0 ? (
                <button
                  type="button"
                  onClick={resetFlow}
                  className="app-btn-primary px-6 py-3"
                >
                  Evaluate Another Instructor
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleLeaveSession}
                className="app-btn-secondary px-6 py-3"
              >
                Finish
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
