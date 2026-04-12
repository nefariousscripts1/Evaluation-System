"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Star,
} from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
}

interface Question {
  id: number;
  questionText: string;
  isActive?: boolean;
}

export default function EvaluateInstructorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, { rating: number }>>({});
  const [finalComment, setFinalComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "student") {
      router.push("/unauthorized");
      return;
    }
    fetchInstructors();
    fetchQuestions();
    fetchCurrentSchedule();
  }, [status, session, router]);

  const fetchInstructors = async () => {
    try {
      const res = await fetch("/api/evaluate/users");
      const data = await res.json();
      setInstructors(data);
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questionnaire");
      const data = await res.json();
      setQuestions(data.filter((q: Question) => q.isActive !== false));
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  const fetchCurrentSchedule = async () => {
    try {
      const res = await fetch("/api/schedule/current", { cache: "no-store" });
      const data = await res.json();

      if (data?.academicYear) {
        setSelectedYear(data.academicYear);
        setAcademicYears([data.academicYear]);
      }
    } catch (error) {
      console.error("Failed to fetch current schedule:", error);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedInstructorId) {
      setError("Please select an instructor");
      return;
    }
    if (step === 1 && !selectedYear) {
      setError("No evaluation schedule is available right now");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError("");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    const unanswered = questions.filter((q) => !answers[q.id]?.rating);
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} unanswered)`);
      setSubmitting(false);
      return;
    }

    try {
      const evaluatedId = Number.parseInt(selectedInstructorId, 10);
      if (!Number.isInteger(evaluatedId)) {
        setError("Please select an instructor");
        return;
      }

      const res = await fetch("/api/evaluate/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatedId,
          academicYear: selectedYear,
          answers: questions.map((question) => ({
            questionId: question.id,
            rating: answers[question.id].rating,
          })),
          comment: finalComment,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setStep(3);
      } else {
        const message =
          data?.details && data?.message
            ? `${data.message} (${data.details})`
            : data?.message || "Failed to submit evaluation";
        setError(message);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Unable to submit evaluation: ${err.message}`
          : "An error occurred. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4]">
        <div className="text-[#24135f]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f7ff] via-[#f4f4f4] to-[#eee9f5]">
      {/* Main Content - Centered */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {/* Stepper */}
        <div className="mb-8 rounded-[16px] bg-white px-4 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:mb-12 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <StepItem number="1" label="Select Instructor" active={step === 1} completed={step > 1} />
            <div className={`h-1 flex-1 rounded-full ${step > 1 ? "bg-gradient-to-r from-[#24135f] to-[#3b82f6]" : "bg-gray-200"}`}></div>
            <StepItem number="2" label="Answer Evaluation" active={step === 2} completed={step > 2} />
            <div className={`h-1 flex-1 rounded-full ${step > 2 ? "bg-gradient-to-r from-[#24135f] to-[#3b82f6]" : "bg-gray-200"}`}></div>
            <StepItem number="3" label="Submit Evaluation" active={step === 3} completed={step > 3} />
          </div>
        </div>

        {/* Step 1: Select Instructor */}
        {step === 1 && (
          <div className="rounded-[20px] border border-[#e8e4f3] bg-white px-4 py-6 shadow-[0_10px_40px_rgba(36,19,95,0.08)] sm:px-8 sm:py-10">
            <h2 className="mb-8 text-[28px] font-bold text-[#24135f]">Select an Instructor to Evaluate</h2>
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-[16px] font-semibold text-[#24135f]">
                  Which instructor would you like to evaluate?
                </label>

                <div className="relative">
                  <select
                    value={selectedInstructorId}
                    onChange={(e) => {
                      const instructor = instructors.find(
                        (i) => i.id === parseInt(e.target.value)
                      );
                      setSelectedInstructorId(e.target.value);
                      setSelectedInstructor(instructor?.name || "");
                    }}
                    className="h-[48px] w-full appearance-none rounded-[10px] border-2 border-[#e8e4f3] bg-white px-5 pr-12 text-[16px] text-gray-700 outline-none transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/20"
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name} - {instructor.department || "No Department"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#24135f]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="text-[16px] font-semibold text-[#24135f]">
                  For which academic year?
                </label>

                <div className="relative w-full md:w-[200px]">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="h-[48px] w-full appearance-none rounded-[10px] border-2 border-[#e8e4f3] bg-white px-5 pr-12 text-[16px] font-semibold text-[#24135f] outline-none transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/20"
                  >
                    {academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#24135f]"
                  />
                </div>
              </div>

              {error && <p className="mt-4 rounded-[10px] bg-red-50 p-4 text-[14px] font-semibold text-red-700 border border-red-200">{error}</p>}

              <div className="flex justify-end pt-8">
                <button
                  onClick={handleNext}
                  className="rounded-[10px] bg-gradient-to-r from-[#24135f] to-[#3a1d7f] px-10 py-3 text-[15px] font-bold text-white transition shadow-[0_4px_15px_rgba(36,19,95,0.3)] hover:shadow-[0_6px_20px_rgba(36,19,95,0.4)] hover:scale-105"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Answer Evaluation */}
        {step === 2 && (
          <div className="rounded-[20px] border border-[#e8e4f3] bg-white px-4 py-6 shadow-[0_10px_40px_rgba(36,19,95,0.08)] sm:px-8 sm:py-10">
            <div className="mb-8 border-b border-[#e8e4f3] pb-6">
              <h2 className="text-[28px] font-bold text-[#24135f]">
                Evaluating: <span className="text-[#3b82f6]">{selectedInstructor}</span>
              </h2>
              <p className="mt-2 text-[15px] text-gray-600">
                Academic Year <span className="font-semibold text-[#24135f]">{selectedYear}</span>
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-[16px] border border-[#e8e4f3] bg-gradient-to-br from-[#f9f7ff] to-[#f4f0fd] p-4 shadow-[0_4px_12px_rgba(36,19,95,0.06)] sm:p-8">
                <h3 className="mb-6 text-[20px] font-bold text-[#24135f] flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#24135f] text-white text-[14px] font-bold">ℹ</span>
                  Instructions for Evaluation
                </h3>
                <div className="space-y-4 text-[15px] text-gray-700">
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#24135f] text-white flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    <span>Please evaluate <strong>{selectedInstructor}</strong> based on your experience in their class during this semester.</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#24135f] text-white flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    <span>Consider various aspects of the instructor's performance including teaching methodology, clarity of instruction, responsiveness to student needs, and overall effectiveness.</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#24135f] text-white flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    <span>Provide honest and constructive feedback. Your evaluation is confidential and will be used to help improve teaching quality.</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#24135f] text-white flex items-center justify-center text-sm font-bold">
                      4
                    </span>
                    <span>Overall Rating Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#24135f] text-white flex items-center justify-center text-sm font-bold">
                      5
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t-2 border-[#e8e4f3]">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-[20px] font-bold text-[#24135f]">
                    Please rate the following statements:
                  </h3>
                  <span className="text-[14px] font-semibold text-gray-500">
                    {questions.filter((question) => answers[question.id]?.rating).length} of {questions.length} answered
                  </span>
                </div>

                {questions.map((question, index) => (
                  <div key={question.id} className="mb-8 rounded-[14px] border border-[#f0ecf7] bg-[#fafbfd] p-6 pb-6 hover:border-[#e8e4f3] hover:shadow-[0_4px_12px_rgba(36,19,95,0.06)] transition">
                    <div className="flex items-start gap-3 mb-5">
                      <span className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-[#24135f] to-[#3b82f6] text-white flex items-center justify-center text-[14px] font-bold">
                        {index + 1}
                      </span>
                      <p className="text-[16px] font-semibold text-[#24135f] flex-1 mt-0.5">
                        {question.questionText}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-6">
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: { ...prev[question.id], rating },
                                }))
                              }
                              className="focus:outline-none"
                            >
                              <Star
                                size={28}
                                className={
                                  answers[question.id]?.rating >= rating
                                    ? "fill-[#f4c542] text-[#f4c542]"
                                    : "text-gray-300"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        {answers[question.id]?.rating && (
                          <div className="text-sm font-semibold text-[#24135f]">
                            {["", "Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"][answers[question.id].rating]}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 text-xs font-medium text-gray-500">
                        <span>Strongly Disagree</span>
                        <span>Disagree</span>
                        <span>Neutral</span>
                        <span>Agree</span>
                        <span>Strongly Agree</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-[14px] border border-[#f0ecf7] bg-[#fafbfd] p-6 transition">
                  <div className="mb-5">
                    <p className="text-[16px] font-semibold text-[#24135f]">
                      Optional Comments
                    </p>
                    <p className="mt-1 text-[14px] text-gray-500">
                      Share any overall feedback about this instructor.
                    </p>
                  </div>
                  <textarea
                    placeholder="Optional overall comments..."
                    className="w-full rounded-[10px] border-2 border-[#e8e4f3] bg-white p-4 text-[14px] text-gray-700 transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/20"
                    rows={3}
                    value={finalComment}
                    onChange={(e) => setFinalComment(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="mt-6 rounded-[10px] bg-red-50 p-4 text-[14px] font-semibold text-red-700 border border-red-200">{error}</p>}

              <div className="mt-10 flex flex-col gap-3 pt-8 sm:flex-row sm:justify-between sm:gap-4">
                <button
                  onClick={handleBack}
                  className="rounded-[10px] border-2 border-gray-300 px-8 py-3 text-[15px] font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-[10px] bg-gradient-to-r from-[#24135f] to-[#3a1d7f] px-10 py-3 text-[15px] font-bold text-white transition shadow-[0_4px_15px_rgba(36,19,95,0.3)] hover:shadow-[0_6px_20px_rgba(36,19,95,0.4)] hover:scale-105 disabled:opacity-50 disabled:scale-100"
                >
                  {submitting ? "Submitting..." : "Submit Evaluation ✓"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="rounded-[20px] border border-[#e8e4f3] bg-gradient-to-br from-white via-[#f9f7ff] to-white px-4 py-10 text-center shadow-[0_10px_40px_rgba(36,19,95,0.08)] sm:px-8 sm:py-16">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#24135f] to-[#3b82f6] text-5xl text-white">
              ✓
            </div>
            <h2 className="mb-4 text-[32px] font-bold text-[#24135f]">
              Evaluation Submitted Successfully!
            </h2>
            <p className="mb-4 text-[18px] text-gray-600">
              Thank you for your thoughtful evaluation of
            </p>
            <p className="mb-8 text-[20px] font-bold text-[#3b82f6]">
              {selectedInstructor}
            </p>
            <p className="mb-8 text-[15px] text-gray-500">
              Your feedback is valuable and will help improve teaching quality
            </p>
            <button
              onClick={() => {
                setStep(1);
                setSelectedInstructor("");
                setSelectedInstructorId("");
                setAnswers({});
                setFinalComment("");
                setError("");
              }}
              className="rounded-[10px] bg-gradient-to-r from-[#24135f] to-[#3a1d7f] px-10 py-3 text-[15px] font-bold text-white transition shadow-[0_4px_15px_rgba(36,19,95,0.3)] hover:shadow-[0_6px_20px_rgba(36,19,95,0.4)] hover:scale-105"
            >
              Evaluate Another Instructor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepItem({
  number,
  label,
  active = false,
  completed = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold transition ${
          active
            ? "bg-gradient-to-r from-[#24135f] to-[#3a1d7f] text-white shadow-[0_4px_15px_rgba(36,19,95,0.3)]"
            : completed
            ? "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-[0_4px_12px_rgba(59,130,246,0.2)]"
            : "border-2 border-gray-300 text-gray-400"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span className={`text-center text-[14px] font-semibold ${
        active ? "text-[#24135f]" : completed ? "text-[#3b82f6]" : "text-gray-500"
      }`}>
        {label}
      </span>
    </div>
  );
}
