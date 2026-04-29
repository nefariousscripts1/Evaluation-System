"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Star, UserRound } from "lucide-react";
import AppSelect from "@/components/ui/AppSelect";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { groupQuestionsByCategory, PERFORMANCE_RATING_SCALE } from "@/lib/questionnaire";

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
  category?: string | null;
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
  const [selectedSemester, setSelectedSemester] = useState("");
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
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<number | null>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

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
      const data = await readApiResponse<EvaluationTarget[]>(res);
      setTargets(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load evaluation targets"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestions() {
    try {
      const res = await fetch("/api/questionnaire", { cache: "no-store" });
      const data = await readApiResponse<Question[]>(res);
      setQuestions(data.filter((q: Question) => q.isActive !== false));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load questions"));
    }
  }

  async function fetchCurrentSchedule() {
    try {
      const res = await fetch("/api/schedule/current", { cache: "no-store" });
      const data = await readApiResponse<{
        scheduleId: number | null;
        academicYear: string | null;
        semester: string | null;
      }>(res);

      if (data?.scheduleId && data?.academicYear) {
        setScheduleId(data.scheduleId);
        setSelectedYear(data.academicYear);
        setSelectedSemester(data.semester || "");
        setAcademicYears([data.academicYear]);
      }
    } catch (err) {
      console.error("Failed to fetch current schedule:", err);
    }
  }

  useEffect(() => {
    if (highlightedQuestionId === null) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const target = questionRefs.current[highlightedQuestionId];

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [highlightedQuestionId]);

  const selectedTarget = targets.find((target) => String(target.id) === selectedTargetId);
  const answeredCount = questions.filter((question) => answers[question.id]?.rating).length;
  const groupedQuestions = groupQuestionsByCategory(questions);

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
      setHighlightedQuestionId(unanswered[0].id);
      setError(`Please answer all questions (${unanswered.length} unanswered)`);
      return;
    }

    setSubmitting(true);
    setError("");
    setHighlightedQuestionId(null);

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
      await readApiResponse(res);

      setStep(3);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit evaluation"));
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
    setHighlightedQuestionId(null);
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
      <div className="w-full px-4 pb-5 pt-10 sm:px-6 sm:py-8 lg:px-8">
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
              <p className="text-white/70">
                {selectedYear || "Waiting for schedule"}
                {selectedSemester ? ` • ${selectedSemester}` : ""}
              </p>
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
                  Read the instructions first, then rate each item using the descriptive
                  performance scale from 5 (Outstanding) to 1 (Poor).
                </p>
              </div>
              <div className="rounded-full border border-[#ebe4f9] bg-[#faf8ff] px-4 py-2 text-sm font-semibold text-[#24135f] shadow-[0_8px_20px_rgba(36,19,95,0.05)]">
                {answeredCount} of {questions.length} answered
              </div>
            </div>

            {selectedTarget ? (
              <div className="mt-6 rounded-[22px] border border-[#e8e0f6] bg-[#faf8ff] p-5 shadow-[0_10px_24px_rgba(36,19,95,0.04)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#24135f] text-white shadow-[0_12px_24px_rgba(36,19,95,0.14)]">
                      <UserRound size={28} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7199]">
                        {copy.selectorLabel.replace("Which ", "").replace(" would you like to evaluate?", "")}
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold text-[#24135f]">
                        {selectedTarget.name || selectedTarget.email}
                      </h3>
                      <p className="mt-1 text-sm text-[#6f678d]">
                        {selectedTarget.role.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-[#6f678d]">
                        {selectedTarget.department || "No department listed"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[16px] border border-[#e7def7] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199]">
                        Email
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#24135f]">{selectedTarget.email}</p>
                    </div>
                    <div className="rounded-[16px] border border-[#e7def7] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199]">
                        Academic Year
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#24135f]">{selectedYear || "-"}</p>
                    </div>
                    <div className="rounded-[16px] border border-[#e7def7] bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199]">
                        Semester
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#24135f]">
                        {selectedSemester || "Current term"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-[22px] border border-[#efe8fb] bg-[#fbf9ff] p-4 shadow-[0_10px_24px_rgba(36,19,95,0.04)]">
              <p className="text-sm font-semibold text-[#24135f]">Instructions</p>
              <p className="mt-2 text-sm leading-6 text-[#6f678d]">
                Please evaluate using the descriptive rating scale below. Base your
                answers on the quality of performance shown in each statement.
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
                      index !== PERFORMANCE_RATING_SCALE.length - 1 ? "border-b border-[#efe8fb]" : ""
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
                      <h3 className="mt-1 text-lg font-extrabold text-[#24135f]">{group.category}</h3>
                      <p className="mt-1 text-sm text-[#6f678d]">
                        {group.items.length} questionnaire items
                      </p>
                    </div>
                    <div className="rounded-full border border-[#e3daf7] bg-white px-4 py-2 text-sm font-semibold text-[#24135f]">
                      {group.items.filter((question) => answers[question.id]?.rating).length} of{" "}
                      {group.items.length} answered
                    </div>
                  </div>

                  <div className="hidden grid-cols-[84px_minmax(0,1fr)_320px] border-b border-[#efe8fb] bg-[#fcfbff] text-sm font-semibold text-[#24135f] lg:grid">
                    <div className="px-5 py-3">No.</div>
                    <div className="border-l border-[#efe8fb] px-5 py-3">Question</div>
                    <div className="border-l border-[#efe8fb] px-5 py-3">Rating</div>
                  </div>

                  <div>
                    {group.items.map((question, index) => (
                      <div
                        key={question.id}
                        ref={(node) => {
                          questionRefs.current[question.id] = node;
                        }}
                        className={`border-b last:border-b-0 ${
                          highlightedQuestionId === question.id
                            ? "border-red-300 bg-red-50/60"
                            : "border-[#efe8fb]"
                        }`}
                      >
                        <div
                          className={`grid gap-4 px-4 py-4 transition-colors lg:grid-cols-[84px_minmax(0,1fr)_320px] lg:gap-0 lg:px-0 lg:py-0 ${
                            highlightedQuestionId === question.id ? "bg-red-50" : ""
                          }`}
                        >
                          <div className="flex items-start lg:items-stretch lg:justify-center lg:px-4 lg:py-5">
                            <div
                              className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2 text-sm font-bold text-white ${
                                highlightedQuestionId === question.id ? "bg-red-600" : "bg-[#24135f]"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </div>

                          <div className="min-w-0 lg:border-l lg:border-[#efe8fb] lg:px-5 lg:py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7a7199] lg:hidden">
                              Question
                            </p>
                            <p className="pt-1 text-sm font-semibold text-[#24135f] sm:text-base lg:pt-0">
                              {question.questionText}
                            </p>
                            {highlightedQuestionId === question.id ? (
                              <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                                Required
                              </p>
                            ) : null}
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
                                      onClick={() => {
                                        setAnswers((prev) => ({
                                          ...prev,
                                          [question.id]: { rating: scale.value },
                                        }));

                                        if (highlightedQuestionId === question.id) {
                                          setHighlightedQuestionId(null);
                                        }
                                      }}
                                      className={`inline-flex h-[44px] min-w-0 items-center justify-center rounded-[14px] border text-sm font-bold transition ${
                                        isSelected
                                          ? "border-[#24135f] bg-[#24135f] text-white"
                                          : "border-[#e3d7ff] bg-white text-[#24135f] hover:border-[#24135f]"
                                      }`}
                                      aria-label={`Rate ${scale.value} - ${scale.label}`}
                                      title={`${scale.value} - ${scale.label}`}
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <Star size={16} className={isSelected ? "fill-current" : ""} />
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
                    ))}
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
