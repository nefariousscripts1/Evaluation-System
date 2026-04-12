"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Question {
  id: number;
  questionText: string;
  category: string;
  isActive: boolean;
}

export default function QuestionnaireManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    questionText: "",
    category: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }
    fetchQuestions();
  }, [status, session, router]);

  const fetchQuestions = async () => {
    const res = await fetch("/api/questionnaire");
    const data = await res.json();
    setQuestions(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    const url = editingQuestion ? `/api/questionnaire/${editingQuestion.id}` : "/api/questionnaire";
    const method = editingQuestion ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingQuestion(null);
      setFormData({ questionText: "", category: "" });
      fetchQuestions();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to save question");
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this question?")) {
      const res = await fetch(`/api/questionnaire/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuestions();
      } else {
        alert("Failed to delete question");
      }
    }
  };

  const openAddModal = () => {
    setEditingQuestion(null);
    setFormData({ questionText: "", category: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      questionText: question.questionText,
      category: question.category || "",
    });
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <main className="px-4 py-4 sm:px-5 sm:py-6">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[28px] font-extrabold text-[#24135f]">Manage Questionnaires</h1>
          </div>

          {/* Add Question Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#1a0f4a] transition"
            >
              <Plus size={18} />
              Add Question
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[18px] border border-[#dddddd] bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-[#24135f] text-white">
                <tr>
                  <th className="px-6 py-4 text-[16px] font-bold">Question</th>
                  <th className="px-6 py-4 text-[16px] font-bold">Category</th>
                  <th className="px-6 py-4 text-[16px] font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <tr key={question.id} className="border-t border-[#ececec]">
                      <td className="px-6 py-4 text-[#3b3160]">
                        {question.questionText}
                      </td>
                      <td className="px-6 py-4 text-[#3b3160]">
                        {question.category || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openEditModal(question)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#24135f] text-white hover:bg-[#1a0f4a] transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#ff2d2d] text-white hover:bg-[#cc0000] transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No questions found. Click "Add Question" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal - Add/Edit Question */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-[550px] rounded-[18px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
              <h2 className="text-[20px] font-bold text-[#24135f]">
                {editingQuestion ? "Edit Question" : "Add Question"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Question Text
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full rounded-lg border border-[#6c63a8] px-3 py-2 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                  placeholder="Enter your question here..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#6c63a8] px-3 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                  placeholder="e.g., Teaching, Behavior, Performance"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-[#24135f] text-white text-sm font-semibold hover:bg-[#1a0f4a] transition disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : editingQuestion ? "Update Question" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
