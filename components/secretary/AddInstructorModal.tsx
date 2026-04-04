"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departmentOptions = [
  { value: "CSM", label: "College of Science and Management (CSM)" },
  { value: "CTE", label: "College of Teacher and Education (CTE)" },
];

export default function AddInstructorModal({ isOpen, onClose, onSuccess }: AddInstructorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    departments: [] as string[],
  });

  const handleDepartmentToggle = (deptValue: string) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(deptValue)
        ? prev.departments.filter(d => d !== deptValue)
        : [...prev.departments, deptValue]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.departments.length === 0) {
      setError("Please select at least one department");
      setLoading(false);
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
      setFormData({ name: "", email: "", password: "", departments: [] });
      onSuccess();
      onClose();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to add instructor");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-[550px] rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
          <h2 className="text-[20px] font-bold text-[#24135f]">Add Instructor</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#24135f] text-white text-sm font-semibold hover:bg-[#1a0f4a] transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Instructor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}