"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

export default function EditInstructor() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
  });
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const departmentOptions = [
    { value: "CSM", label: "College of Science and Mathematics (CSM)" },
    { value: "CTE", label: "College of Teacher Education (CTE)" },
  ];

  useEffect(() => {
    fetchInstructor();
  }, [id]);

  const fetchInstructor = async () => {
    const res = await fetch(`/api/instructors/${id}`);
    if (res.ok) {
      const data = await res.json();
      setFormData({
        name: data.name || "",
        email: data.email || "",
        department: data.department || "",
      });
      // Parse departments from comma-separated string
      if (data.department) {
        setSelectedDepartments(data.department.split(", "));
      }
    }
    setLoading(false);
  };

  const handleDepartmentToggle = (deptValue: string) => {
    setSelectedDepartments(prev =>
      prev.includes(deptValue)
        ? prev.filter(d => d !== deptValue)
        : [...prev, deptValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (selectedDepartments.length === 0) {
      setError("Please select at least one department");
      setSubmitting(false);
      return;
    }

    const departmentString = selectedDepartments.join(", ");

    const res = await fetch(`/api/instructors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        department: departmentString,
        role: "faculty",
      }),
    });

    if (res.ok) {
      router.push("/secretary/instructors");
    } else {
      const data = await res.json();
      setError(data.message || "Failed to update instructor");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="px-5 py-6">
      <div className="mx-auto max-w-[600px]">
        <div className="mb-6">
          <Link
            href="/secretary/instructors"
            className="inline-flex items-center gap-2 text-[#24135f] hover:underline mb-4"
          >
            <ArrowLeft size={18} />
            Back to Instructors
          </Link>
          <h1 className="text-[28px] font-extrabold text-[#24135f]">Edit Instructor</h1>
        </div>

        <div className="rounded-[18px] border border-[#dddddd] bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#24135f]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 w-full rounded-lg border border-[#6c63a8] px-4 text-sm outline-none focus:border-[#24135f]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#24135f]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 w-full rounded-lg border border-[#6c63a8] px-4 text-sm outline-none focus:border-[#24135f]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#24135f]">
                Department (Select one or both)
              </label>
              <div className="space-y-2">
                {departmentOptions.map((dept) => (
                  <label key={dept.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(dept.value)}
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/secretary/instructors"
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-[#24135f] text-white font-semibold hover:bg-[#1a0f4a] transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}