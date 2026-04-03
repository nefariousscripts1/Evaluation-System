"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ScheduleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    isOpen: false,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }
    fetchSchedule();
  }, [status, session, router]);

  const fetchSchedule = async () => {
    const res = await fetch("/api/schedule");
    if (res.ok) {
      const data = await res.json();
      if (data) {
        setFormData({
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : "",
          isOpen: data.isOpen || false,
        });
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const academicYear = new Date().getFullYear() + "-" + (new Date().getFullYear() + 1);
    
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        academicYear: academicYear,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isOpen: formData.isOpen,
      }),
    });
    
    if (res.ok) {
      setMessage("Schedule saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Error saving schedule");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="px-5 py-6">
      <div className="mx-auto max-w-[500px]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold text-[#24135f]">Set Evaluation Schedule</h1>
        </div>

        {/* Form Card */}
        <div className="rounded-[18px] border border-[#dddddd] bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Start Date */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#24135f]">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="h-12 w-full rounded-lg border border-[#6c63a8] px-4 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#24135f]">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="h-12 w-full rounded-lg border border-[#6c63a8] px-4 text-sm outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
              />
            </div>

            {/* Evaluation Status */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-[#24135f]">
                Evaluation Status
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.isOpen === true}
                    onChange={() => setFormData({ ...formData, isOpen: true })}
                    className="w-4 h-4 text-[#24135f] focus:ring-[#24135f]"
                  />
                  <span className="text-sm text-gray-700">Open</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.isOpen === false}
                    onChange={() => setFormData({ ...formData, isOpen: false })}
                    className="w-4 h-4 text-[#24135f] focus:ring-[#24135f]"
                  />
                  <span className="text-sm text-gray-700">Closed</span>
                </label>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`rounded-lg p-3 text-sm ${
                message.includes("Error") 
                  ? "bg-red-50 text-red-600" 
                  : "bg-green-50 text-green-600"
              }`}>
                {message}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 h-12 w-full rounded-lg bg-[#24135f] text-[14px] font-bold text-white transition hover:bg-[#1a0f4a] disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}