"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, X } from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

export default function InstructorManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    departments: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    departments: [] as string[],
  });

  const departmentOptions = [
    { value: "CSM", label: "College of Science and Management (CSM)" },
    { value: "CTE", label: "College of Teacher and Education (CTE)" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "secretary") router.push("/unauthorized");
    fetchInstructors();
  }, [status, session, router]);

  const fetchInstructors = async () => {
    const res = await fetch("/api/instructors");
    const data = await res.json();
    setInstructors(data);
    setLoading(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      const res = await fetch(`/api/instructors?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchInstructors();
      } else {
        alert("Failed to delete instructor");
      }
    }
  };

  // Handle Add Instructor
  const handleDepartmentToggle = (deptValue: string) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(deptValue)
        ? prev.departments.filter(d => d !== deptValue)
        : [...prev.departments, deptValue]
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    if (formData.departments.length === 0) {
      setError("Please select at least one department");
      setFormLoading(false);
      return;
    }

    const departmentString = formData.departments.join(", ");

    const res = await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: departmentString,
        role: "faculty",
      }),
    });

    if (res.ok) {
      setIsAddModalOpen(false);
      setFormData({ name: "", email: "", password: "", departments: [] });
      fetchInstructors();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to add instructor");
      setFormLoading(false);
    }
  };

  // Handle Edit Instructor
  const openEditModal = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    // Parse departments from comma-separated string
    let departments: string[] = [];
    if (instructor.department) {
      departments = instructor.department.split(", ");
    }
    setEditFormData({
      name: instructor.name,
      email: instructor.email,
      departments: departments,
    });
    setIsEditModalOpen(true);
  };

  const handleEditDepartmentToggle = (deptValue: string) => {
    setEditFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(deptValue)
        ? prev.departments.filter(d => d !== deptValue)
        : [...prev.departments, deptValue]
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    if (editFormData.departments.length === 0) {
      setError("Please select at least one department");
      setFormLoading(false);
      return;
    }

    const departmentString = editFormData.departments.join(", ");

    const res = await fetch(`/api/instructors/${editingInstructor?.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editFormData.name,
        email: editFormData.email,
        department: departmentString,
        role: "faculty",
      }),
    });

    if (res.ok) {
      setIsEditModalOpen(false);
      setEditingInstructor(null);
      fetchInstructors();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to update instructor");
      setFormLoading(false);
    }
  };

  // Format department display
  const formatDepartment = (dept: string) => {
    const departments = dept.split(", ");
    if (departments.length === 2) return "CSM / CTE";
    return dept;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <main className="px-5 py-6">
        <div className="mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[28px] font-extrabold text-[#24135f]">Manage Instructors</h1>
          </div>

          {/* Add Instructor Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#1a0f4a] transition"
            >
              <Plus size={18} />
              Add Instructor
            </button>
          </div>

          {/* Table */}
          <div className="rounded-[18px] border border-[#dddddd] bg-white overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#24135f] text-white">
                <tr>
                  <th className="px-6 py-4 text-[16px] font-bold">Name</th>
                  <th className="px-6 py-4 text-[16px] font-bold">Department</th>
                  <th className="px-6 py-4 text-[16px] font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {instructors.length > 0 ? (
                  instructors.map((instructor) => (
                    <tr key={instructor.id} className="border-t border-[#ececec]">
                      <td className="px-6 py-4 text-[#3b3160] font-medium">
                        {instructor.name}
                      </td>
                      <td className="px-6 py-4 text-[#3b3160]">
                        {formatDepartment(instructor.department || "N/A")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openEditModal(instructor)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#24135f] text-white hover:bg-[#1a0f4a] transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(instructor.id, instructor.name || "Instructor")}
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
                      No instructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADD MODAL - Add Instructor */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-[550px] rounded-[18px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
              <h2 className="text-[20px] font-bold text-[#24135f]">Add Instructor</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#6c63a8] px-3 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                  placeholder="e.g., Dr. Arnel John Soriso"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#6c63a8] px-3 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                  placeholder="instructor@bisu.edu.ph"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#6c63a8] px-3 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                  placeholder="********"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Department (Select one or both)
                </label>
                <div className="space-y-2">
                  {departmentOptions.map((dept) => (
                    <label key={dept.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.departments.includes(dept.value)}
                        onChange={() => handleDepartmentToggle(dept.value)}
                        className="w-4 h-4 rounded border-[#6c63a8] text-[#24135f] focus:ring-[#24135f]"
                      />
                      <span className="text-sm text-gray-700">{dept.label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Select CSM, CTE, or both if the instructor handles both departments
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-[#24135f] text-white text-sm font-semibold hover:bg-[#1a0f4a] transition disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : "Save Instructor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL - Edit Instructor */}
      {isEditModalOpen && editingInstructor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-[550px] rounded-[18px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
              <h2 className="text-[20px] font-bold text-[#24135f]">Edit Instructor</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#6c63a8] px-3 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#6c63a8] px-3 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
                  Department (Select one or both)
                </label>
                <div className="space-y-2">
                  {departmentOptions.map((dept) => (
                    <label key={dept.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.departments.includes(dept.value)}
                        onChange={() => handleEditDepartmentToggle(dept.value)}
                        className="w-4 h-4 rounded border-[#6c63a8] text-[#24135f] focus:ring-[#24135f]"
                      />
                      <span className="text-sm text-gray-700">{dept.label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Select CSM, CTE, or both if the instructor handles both departments
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-[#24135f] text-white text-sm font-semibold hover:bg-[#1a0f4a] transition disabled:opacity-50"
                >
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}