"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import AppDatePicker from "@/components/ui/AppDatePicker";
import AppSelect from "@/components/ui/AppSelect";
import { getErrorMessage } from "@/lib/error-message";
import { buildAcademicYearOptions, SEMESTER_OPTIONS } from "@/lib/evaluation-session";

type ScheduleSummary = {
  id: number;
  academicYear: string;
  semester: string;
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
  announcement?: {
    delivered: boolean;
    provider: string;
    recipientCount: number;
  };
  message?: string;
};

type ScheduleFormState = {
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  status: string;
  scheduleId: number | null;
};

const academicYearOptions = buildAcademicYearOptions();

export default function ScheduleManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultsNotifyLoadingId, setResultsNotifyLoadingId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormState>({
    academicYear: academicYearOptions[academicYearOptions.length - 2] ?? academicYearOptions[0],
    semester: SEMESTER_OPTIONS[0],
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

    // Only fetch for authenticated secretary
    if (status === "authenticated" && session?.user?.role === "secretary") {
      void fetchSchedule();
    }
  }, [status, session?.user?.role, router]);

  const hydrateFromResponse = (data: ScheduleResponse) => {
    setActiveSchedule(data.activeSchedule);
    setRecentSchedules(data.recentSchedules ?? []);
    setSubmissionCount(data.submissionCount ?? 0);
    setSubmittedStudentIds(data.submittedStudentIds ?? []);

    if (data.activeSchedule) {
      setFormData({
        academicYear: data.activeSchedule.academicYear,
        semester: data.activeSchedule.semester,
        startDate: new Date(data.activeSchedule.startDate).toISOString().slice(0, 10),
        endDate: new Date(data.activeSchedule.endDate).toISOString().slice(0, 10),
        status: "Open",
        scheduleId: data.activeSchedule.id,
      });
      return;
    }

    const latest = data.recentSchedules?.[0];
    setFormData({
      academicYear: latest?.academicYear ?? academicYearOptions[academicYearOptions.length - 2] ?? academicYearOptions[0],
      semester: latest?.semester ?? SEMESTER_OPTIONS[0],
      startDate: latest?.startDate ? new Date(latest.startDate).toISOString().slice(0, 10) : "",
      endDate: latest?.endDate ? new Date(latest.endDate).toISOString().slice(0, 10) : "",
      status: "Closed",
      scheduleId: latest?.id ?? null,
    });
  };

  const fetchSchedule = async () => {
    console.log("🔍 fetchSchedule - status:", status, "role:", session?.user?.role);
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      
      const data = await res.json().catch(() => null);

      if (!data) {
        throw new Error(data?.error || `Schedule API failed (${res.status})`);
      }

      hydrateFromResponse(data);
      if (!res.ok && data.error) {
        setMessage(data.error);
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error("❌ Schedule fetch error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to load schedule data");
    } finally {
      setLoading(false);
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
          academicYear: formData.academicYear,
          semester: formData.semester,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isOpen: formData.status === "Open",
          scheduleId: formData.scheduleId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!data) {
        throw new Error(data?.error || "Error saving schedule");
      }

      hydrateFromResponse(data);
      const nextMessage =
        data.message === "Evaluation session is now open" && data.announcement
          ? data.announcement.delivered
            ? `${data.message}. Announcement sent to ${data.announcement.recipientCount} recipient(s) via ${data.announcement.provider}.`
            : `${data.message}. The session opened, but announcement email delivery is not configured yet.`
          : data.message || "Schedule saved successfully!";
      setMessage(nextMessage);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error saving schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccessCode = async () => {
    if (!activeSchedule?.accessCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeSchedule.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleNotifyResults = async (schedule: ScheduleSummary) => {
    setResultsNotifyLoadingId(schedule.id);
    setMessage("");

    try {
      const res = await fetch("/api/schedule/results-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: schedule.academicYear,
          semester: schedule.semester,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to send staff results notification");
      }

      setMessage(
        data?.announcement?.delivered
          ? `${data.message}. Sent to ${data.announcement.recipientCount} staff recipient(s) via ${data.announcement.provider}.`
          : "Staff results notification could not be delivered from this environment."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to send staff results notification"
      );
    } finally {
      setResultsNotifyLoadingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#24135f]">Loading...</div>;
  }

  return (
    <main className="px-4 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="rounded-[20px] border border-[#ddd7ee] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#24135f]">
                Evaluation Session Access
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6d6686]">
                Opening a session activates one Academic Year and Semester. Students first enter the
                shared portal access code, then use instructor codes generated per instructor for
                that period.
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
                  {activeSchedule.academicYear} • {activeSchedule.semester}
                </h2>
                <p className="mt-2 text-sm text-[#6d6686]">
                  {new Date(activeSchedule.startDate).toLocaleDateString("en-PH")} to{" "}
                  {new Date(activeSchedule.endDate).toLocaleDateString("en-PH")}
                </p>
                <p className="mt-3 text-sm font-semibold text-[#24135f]">
                  Portal Access Code:{" "}
                  <span className="rounded-full bg-[#f7f4ff] px-3 py-1 tracking-[0.16em]">
                    {activeSchedule.accessCode || "Unavailable"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={copyAccessCode}
                className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#24135f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1b0f4d]"
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy Portal Code"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-[18px] bg-[#f7fbf8] p-5">
                <p className="text-sm font-semibold text-[#18794e]">Student submissions</p>
                <p className="mt-2 text-3xl font-extrabold text-[#24135f]">{submissionCount}</p>
                <p className="mt-1 text-sm text-[#6d6686]">
                  Distinct student evaluation sessions recorded in the current period
                </p>
              </div>

              <div className="rounded-[18px] border border-[#ece7f7] bg-[#faf8ff] p-5">
                <p className="text-sm font-semibold text-[#24135f]">Instructor code management</p>
                <p className="mt-3 text-sm text-[#6d6686]">
                  Active instructor codes are available from Manage Instructors for this Academic
                  Year and Semester.
                </p>
                {submittedStudentIds.length > 0 ? (
                  <p className="mt-4 text-sm text-[#6d6686]">
                    Recent student activity includes: {submittedStudentIds.slice(0, 8).join(", ")}
                    {submittedStudentIds.length > 8 ? "..." : ""}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-[#6d6686]">
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
              Keep the status on Open to create or update the active evaluation period. Switch to
              Closed to end the current Academic Year and Semester session and invalidate all
              related instructor codes.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <AcademicYearSelect
                value={formData.academicYear}
                options={academicYearOptions}
                onChange={(value) => setFormData((current) => ({ ...current, academicYear: value }))}
                className="items-start"
              />

              <div>
                <label className="mb-2 block text-[14px] font-bold text-[#24135f]">Semester</label>
                <AppSelect
                  value={formData.semester}
                  onChange={(nextValue) => setFormData({ ...formData, semester: nextValue })}
                  options={SEMESTER_OPTIONS.map((option) => ({ value: option, label: option }))}
                  triggerClassName="min-h-[46px] rounded-[12px] text-[15px]"
                />
              </div>

              <div>
                <AppDatePicker
                  label="Start Date"
                  required
                  value={formData.startDate}
                  onChange={(nextValue) =>
                    setFormData((current) => ({
                      ...current,
                      startDate: nextValue,
                      endDate:
                        current.endDate && nextValue && current.endDate < nextValue
                          ? nextValue
                          : current.endDate,
                    }))
                  }
                />
              </div>

              <div>
                <AppDatePicker
                  label="End Date"
                  required
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(nextValue) =>
                    setFormData((current) => ({ ...current, endDate: nextValue }))
                  }
                />
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
                    messageText.toLowerCase().includes("error") ||
                    messageText.toLowerCase().includes("invalid")
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
                {submitting
                  ? "Saving..."
                  : formData.status === "Open"
                  ? "Save Session"
                  : "Close Session"}
              </button>
            </form>

          </section>

          <section className="rounded-[20px] border border-[#ddd7ee] bg-white p-6 shadow-sm">
            <h2 className="text-[22px] font-extrabold text-[#24135f]">Recent Sessions</h2>
            <p className="mt-2 text-sm text-[#6d6686]">
              Every new opening creates a separate Academic Year and Semester session record.
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
                        <p className="text-sm font-bold text-[#24135f]">
                          {schedule.academicYear} • {schedule.semester}
                        </p>
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
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-[#6d6686]">
                        Send a private email to faculty when their results for this session are ready.
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleNotifyResults(schedule)}
                        disabled={resultsNotifyLoadingId === schedule.id}
                        className="inline-flex items-center justify-center rounded-[12px] border border-[#d8d2e6] bg-white px-4 py-2 text-sm font-bold text-[#24135f] transition hover:bg-[#f7f4ff] disabled:opacity-50"
                      >
                        {resultsNotifyLoadingId === schedule.id
                          ? "Sending..."
                          : "Notify Staff Results"}
                      </button>
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
