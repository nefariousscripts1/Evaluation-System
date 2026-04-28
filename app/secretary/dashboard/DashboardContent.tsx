"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Copy,
  Home,
  Monitor,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import EditInstructorModal from "@/components/secretary/EditInstructorModal";
import DeleteInstructorModal from "@/components/secretary/DeleteInstructorModal";

type ScheduleSummary = {
  id: number;
  academicYear?: string | null;
  semester?: string | null;
  startDate: string | null;
  endDate: string | null;
  isOpen?: boolean;
  isActiveNow: boolean;
  accessCode?: string | null;
};

type Props = {
  totalStudents: number;
  totalFaculty: number;
  totalQuestionnaires: number;
  displaySchedules: ScheduleSummary[];
  latestQuestionnaires: any[];
  latestFaculty: any[];
};

// Date formatting functions
const formatDate = (date: string | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCompactDate = (date: string | null) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function DashboardContent({
  totalStudents,
  totalFaculty,
  totalQuestionnaires,
  displaySchedules,
  latestQuestionnaires,
  latestFaculty,
}: Props) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleEdit = (instructor: any) => {
    setSelectedInstructor(instructor);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (instructor: any) => {
    setSelectedInstructor(instructor);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInstructor) return;
    
    const res = await fetch(`/api/instructors?id=${selectedInstructor.id}`, { method: "DELETE" });
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setSelectedInstructor(null);
      router.refresh();
    } else {
      alert("Failed to delete instructor");
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const copyAccessCode = async () => {
    if (!activeSchedule?.accessCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeSchedule.accessCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // Check if there's an open schedule
  const hasOpenSchedule = displaySchedules.some(
    (schedule) => schedule.isActiveNow === true
  );
  const activeSchedule = displaySchedules.find(
    (schedule) => schedule.isActiveNow === true
  );

  return (
    <>
      <main className="px-4 py-4 sm:px-5 sm:py-6">
        <div className="mx-auto max-w-[1750px] space-y-4">
          {/* Welcome Header */}
          <div className="rounded-[18px] border border-[#dddddd] bg-white px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[10px] bg-[#24135f] text-white shadow-md">
                <Home size={30} />
              </div>
              <div>
                <h1 className="text-[28px] font-extrabold leading-none text-[#24135f]">
                  Dashboard Overview
                </h1>
                <p className="mt-1 text-[16px] leading-none text-[#2f2f2f]">
                  Welcome to the Digital Evaluation System
                </p>
              </div>
            </div>
          </div>

          {/* Evaluation Period Alert - Only show if schedule is OPEN */}
          {hasOpenSchedule && activeSchedule && (
            <div className="rounded-[12px] bg-[#24135f] px-4 py-5 text-white">
              <p className="text-[14px] font-extrabold">✅ Evaluation Period is Active</p>
              <p className="text-[14px]">
                Users can submit evaluations until{" "}
                {activeSchedule?.endDate
                  ? formatCompactDate(activeSchedule.endDate)
                  : "No date set"}
              </p>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Users size={34} />}
              title="Total Students"
              value={totalStudents}
              subtitle="Active Accounts"
            />
            <StatCard
              icon={<User size={34} />}
              title="Instructors"
              value={totalFaculty}
              subtitle="Assigned"
            />
            <StatCard
              icon={<Monitor size={34} />}
              title="Questionnaires"
              value={totalQuestionnaires}
              subtitle="Active"
            />
            <StatCard
              icon={<Calendar size={34} />}
              title="Evaluation Periods"
              value={displaySchedules.length}
              subtitle="Total Schedules"
            />
          </div>

          {/* Evaluation Schedule Section */}
          <section className="rounded-[18px] border border-[#dddddd] bg-white px-4 py-10">
            <h2 className="text-[16px] font-extrabold text-[#24135f]">
              Evaluation Session
            </h2>

            {activeSchedule?.accessCode ? (
              <div className="mt-5 flex flex-col gap-3 rounded-[16px] border border-[#ece7f7] bg-[#faf8ff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#18794e]">
                    Active Session
                  </p>
                  <p className="mt-2 text-[14px] font-bold text-[#24135f]">
                    Portal Access Code:{" "}
                    <span className="rounded-full bg-white px-3 py-1 tracking-[0.18em]">
                      {activeSchedule.accessCode}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyAccessCode}
                  className="inline-flex min-w-[200px] self-end items-center justify-center gap-2 rounded-full bg-[#24135f] px-5 py-3 text-[14px] font-extrabold text-white transition hover:bg-[#1a0f4a] sm:self-auto"
                >
                  <Copy size={16} />
                  {copied ? "Copied" : "Copy Portal Code"}
                </button>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-4 rounded-[16px] border border-[#ece7f7] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full">
                <div className="grid gap-4 md:grid-cols-2">
                  {displaySchedules.length > 0 ? (
                    displaySchedules.map((schedule, index) => (
                      <div
                        key={schedule.id}
                        className={`px-2 text-[14px] ${
                          index === 0 && displaySchedules.length > 1
                            ? "md:border-r md:border-[#8d87a8]"
                            : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <p>
                            <span className="font-bold text-[#24135f]">Start Date:</span>{" "}
                            <span className="text-[#3c305e]">
                              {formatDate(schedule.startDate)}
                            </span>
                          </p>
                          <p>
                            <span className="font-bold text-[#24135f]">End Date:</span>{" "}
                            <span className="text-[#3c305e]">
                              {formatDate(schedule.endDate)}
                            </span>
                          </p>
                          <p>
                            <span className="font-bold text-[#24135f]">Status:</span>{" "}
                            <span className={`font-bold ${
                              schedule.isActiveNow ? "text-green-600" : "text-red-600"
                            }`}>
                              {schedule.isActiveNow ? "Open" : "Closed"}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No evaluation schedule found. Please set a schedule.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 justify-end">
                <Link
                  href="/secretary/schedule"
                  className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full bg-[#24135f] px-8 py-3 text-[14px] font-extrabold text-white transition hover:bg-[#1a0f4a]"
                >
                  <Pencil size={16} />
                  Edit Schedule
                </Link>
              </div>
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Questionnaires Section */}
            <section className="rounded-[18px] border border-[#dddddd] bg-white px-4 py-4">
              <h2 className="mb-4 text-[16px] font-extrabold text-[#24135f]">
                Questionnaires
              </h2>

              <div className="overflow-x-auto rounded-[6px] border border-[#e1e1e1]">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="bg-[#24135f] text-white">
                    <tr>
                      <th className="px-5 py-3 font-bold">Title</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                      <th className="px-5 py-3 font-bold">Date Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {latestQuestionnaires.length > 0 ? (
                      latestQuestionnaires.slice(0, 5).map((item) => (
                        <tr key={item.id} className="border-t border-[#ececec]">
                          <td className="px-5 py-3 font-semibold text-[#24135f]">
                            {item.questionText.length > 50
                              ? item.questionText.substring(0, 50) + "..."
                              : item.questionText}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex rounded-[8px] px-2 py-1 text-[12px] font-bold text-white ${
                                item.isActive ? "bg-[#12c94b]" : "bg-[#ff1f1f]"
                              }`}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-[#24135f]">
                            {formatCompactDate(item.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-5 py-6 text-center text-gray-500">
                          No questionnaires found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  href="/secretary/questionnaire"
                  className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-7 py-3 text-[14px] font-extrabold text-white hover:bg-[#1a0f4a] transition"
                >
                  <Plus size={18} />
                  Add Questionnaires
                </Link>
              </div>
            </section>

            {/* Instructor Management Section */}
            <section className="rounded-[18px] border border-[#dddddd] bg-white px-4 py-4">
              <h2 className="mb-4 text-[16px] font-extrabold text-[#24135f]">
                Instructor Management
              </h2>

              <div className="overflow-x-auto rounded-[6px] border border-[#e1e1e1]">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="bg-[#24135f] text-white">
                    <tr>
                      <th className="px-5 py-3 font-bold">Name</th>
                      <th className="px-5 py-3 font-bold">Email</th>
                      <th className="px-5 py-3 font-bold">Department</th>
                      <th className="px-5 py-3 text-center font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {latestFaculty.length > 0 ? (
                      latestFaculty.map((faculty) => (
                        <tr key={faculty.id} className="border-t border-[#ececec]">
                          <td className="px-5 py-3 text-[#3b3160]">{faculty.name}</td>
                          <td className="px-5 py-3 text-[#3b3160]">{faculty.email}</td>
                          <td className="px-5 py-3 text-[#3b3160]">
                            {faculty.department || "N/A"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(faculty)}
                                className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#24135f] text-white hover:bg-[#1a0f4a] transition"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(faculty)}
                                className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#ff2d2d] text-white hover:bg-[#cc0000] transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                          No instructors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <Link
                  href="/secretary/instructors"
                  className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-7 py-3 text-[14px] font-extrabold text-white hover:bg-[#1a0f4a] transition"
                >
                  <Plus size={18} />
                  Add Instructor
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Edit Instructor Modal */}
      <EditInstructorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInstructor(null);
        }}
        onSuccess={handleSuccess}
        instructor={selectedInstructor}
      />

      {/* Delete Instructor Modal */}
      <DeleteInstructorModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedInstructor(null);
        }}
        onSuccess={handleSuccess}
        instructor={selectedInstructor}
      />
    </>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#dddddd] bg-white px-6 py-10">
      <div className="flex items-center gap-4">
        <div className="text-[#24135f]">{icon}</div>
        <div>
          <p className="text-[14px] font-extrabold leading-none text-[#24135f]">
            {title}
          </p>
          <p className="mt-1 text-[18px] font-extrabold leading-none text-[#24135f]">
            {value}
          </p>
          <p className="mt-1 text-[14px] leading-none text-[#3f3562]">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
