"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut, Search, Star, UserRound } from "lucide-react";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { groupQuestionsByCategory, PERFORMANCE_RATING_SCALE } from "@/lib/questionnaire";

type Question = {
  id: number;
  questionText: string;
  category?: string | null;
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
    semester: string;
    startDate: string;
    endDate: string;
    accessCode: string | null;
  };
  target: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
    code: string;
  } | null;
  hasSubmittedCurrentTarget: boolean;
  submittedTargetIds: number[];
};

type TargetValidationResponse = {
  target: {
    id: number;
    name: string | null;
    email: string;
    role: string;
    department: string | null;
  };
  code: string;
  hasSubmittedCurrentTarget: boolean;
};

export default function StudentAccessPortal() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, { rating: number }>>({});
  const [finalComment, setFinalComment] = useState("");
  const [instructorCode, setInstructorCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
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

        const questionsRes = await fetch("/api/student-access/questionnaire", {
          cache: "no-store",
        });
        const questionsData = await questionsRes.json();

        if (!questionsRes.ok) {
          throw new Error(questionsData.message || "Failed to load questionnaire");
        }

        setQuestions(questionsData.filter((question: Question) => question.isActive !== false));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student evaluation portal");
      } finally {
        setLoading(false);
      }
    };

    void loadPortal();
  }, [router]);

  const answeredCount = questions.filter((question) => answers[question.id]?.rating).length;
  const targetName = session?.target?.name || session?.target?.email || "Instructor";
  const groupedQuestions = groupQuestionsByCategory(questions);
  let questionNumber = 0;

  async function handleValidateInstructorCode() {
    if (!instructorCode.trim()) {
      setError("Instructor code is required");
      return;
    }

    setVerifyingCode(true);
    setError("");

    try {
      const res = await fetch("/api/student-access/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorCode,
        }),
      });

      const data: (TargetValidationResponse & { message?: string }) | null = await res
        .json()
        .catch(() => null);

      if (!res.ok || !data) {
        throw new Error(data?.message || "Failed to validate instructor code");
      }

      setSession((current) =>
        current
          ? {
              ...current,
              target: {
                ...data.target,
                code: data.code,
              },
              hasSubmittedCurrentTarget: data.hasSubmittedCurrentTarget,
            }
          : current
      );
      setInstructorCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate instructor code");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleResetInstructorSelection() {
    setError("");

    await fetch("/api/student-access/targets", {
      method: "DELETE",
    }).catch(() => null);

    setSession((current) =>
      current
        ? {
            ...current,
            target: null,
            hasSubmittedCurrentTarget: false,
          }
        : current
    );
    setInstructorCode("");
    setAnswers({});
    setFinalComment("");
    setStep(1);
  }

  function handleNext() {
    if (!session?.target) {
      setError("Please validate an instructor code first");
      return;
    }

    if (session.hasSubmittedCurrentTarget) {
      setError("You have already submitted an evaluation for this instructor in this portal session.");
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
    if (!session?.target) {
      setError("Please validate an instructor code first");
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
              hasSubmittedCurrentTarget: true,
              submittedTargetIds: current.target
                ? Array.from(new Set([...current.submittedTargetIds, current.target.id]))
                : current.submittedTargetIds,
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

  async function handleLeaveSession(nextPath = "/login?mode=student") {
    await fetch("/api/student-access/end", {
      method: "POST",
    }).catch(() => null);

    router.push(nextPath);
    router.refresh();
  }

  if (loading) {
    return (
      <PortalPageLoader
        title="Student Evaluation Portal"
        description="Loading the current evaluation portal session..."
        cards={2}
      />
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-[24px] border border-[#e7e0f3] bg-white p-8 text-center shadow-[0_14px_40px_rgba(36,19,95,0.08)]">
          <h1 className="text-2xl font-extrabold text-[#24135f]">Portal access required</h1>
          <p className="mt-3 text-sm text-[#6f678d]">
            Please enter the portal access code first.
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
      <div className="mx-auto max-w-[1600px] px-4 pb-5 pt-10 sm:px-6 sm:py-8">
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
                You are inside the evaluation portal for the active Academic Year and Semester.
                Enter an instructor code to begin.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="rounded-[20px] border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85 shadow-[0_14px_30px_rgba(17,10,49,0.16)] backdrop-blur">
                <p className="font-semibold">{session.student.name || "Student"}</p>
                <p className="text-white/70">
                  {session.schedule.academicYear} • {session.schedule.semester}
                </p>
                <p className="text-white/70">Student ID: {session.student.studentId}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleLeaveSession()}
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
            { label: "Validate Instructor Code", active: step === 1, complete: step > 1 },
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
            {!session.target ? (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <h2 className="text-[22px] font-bold text-[#24135f]">Enter Instructor Code</h2>
                  <p className="mt-2 text-sm text-[#6f678d]">
                    Use the instructor code provided for the current Academic Year and Semester.
                  </p>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                      Instructor Code
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Search
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7b7498]"
                        />
                        <input
                          value={instructorCode}
                          onChange={(event) => setInstructorCode(event.target.value.toUpperCase())}
                          placeholder="Enter instructor code"
                          className="app-input h-12 pl-11 font-semibold uppercase tracking-[0.14em]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleValidateInstructorCode()}
                        disabled={verifyingCode}
                        className="app-btn-primary min-h-[48px] px-6 py-3"
                      >
                        {verifyingCode ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Validating...
                          </span>
                        ) : (
                          "Validate Code"
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#efe7fb] bg-white p-5 shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#24135f] text-white shadow-[0_12px_24px_rgba(36,19,95,0.14)]">
                    <UserRound size={28} />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-[#24135f]">Ready to validate</h3>
                    <p className="mt-2 text-sm text-[#6f678d]">
                      Once the instructor code is valid, the portal will show the instructor name
                      before you continue to the questionnaire.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <h2 className="text-[22px] font-bold text-[#24135f]">Instructor Confirmed</h2>
                  <p className="mt-2 text-sm text-[#6f678d]">
                    The instructor code is valid for the current evaluation period.
                  </p>

                  <div className="mt-6 rounded-[20px] border border-[#e8e0f6] bg-[#faf8ff] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7199]">
                      Instructor Code
                    </p>
                    <p className="mt-2 text-2xl font-extrabold tracking-[0.18em] text-[#24135f]">
                      {session.target.code}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7199]">
                          Academic Year
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#24135f]">
                          {session.schedule.academicYear}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7199]">
                          Semester
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#24135f]">
                          {session.schedule.semester}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#efe7fb] bg-white p-5 shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#24135f] text-white shadow-[0_12px_24px_rgba(36,19,95,0.14)]">
                    <UserRound size={28} />
                  </div>

                  <div className="mt-4 space-y-2">
                    <h3 className="text-xl font-bold text-[#24135f]">{targetName}</h3>
                    <p className="text-sm text-[#6f678d]">
                      {session.target.role.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-[#6f678d]">
                      {session.target.department || "No department listed"}
                    </p>
                    <p className="text-sm text-[#6f678d]">{session.target.email}</p>
                  </div>

                  {session.hasSubmittedCurrentTarget ? (
                    <div className="mt-5 rounded-[16px] border border-[#f0d6d8] bg-[#fff6f6] px-4 py-3 text-sm text-[#b42318]">
                      This instructor has already been evaluated in the current portal session.
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-[#6f678d]">
                      The instructor name is now confirmed. Continue when you are ready to answer
                      the questionnaire.
                    </p>
                  )}
                </div>
              </div>
            )}

            {error ? (
              <div className="mt-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {session.target ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleResetInstructorSelection()}
                    className="app-btn-secondary min-h-[44px] px-6 py-3"
                  >
                    Enter Another Code
                  </button>
                  {!session.hasSubmittedCurrentTarget ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="app-btn-primary min-h-[44px] px-6 py-3"
                    >
                      Continue
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-[28px] border border-[#e7e0f3] bg-white px-4 py-5 shadow-[0_18px_42px_rgba(36,19,95,0.08)] sm:px-8 sm:py-8">
            <div className="flex flex-col gap-3 border-b border-[#eee7fb] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-[#24135f]">Evaluating {targetName}</h2>
                <p className="mt-2 text-sm text-[#6f678d]">
                  Read the instructions first, then rate each item using the descriptive
                  performance scale from 5 (Outstanding) to 1 (Poor).
                </p>
              </div>
              <div className="rounded-full border border-[#ebe4f9] bg-[#faf8ff] px-4 py-2 text-sm font-semibold text-[#24135f] shadow-[0_8px_20px_rgba(36,19,95,0.05)]">
                {answeredCount} of {questions.length} answered
              </div>
            </div>

            {session.target ? (
              <div className="mt-6 rounded-[22px] border border-[#e8e0f6] bg-[#faf8ff] p-5 shadow-[0_10px_24px_rgba(36,19,95,0.04)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#24135f] text-white shadow-[0_12px_24px_rgba(36,19,95,0.14)]">
                      <UserRound size={28} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7199]">
                        Instructor
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold text-[#24135f]">{targetName}</h3>
                      <p className="mt-1 text-sm text-[#6f678d]">
                        {session.target.role.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-[#6f678d]">
                        {session.target.department || "No department listed"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[16px] border border-[#e7def7] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199]">
                        Code
                      </p>
                      <p className="mt-1 text-sm font-bold tracking-[0.14em] text-[#24135f]">
                        {session.target.code}
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#e7def7] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199]">
                        Academic Year
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#24135f]">
                        {session.schedule.academicYear}
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[#e7def7] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199]">
                        Semester
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#24135f]">
                        {session.schedule.semester}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-[22px] border border-[#efe8fb] bg-[#fbf9ff] p-4 shadow-[0_10px_24px_rgba(36,19,95,0.04)]">
              <p className="text-sm font-semibold text-[#24135f]">Instructions</p>
              <p className="mt-2 text-sm leading-6 text-[#6f678d]">
                Please evaluate the faculty using the descriptive rating scale below. Base your
                answers on the quality of performance shown in each statement, not on
                strongly agree or strongly disagree.
              </p>

              <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e7def7] bg-white">
                <div className="grid grid-cols-[110px_1fr] border-b border-[#efe8fb] bg-[#f7f3ff] text-sm font-bold text-[#24135f] md:grid-cols-[110px_220px_1fr]">
                  <div className="px-4 py-3">Numerical Rating</div>
                  <div className="hidden border-l border-[#efe8fb] px-4 py-3 md:block">
                    Descriptive Rating
                  </div>
                  <div className="border-l border-[#efe8fb] px-4 py-3">
                    Qualitative Description
                  </div>
                </div>

                {PERFORMANCE_RATING_SCALE.map((scale, index) => (
                  <div
                    key={scale.value}
                    className={`grid grid-cols-[110px_1fr] text-sm text-[#24135f] md:grid-cols-[110px_220px_1fr] ${
                      index !== PERFORMANCE_RATING_SCALE.length - 1
                        ? "border-b border-[#efe8fb]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-center px-4 py-3 font-bold">
                      {scale.value}
                    </div>
                    <div className="hidden items-center border-l border-[#efe8fb] px-4 py-3 font-semibold md:flex">
                      {scale.label}
                    </div>
                    <div className="border-l border-[#efe8fb] px-4 py-3 text-[#6f678d]">
                      <span className="block font-semibold text-[#24135f] md:hidden">
                        {scale.label}
                      </span>
                      {scale.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {groupedQuestions.map((group) => (
                <div
                  key={group.category}
                  className="overflow-hidden rounded-[24px] border border-[#e8e0f6] bg-white shadow-[0_10px_24px_rgba(36,19,95,0.04)]"
                >
                  <div className="flex flex-col gap-3 border-b border-[#e8e0f6] bg-[#f7f3ff] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7199]">
                        Category
                      </p>
                      <h3 className="mt-1 text-lg font-extrabold text-[#24135f]">
                        {group.category}
                      </h3>
                      <p className="mt-1 text-sm text-[#6f678d]">
                        {group.items.length} questionnaire items
                      </p>
                    </div>
                    <div className="rounded-full border border-[#e3daf7] bg-white px-4 py-2 text-sm font-semibold text-[#24135f]">
                      {
                        group.items.filter((question) => answers[question.id]?.rating).length
                      }{" "}
                      of {group.items.length} answered
                    </div>
                  </div>

                  <div className="hidden grid-cols-[84px_minmax(0,1fr)_320px] border-b border-[#efe8fb] bg-[#fcfbff] text-sm font-semibold text-[#24135f] lg:grid">
                    <div className="px-5 py-3">No.</div>
                    <div className="border-l border-[#efe8fb] px-5 py-3">Question</div>
                    <div className="border-l border-[#efe8fb] px-5 py-3">Rating</div>
                  </div>

                  <div>
                    {group.items.map((question) => {
                      questionNumber += 1;

                      return (
                        <div
                          key={question.id}
                          className="border-b border-[#efe8fb] last:border-b-0"
                        >
                          <div className="grid gap-4 px-4 py-4 lg:grid-cols-[84px_minmax(0,1fr)_320px] lg:gap-0 lg:px-0 lg:py-0">
                            <div className="flex items-start lg:items-stretch lg:justify-center lg:px-4 lg:py-5">
                              <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-[#24135f] px-2 text-sm font-bold text-white">
                                {questionNumber}
                              </div>
                            </div>

                            <div className="min-w-0 lg:border-l lg:border-[#efe8fb] lg:px-5 lg:py-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199] lg:hidden">
                                Question
                              </p>
                              <p className="pt-1 text-sm font-semibold text-[#24135f] sm:text-base lg:pt-0">
                                {question.questionText}
                              </p>
                            </div>

                            <div className="lg:border-l lg:border-[#efe8fb] lg:px-5 lg:py-5">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199] lg:hidden">
                                Rating
                              </p>
                              <div className="mt-2 space-y-3 lg:mt-0">
                                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                                  {PERFORMANCE_RATING_SCALE.map((scale) => {
                                    const isSelected = answers[question.id]?.rating === scale.value;

                                    return (
                                      <button
                                        key={scale.value}
                                        type="button"
                                        onClick={() =>
                                          setAnswers((prev) => ({
                                            ...prev,
                                            [question.id]: { rating: scale.value },
                                          }))
                                        }
                                        className={`inline-flex h-[44px] min-w-0 items-center justify-center rounded-[14px] border text-sm font-bold transition ${
                                          isSelected
                                            ? "border-[#24135f] bg-[#24135f] text-white"
                                            : "border-[#e3d7ff] bg-white text-[#24135f] hover:border-[#24135f]"
                                        }`}
                                        aria-label={`Rate ${scale.value} - ${scale.label}`}
                                        title={`${scale.value} - ${scale.label}`}
                                      >
                                        <span className="inline-flex items-center gap-2">
                                          <Star
                                            size={16}
                                            className={isSelected ? "fill-current" : ""}
                                          />
                                          <span>{scale.value}</span>
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="min-h-[24px] text-sm font-semibold text-[#24135f]">
                                  {answers[question.id]?.rating
                                    ? PERFORMANCE_RATING_SCALE.find(
                                        (scale) => scale.value === answers[question.id].rating
                                      )?.label
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

            {error ? (
              <div className="mt-6 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

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
              Your feedback for {targetName} has been recorded for {session.schedule.academicYear},{" "}
              {session.schedule.semester}.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleResetInstructorSelection()}
                className="app-btn-primary px-6 py-3"
              >
                Evaluate Another Instructor
              </button>
              <button
                type="button"
                onClick={() => void handleLeaveSession("/login?mode=student")}
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
