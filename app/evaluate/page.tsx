"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import RatingStars from "@/components/ui/RatingStars";

interface EvaluableUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
}

interface Question {
  id: number;
  questionText: string;
  category: string;
}

export default function EvaluatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<EvaluableUser[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedUser, setSelectedUser] = useState<EvaluableUser | null>(null);
  const [answers, setAnswers] = useState<Record<number, { rating: number; comment: string }>>({});
  const [academicYear, setAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    async function fetchData() {
      try {
        const yearRes = await fetch("/api/schedule/current");
        const yearData = await yearRes.json();
        setAcademicYear(yearData.academicYear || "2024-2025");
        setScheduleOpen(yearData.isOpen || false);

        const usersRes = await fetch("/api/evaluate/users");
        const usersData = await usersRes.json();
        setUsers(usersData);

        const questionsRes = await fetch("/api/questionnaire");
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.filter((q: Question) => q.isActive !== false));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchData();
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!scheduleOpen) {
      setError("Evaluation period is currently closed.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/evaluate/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluatedId: selectedUser.id,
          academicYear,
          answers: Object.entries(answers).map(([qId, { rating, comment }]) => ({
            questionId: parseInt(qId),
            rating,
            comment: comment || "",
          })),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push("/evaluate/success");
      } else {
        setError(data.message || "Submission failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!scheduleOpen) {
    return (
      <div className="max-w-3xl mx-auto text-center">
        <div className="rounded-lg bg-yellow-100 p-6">
          <h2 className="text-xl font-bold text-yellow-800">Evaluation Period Closed</h2>
          <p className="mt-2">The evaluation period is currently closed. Please wait for the next evaluation schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Faculty Evaluation</h1>
      {!selectedUser ? (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Select Person to Evaluate</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 p-2"
            onChange={(e) => {
              const user = users.find((u) => u.id === parseInt(e.target.value));
              setSelectedUser(user || null);
            }}
            value=""
          >
            <option value="">-- Select --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email} ({user.role})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold">Evaluating: {selectedUser.name || selectedUser.email}</h2>
            <p className="text-sm text-gray-500">Academic Year: {academicYear}</p>
          </div>

          {questions.map((q, index) => (
            <div key={q.id} className="rounded-lg bg-white p-6 shadow">
              <p className="font-medium">{index + 1}. {q.questionText}</p>
              <div className="mt-2">
                <RatingStars
                  value={answers[q.id]?.rating || 0}
                  onChange={(rating) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: { ...prev[q.id], rating },
                    }))
                  }
                />
              </div>
              <textarea
                placeholder="Optional comment"
                className="mt-2 w-full rounded-md border border-gray-300 p-2"
                rows={2}
                value={answers[q.id]?.comment || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id]: { ...prev[q.id], comment: e.target.value },
                  }))
                }
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-[#0F1F2B] disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Evaluation"}
          </button>
        </form>
      )}
    </div>
  );
}