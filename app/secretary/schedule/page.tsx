"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default function ScheduleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    status: "Open",
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
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().slice(0, 10)
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().slice(0, 10)
            : "",
          status: data.isOpen ? "Open" : "Closed",
        });
      }
    }
    setLoading(false);
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!ref.current) return;

    if (typeof ref.current.showPicker === "function") {
      ref.current.showPicker();
    } else {
      ref.current.focus();
      ref.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    const isOpen = formData.status === "Open";

    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        academicYear,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        isOpen,
      }),
    });

    if (res.ok) {
      setMessage("Schedule saved successfully!");
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Error saving schedule");
    }

    setSubmitting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-[#24135f]">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3] p-4">
      <div className="w-full max-w-[470px] overflow-hidden rounded-md border border-[#d9d9d9] bg-[#f3f3f3] shadow-sm">
        <div className="bg-[#24135f] px-6 py-6">
          <h1 className="text-center text-[22px] font-extrabold text-white sm:text-[24px]">
            Set Evaluation Schedule
          </h1>
        </div>

        <div className="px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <label className="mb-2 block text-[14px] font-bold text-[#24135f]">
                Start Date
              </label>
              <div className="relative">
                <input
                  ref={startDateRef}
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="h-[44px] w-full rounded-[8px] border border-[#5d4d93] bg-white px-4 pr-12 text-[15px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <button
                  type="button"
                  onClick={() => openPicker(startDateRef)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b2b2b]"
                  aria-label="Open start date calendar"
                >
                  <CalendarDays size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-bold text-[#24135f]">
                End Date
              </label>
              <div className="relative">
                <input
                  ref={endDateRef}
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="h-[44px] w-full rounded-[8px] border border-[#5d4d93] bg-white px-4 pr-12 text-[15px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <button
                  type="button"
                  onClick={() => openPicker(endDateRef)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b2b2b]"
                  aria-label="Open end date calendar"
                >
                  <CalendarDays size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[14px] font-bold text-[#24135f]">
                Evaluation Status
              </label>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    status: formData.status === "Open" ? "Closed" : "Open",
                  })
                }
                className="flex items-center gap-3"
              >
                <div
                  className={`relative h-[30px] w-[56px] rounded-full transition ${
                    formData.status === "Open" ? "bg-[#00d14f]" : "bg-[#cfcfcf]"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-white shadow transition-all ${
                      formData.status === "Open" ? "left-[30px]" : "left-[4px]"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 text-[16px] font-semibold">
                  <span
                    className={
                      formData.status === "Open"
                        ? "text-[#24135f]"
                        : "text-[#b0a8c9]"
                    }
                  >
                    Open
                  </span>
                  <span
                    className={
                      formData.status === "Closed"
                        ? "text-[#24135f]"
                        : "text-[#b0a8c9]"
                    }
                  >
                    Closed
                  </span>
                </div>
              </button>
            </div>

            {message && (
              <div
                className={`rounded-md px-4 py-3 text-sm ${
                  message.includes("Error")
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="h-[52px] w-full max-w-[260px] rounded-[6px] bg-[#24135f] text-[16px] font-bold text-white transition hover:bg-[#1b0f4d] disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}