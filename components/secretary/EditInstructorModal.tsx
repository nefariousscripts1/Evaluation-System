"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import AppMultiSelect from "@/components/ui/AppMultiSelect";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface EditInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructor: Instructor | null;
}

const departmentOptions = [
  { value: "CSM", label: "CSM", sublabel: "College of Science and Management" },
  { value: "CTE", label: "CTE", sublabel: "College of Teacher Education" },
  { value: "SAS", label: "SAS", sublabel: "School of Advanced Studies" },
];

export default function EditInstructorModal({
  isOpen,
  onClose,
  onSuccess,
  instructor,
}: EditInstructorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    departments: [] as string[],
  });

  useEffect(() => {
    if (instructor) {
      const departments = instructor.department ? instructor.department.split(", ") : [];
      setFormData({
        name: instructor.name,
        email: instructor.email,
        departments,
      });
    }
  }, [instructor]);

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

    try {
      const res = await fetch(`/api/instructors/${instructor?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          department: departmentString,
          role: "faculty",
        }),
      });

      await readApiResponse(res);
      onSuccess();
      onClose();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Failed to update instructor"));
      setLoading(false);
    }
  };

  if (!isOpen || !instructor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-[550px] rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
          <h2 className="text-[20px] font-bold text-[#24135f]">Edit Instructor</h2>
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
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#24135f]">
              Department
            </label>
            <AppMultiSelect
              values={formData.departments}
              onChange={(nextDepartments) =>
                setFormData({ ...formData, departments: nextDepartments })
              }
              options={departmentOptions}
              placeholder="Select one, two, or three departments"
              triggerClassName="min-h-[38px] rounded-[8px] border-[#6d63a3] px-3 py-2 text-[14px] shadow-none"
              menuClassName="rounded-[16px]"
            />
            <p className="mt-1 text-xs text-gray-400">
              You can select up to three departments for the same instructor
            </p>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</div>}

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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
