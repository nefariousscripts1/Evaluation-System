"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, UserRound } from "lucide-react";
import AppSelect from "@/components/ui/AppSelect";
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

type PortalCopy = {
  pageTitle: string;
  pageDescription: string;
  selectorLabel: string;
  emptyMessage: string;
  successTitle: string;
  successDescription: string;
};

type RoleEvaluationPortalProps = {
  allowedRole: string;
  copy: PortalCopy;
};

export default function RoleEvaluationPortal({
  allowedRole,
  copy,
}: RoleEvaluationPortalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [targets, setTargets] = useState<EvaluationTarget[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, { rating: number }>>({});
  const [finalComment, setFinalComment] = useState("");
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== allowedRole) {
      router.push("/unauthorized");
      return;
    }

    if (status === "authenticated") {
      void Promise.all([fetchTargets(), fetchQuestions(), fetchCurrentSchedule()]);
    }
  }, [allowedRole, router, session, status]);

  async function fetchTargets() {
    try {
      const res = await fetch("/api/evaluations/targets", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load evaluation targets");
      }

      setTargets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evaluation targets");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestions() {
    try {
      const res = await fetch("/api/questionnaire", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load questions");
      }

      setQuestions(data.filter((q: Question) => q.isActive !== false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    }
  }

  async function fetchCurrentSchedule() {
    try {
      const res = await fetch("/api/schedule/current", { cache: "no-store" });
      const data = await res.json();

      if (data?.scheduleId && data?.academicYear) {
        setScheduleId(data.scheduleId);
        setSelectedYear(data.academicYear);
        setAcademicYears([data.academicYear]);
      }
    } catch (err) {
      console.error("Failed to fetch current schedule:", err);
    }
  }

  const selectedTarget = targets.find((target) => String(target.id) === selectedTargetId);
  const answeredCount = questions.filter((question) => answers[question.id]?.rating).length;

  function handleNext() {
    if (!selectedTargetId) {
      setError("Please select a person to evaluate");
      return;
    }

    if (!selectedYear) {
      setError("No evaluation schedule is available right now");
      return;
    }

    if (!scheduleId) {
      setError("No active evaluation session is available right now");
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
      setError("Please select a person to evaluate");
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
      const res = await fetch("/api/evaluations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatedId: Number.parseInt(selectedTargetId, 10),
          scheduleId,
          academicYear: selectedYear,
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

  if (loading) {
    return (
      <PortalPageLoader
        title={copy.pageTitle}
        description="Loading the evaluation flow, active schedule, and target list..."
        cards={2}
      />
    );
  }

  return (
    <div className="app-shell-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-5 pt-16 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-[28px] bg-[#24135f] px-5 py-6 text-white shadow-[0_22px_52px_rgba(36,19,95,0.18)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">
                Evaluation Portal
              </p>
              <h1 className="mt-2 text-[28px] font-extrabold leading-tight sm:text-[34px]">
                {copy.pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-[15px]">
                {copy.pageDescription}
              </p>
            </div>

            <div className="rounded-[20px] border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85 shadow-[0_14px_30px_rgba(17,10,49,0.16)] backdrop-blur">
              <p className="font-semibold">{session?.user?.name || session?.user?.email}</p>
              <p className="text-white/70">{selectedYear || "Waiting for schedule"}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Select Person", active: step === 1, complete: step > 1 },
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
                <h2 className="text-[22px] font-bold text-[#24135f]">Choose Evaluation Target</h2>
                <p className="mt-2 text-sm text-[#6f678d]">
                  Start by choosing the person you want to evaluate and confirming the active academic year.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                      {copy.selectorLabel}
                    </label>

                    <div>
                      <AppSelect
                        value={selectedTargetId}
                        onChange={setSelectedTargetId}
                        placeholder="Select a person"
                        options={targets.map((target) => ({
                          value: String(target.id),
                          label: target.name || target.email,
                          sublabel: `${target.role.replace(/_/g, " ")}${target.department ? ` • ${target.department}` : ""}`,
                        }))}
                        triggerClassName="min-h-12 rounded-[14px] text-sm"
                      />
                    </div>

                    {targets.length === 0 && (
                      <p className="mt-3 text-sm text-[#8f4663]">{copy.emptyMessage}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                      Academic Year
                    </label>
                    <div>
                      <AppSelect
                        value={selectedYear}
                        onChange={setSelectedYear}
                        options={academicYears.map((year) => ({ value: year, label: year }))}
                        triggerClassName="min-h-12 rounded-[14px] text-sm"
                      />
                    </div>
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
                      Pick a person from the list to preview the evaluation target before continuing.
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
            <h2 className="mt-5 text-[28px] font-extrabold text-[#24135f]">{copy.successTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#6f678d] sm:text-base">
              {copy.successDescription}
            </p>
            <button
              type="button"
              onClick={resetFlow}
              className="app-btn-primary mt-8 px-6 py-3"
            >
              Submit Another Evaluation
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
