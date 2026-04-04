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

export default function EvaluateInstructorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedYear, setSelectedYear] = useState("2023-2024");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<
    Record<number, { rating: number; comment: string }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const academicYears = ["2023-2024", "2024-2025", "2025-2026"];

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
      setQuestions(data.filter((q: any) => q.isActive !== false));
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedInstructorId) {
      setError("Please select an instructor");
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
      const res = await fetch("/api/evaluate/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatedId: parseInt(selectedInstructorId),
          academicYear: selectedYear,
          answers: Object.entries(answers).map(([qId, { rating, comment }]) => ({
            questionId: parseInt(qId),
            rating,
            comment: comment || "",
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(3);
      } else {
        setError(data.message || "Failed to submit evaluation");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Main Content - Centered */}
      <div className="mx-auto max-w-[1180px] px-4 py-8">
        {/* Stepper */}
        <div className="rounded-[12px] bg-[#24135f] px-6 py-5 shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-6 text-white">
            <StepItem number="1" label="Select Instructor" active={step === 1} />
            <StepItem number="2" label="Answer Evaluation" active={step === 2} />
            <StepItem number="3" label="Submit Evaluation" active={step === 3} />
          </div>
        </div>

        {/* Step 1: Select Instructor */}
        {step === 1 && (
          <div className="mt-8 rounded-[14px] border border-[#dddddd] bg-white px-6 py-8 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[18px] font-extrabold text-[#24135f]">
                  Select Instructor:
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
                    className="h-[44px] w-full appearance-none rounded-[6px] border border-[#8c82b5] bg-white px-4 pr-10 text-[15px] text-[#77728f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
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
                <label className="text-[18px] font-extrabold text-[#24135f]">
                  Select Academic Year:
                </label>

                <div className="relative w-full md:w-[180px]">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="h-[40px] w-full appearance-none rounded-[4px] border border-[#8c82b5] bg-white px-3 pr-9 text-[14px] font-semibold text-[#24135f] outline-none focus:border-[#24135f]"
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

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  className="rounded-[6px] bg-[#24135f] px-8 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#1a0f4a]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Answer Evaluation */}
        {step === 2 && (
          <div className="mt-8 rounded-[14px] border border-[#dddddd] bg-white px-6 py-8 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <div className="mb-5 border-b border-gray-200 pb-4">
              <h2 className="text-[20px] font-extrabold text-[#24135f]">
                Evaluating: {selectedInstructor}
              </h2>
              <p className="text-[14px] text-gray-500">
                Academic Year: {selectedYear}
              </p>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-100 pb-5">
                  <p className="mb-2 text-[16px] font-semibold text-[#24135f]">
                    {index + 1}. {question.questionText}
                  </p>

                  <div className="mt-2 flex gap-2">
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

                  <textarea
                    placeholder="Optional comments..."
                    className="mt-3 w-full rounded-[6px] border border-gray-300 p-3 text-sm focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                    rows={2}
                    value={answers[question.id]?.comment || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: {
                          ...prev[question.id],
                          comment: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              ))}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={handleBack}
                  className="rounded-[6px] border border-gray-300 px-8 py-2.5 text-[14px] font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded-[6px] bg-[#24135f] px-8 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#1a0f4a] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Evaluation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="mt-8 rounded-[14px] border border-[#dddddd] bg-white px-6 py-16 text-center shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
            <div className="mb-4 text-7xl">✅</div>
            <h2 className="mb-2 text-[28px] font-extrabold text-[#24135f]">
              Evaluation Submitted!
            </h2>
            <p className="mb-8 text-gray-600">
              Thank you for evaluating {selectedInstructor}
            </p>
            <button
              onClick={() => {
                setStep(1);
                setSelectedInstructor("");
                setSelectedInstructorId("");
                setAnswers({});
              }}
              className="rounded-[6px] bg-[#24135f] px-8 py-3 text-[14px] font-bold text-white transition hover:bg-[#1a0f4a]"
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
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-[18px] font-extrabold ${
          active
            ? "border-white bg-white text-[#24135f]"
            : "border-white text-white"
        }`}
      >
        {number}
      </div>
      <span className={`text-[16px] ${active ? "font-extrabold" : "font-medium"}`}>
        {label}
      </span>
    </div>
  );
}