"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { getErrorMessage } from "@/lib/error-message";

type StudentRecord = {
  id: number;
  studentId: string | null;
  createdAt: string;
};

export default function StudentManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [studentIdInput, setStudentIdInput] = useState("");
  const errorMessage = error ? getErrorMessage(error) : "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }

    void fetchStudents();
  }, [status, session, router]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students", { cache: "no-store" });
      const data = await readApiResponse<StudentRecord[]>(res);
      setStudents(data);
    } catch (fetchError) {
      console.error("Student fetch error:", fetchError);
      setError(getApiErrorMessage(fetchError, "Failed to fetch student records"));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setStudentIdInput("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentRecord) => {
    setEditingStudent(student);
    setStudentIdInput(student.studentId || "");
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setStudentIdInput("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(
        editingStudent ? `/api/students/${editingStudent.id}` : "/api/students",
        {
          method: editingStudent ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: studentIdInput }),
        }
      );
      await readApiResponse(res);

      closeModal();
      await fetchStudents();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Failed to save student record"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) {
      return;
    }

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/students/${deletingStudent.id}`, {
        method: "DELETE",
      });
      await readApiResponse(res);

      setIsDeleteModalOpen(false);
      setDeletingStudent(null);
      await fetchStudents();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Failed to delete student record"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) =>
      (student.studentId || "").toLowerCase().includes(normalizedSearch)
    );
  }, [searchTerm, students]);

  if (loading) {
    return (
      <PortalPageLoader
        title="Student Management"
        description="Loading student access records and management tools..."
        cards={2}
      />
    );
  }

  return (
    <>
      <main className="app-page">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6">
            <h1 className="text-[28px] font-extrabold text-[#24135f]">Student Management</h1>
            <p className="mt-2 text-sm text-[#6c6684]">
              Manage student access records using Student ID only.
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={openCreateModal}
              className="app-btn-primary px-5 py-2.5 text-[14px]"
            >
              <Plus size={18} />
              Add Student ID
            </button>
          </div>

          <div className="mb-4 rounded-[22px] border border-[#dddddd] bg-white p-4 shadow-[0_14px_34px_rgba(36,19,95,0.06)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-[420px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Student ID"
                  className="app-input h-11 rounded-[14px] pl-10 text-[14px]"
                />
              </div>

              <p className="text-[13px] text-[#6c6684]">
                Showing{" "}
                <span className="font-bold text-[#24135f]">{filteredStudents.length}</span>{" "}
                student record{filteredStudents.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {error ? (
            <div className="app-alert-danger mb-4">
              {errorMessage}
            </div>
          ) : null}

          <div className="app-table-shell overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="app-table-head">
                <tr>
                  <th>Student ID</th>
                  <th>Date Added</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="app-table-row">
                      <td className="app-table-cell font-semibold">
                        {student.studentId || "N/A"}
                      </td>
                      <td className="app-table-cell">
                        {new Date(student.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="app-table-cell">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openEditModal(student)}
                            className="app-icon-btn h-9 w-9 border-0 bg-[#24135f] text-white hover:bg-[#1a0f4a] hover:text-white"
                            title="Edit Student ID"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingStudent(student);
                              setIsDeleteModalOpen(true);
                            }}
                            className="app-icon-btn h-9 w-9 border-0 bg-[#c53b4f] text-white hover:bg-[#a93042] hover:text-white"
                            title="Delete Student ID"
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
                      No student records matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen ? (
        <div className="app-modal-overlay">
          <div className="app-modal-card max-w-[420px]">
            <div className="bg-[#24135f] px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-extrabold text-white">
                  {editingStudent ? "Edit Student ID" : "Add Student ID"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 px-8 py-6">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="Enter Student ID"
                  className="app-input h-10 rounded-[12px] px-3 text-[14px] placeholder:text-[#9d98b8]"
                />
                <p className="mt-2 text-xs text-[#6c6684]">
                  Student IDs must be unique. Duplicate values will be rejected.
                </p>
              </div>

              {error ? (
                <div className="app-alert-danger text-xs">{errorMessage}</div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="app-btn-primary mt-2 h-12 w-full rounded-[12px] text-[14px]"
              >
                {submitting ? "Saving..." : editingStudent ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen && deletingStudent ? (
        <div className="app-modal-overlay">
          <div className="app-modal-card relative max-w-[400px]">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h2 className="text-[18px] font-bold text-[#24135f]">Delete Student Record</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="app-icon-btn h-8 w-8 border-0 shadow-none"
              >
                <X size={18} className="text-[#7b7498]" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-700">
                Delete Student ID{" "}
                <span className="font-bold text-[#24135f]">{deletingStudent.studentId}</span>?
              </p>
              <p className="mt-2 text-center text-sm text-gray-500">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="app-btn-secondary px-6 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="app-btn-danger px-6 py-2 text-sm"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
