"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import AddInstructorModal from "@/components/secretary/AddInstructorModal";
import DeleteInstructorModal from "@/components/secretary/DeleteInstructorModal";
import EditInstructorModal from "@/components/secretary/EditInstructorModal";
import InstructorsTable from "@/components/secretary/InstructorsTable";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  activeInstructorCode: string | null;
}

type InstructorsResponse = {
  activeSchedule: {
    id: number;
    academicYear: string;
    semester: string;
  } | null;
  instructors: Instructor[];
};

export default function InstructorManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [activeScheduleLabel, setActiveScheduleLabel] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }

    if (status === "authenticated" && session?.user?.role === "secretary") {
      void fetchInstructors();
    }
  }, [status, session?.user?.role, router]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/instructors", { cache: "no-store" });
      const data = await readApiResponse<InstructorsResponse>(res);

      setInstructors(data.instructors ?? []);
      setActiveScheduleLabel(
        data.activeSchedule
          ? `${data.activeSchedule.academicYear} • ${data.activeSchedule.semester}`
          : ""
      );
    } catch (fetchError) {
      console.error("Instructor fetch error:", fetchError);
      setInstructors([]);
      setActiveScheduleLabel("");
      setError(getApiErrorMessage(fetchError, "Failed to load instructor records"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setIsEditModalOpen(true);
  };

  const handleDelete = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setIsDeleteModalOpen(true);
  };

  const handleSuccess = () => {
    void fetchInstructors();
  };

  if (loading) {
    return (
      <PortalPageLoader
        title="Manage Instructors"
        description="Loading instructor profiles, departments, and active codes..."
        cards={2}
      />
    );
  }

  return (
    <>
      <main className="app-page">
        <div className="app-page-card">
          <div className="mb-6">
            <h1 className="text-[28px] font-extrabold text-[#24135f]">Manage Instructors</h1>
            <p className="mt-2 text-sm text-[#6f678d]">
              {activeScheduleLabel
                ? `Active instructor codes are shown for ${activeScheduleLabel}.`
                : "Open an evaluation schedule to generate instructor codes for the current period."}
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#1a0f4a]"
            >
              <Plus size={18} />
              Add Instructor
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <InstructorsTable instructors={instructors} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </main>

      <AddInstructorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditInstructorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedInstructor(null);
        }}
        onSuccess={handleSuccess}
        instructor={selectedInstructor}
      />

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
