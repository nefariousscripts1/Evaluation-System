"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CalendarDays, Copy, RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/lib/error-message";

type ScheduleSummary = {
  id: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  accessCode: string | null;
  createdAt: string;
};

type ScheduleResponse = {
  activeSchedule: ScheduleSummary | null;
  recentSchedules: ScheduleSummary[];
  submissionCount: number;
  submittedStudentIds: string[];
};

export default function ScheduleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    status: "Closed",
    scheduleId: null as number | null,
  });
  const [activeSchedule, setActiveSchedule] = useState<ScheduleSummary | null>(null);
  const [recentSchedules, setRecentSchedules] = useState<ScheduleSummary[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [submittedStudentIds, setSubmittedStudentIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const messageText = message ? getErrorMessage(message) : "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }
    void fetchSchedule();
  }, [status, session, router]);

  const hydrateFromResponse = (data: ScheduleResponse) => {
    setActiveSchedule(data.activeSchedule);
    setRecentSchedules(data.recentSchedules ?? []);
    setSubmissionCount(data.submissionCount ?? 0);
    setSubmittedStudentIds(data.submittedStudentIds ?? []);

    if (data.activeSchedule) {
      setFormData({
        startDate: new Date(data.activeSchedule.startDate).toISOString().slice(0, 10),
        endDate: new Date(data.activeSchedule.endDate).toISOString().slice(0, 10),
        status: "Open",
        scheduleId: data.activeSchedule.id,
      });
    } else {
      const latest = data.recentSchedules?.[0];
      setFormData({
        startDate: latest?.startDate
          ? new Date(latest.startDate).toISOString().slice(0, 10)
          : "",
        endDate: latest?.endDate ? new Date(latest.endDate).toISOString().slice(0, 10) : "",
        status: "Closed",
        scheduleId: latest?.id ?? null,
      });
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load schedule");
      }

      hydrateFromResponse(data);
    } catch (error) {
      console.error("Schedule fetch error:", error);
      setMessage("Error loading schedule data");
    } finally {
      setLoading(false);
    }
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
    setMessage("");

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          isOpen: formData.status === "Open",
          scheduleId: formData.scheduleId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error saving schedule");
      }

      hydrateFromResponse(data);
      setMessage(data.message || "Schedule saved successfully!");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error saving schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccessCode = async () => {
    if (!activeSchedule?.accessCode) return;

    try {
      await navigator.clipboard.writeText(activeSchedule.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#24135f]">Loading...</div>;
  }

  return (
    <main className="px-4 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <div className="rounded-[20px] border border-[#ddd7ee] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#24135f]">Evaluation Session Access</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6d6686]">
                Opening a session generates a new student access code. Closing the session makes
                that code invalid immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchSchedule()}
              className="inline-flex items-center gap-2 rounded-full border border-[#d5d0e4] px-4 py-2 text-sm font-semibold text-[#24135f] transition hover:bg-[#f7f4ff]"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {activeSchedule ? (
          <section className="rounded-[20px] border border-[#dbeadf] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#18794e]">
                  Active Session
                </p>
                <h2 className="mt-2 text-[24px] font-extrabold text-[#24135f]">
                  Student Access Code: {activeSchedule.accessCode}
                </h2>
                <p className="mt-2 text-sm text-[#6d6686]">
                  {new Date(activeSchedule.startDate).toLocaleDateString("en-PH")} to{" "}
                  {new Date(activeSchedule.endDate).toLocaleDateString("en-PH")} •{" "}
                  {activeSchedule.academicYear}
                </p>
              </div>

              <button
                type="button"
                onClick={copyAccessCode}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#24135f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1b0f4d]"
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-[18px] bg-[#f7fbf8] p-5">
                <p className="text-sm font-semibold text-[#18794e]">Student submissions</p>
                <p className="mt-2 text-3xl font-extrabold text-[#24135f]">{submissionCount}</p>
                <p className="mt-1 text-sm text-[#6d6686]">
                  Distinct Student IDs recorded in the current session
                </p>
              </div>

              <div className="rounded-[18px] border border-[#ece7f7] bg-[#faf8ff] p-5">
                <p className="text-sm font-semibold text-[#24135f]">Submitted Student IDs</p>
                {submittedStudentIds.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submittedStudentIds.map((studentId) => (
                      <span
                        key={studentId}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#24135f] shadow-sm"
                      >
                        {studentId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#6d6686]">
                    No student submissions recorded yet for this session.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[20px] border border-[#ddd7ee] bg-white p-6 shadow-sm">
            <h2 className="text-[22px] font-extrabold text-[#24135f]">Open or Close Session</h2>
            <p className="mt-2 text-sm text-[#6d6686]">
              Keep the status on Open to create a new session or update the active one. Switch to
              Closed to end the active session and invalidate its access code.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-[14px] font-bold text-[#24135f]">Start Date</label>
                <div className="relative">
                  <input
                    ref={startDateRef}
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="h-[46px] w-full rounded-[12px] border border-[#cfc8e2] bg-white px-4 pr-12 text-[15px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] [&::-webkit-calendar-picker-indicator]:opacity-0"
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
                <label className="mb-2 block text-[14px] font-bold text-[#24135f]">End Date</label>
                <div className="relative">
                  <input
                    ref={endDateRef}
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="h-[46px] w-full rounded-[12px] border border-[#cfc8e2] bg-white px-4 pr-12 text-[15px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] [&::-webkit-calendar-picker-indicator]:opacity-0"
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
                    setFormData((current) => ({
                      ...current,
                      status: current.status === "Open" ? "Closed" : "Open",
                    }))
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
                      className={formData.status === "Open" ? "text-[#24135f]" : "text-[#b0a8c9]"}
                    >
                      Open
                    </span>
                    <span
                      className={formData.status === "Closed" ? "text-[#24135f]" : "text-[#b0a8c9]"}
                    >
                      Closed
                    </span>
                  </div>
                </button>
              </div>

              {message ? (
                <div
                  className={`rounded-md px-4 py-3 text-sm ${
                    messageText.toLowerCase().includes("error") || messageText.toLowerCase().includes("invalid")
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {messageText}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="h-[52px] w-full rounded-[12px] bg-[#24135f] text-[16px] font-bold text-white transition hover:bg-[#1b0f4d] disabled:opacity-50"
              >
                {submitting ? "Saving..." : formData.status === "Open" ? "Save Session" : "Close Session"}
              </button>
            </form>
          </section>

          <section className="rounded-[20px] border border-[#ddd7ee] bg-white p-6 shadow-sm">
            <h2 className="text-[22px] font-extrabold text-[#24135f]">Recent Sessions</h2>
            <p className="mt-2 text-sm text-[#6d6686]">
              Every new opening creates a separate access code and session record.
            </p>

            <div className="mt-6 space-y-3">
              {recentSchedules.length > 0 ? (
                recentSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-[16px] border border-[#ece7f7] bg-[#faf8ff] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#24135f]">{schedule.academicYear}</p>
                        <p className="mt-1 text-sm text-[#6d6686]">
                          {new Date(schedule.startDate).toLocaleDateString("en-PH")} to{" "}
                          {new Date(schedule.endDate).toLocaleDateString("en-PH")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span
                          className={`rounded-full px-3 py-1 ${
                            activeSchedule?.id === schedule.id
                              ? "bg-[#eaf8ee] text-[#18794e]"
                              : "bg-white text-[#5b5576]"
                          }`}
                        >
                          {activeSchedule?.id === schedule.id ? "Active" : "Closed"}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-[#24135f]">
                          Code: {schedule.accessCode || "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-[#d6d0e7] bg-[#faf8ff] p-6 text-sm text-[#6d6686]">
                  No sessions have been created yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
