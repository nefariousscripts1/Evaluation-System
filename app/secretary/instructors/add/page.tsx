"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddInstructor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    role: "faculty",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      router.push("/secretary/instructors");
    } else {
      const data = await res.json();
      setError(data.message || "Failed to add instructor");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4">
      <div className="w-full max-w-[400px]">
        {/* Form Card */}
        <div className="rounded-[22px] border border-[#d9d9d9] bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#24135f] px-6 py-5">
            <h1 className="text-[20px] font-extrabold text-white text-center">
              Create User Account
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dr., Phd. Full Name"
                className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@bisu.edu.ph"
                className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
              />
            </div>

            {/* Select Role */}
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                Select Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
              >
                <option value="faculty">Faculty</option>
                <option value="chairperson">Chairperson</option>
                <option value="dean">Dean</option>
                <option value="director">Director of Instruction</option>
                <option value="campus_director">Campus Director</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e"
                className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Create Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-12 w-full rounded-[6px] bg-[#24135f] text-[14px] font-extrabold text-white transition hover:bg-[#1a0f4a] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>

            {/* Cancel Link */}
            <div className="text-center">
              <Link
                href="/secretary/instructors"
                className="text-[12px] text-[#24135f] hover:underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}