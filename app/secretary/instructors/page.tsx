"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import InstructorsTable from "@/components/secretary/InstructorsTable";
import AddInstructorModal from "@/components/secretary/AddInstructorModal";
import EditInstructorModal from "@/components/secretary/EditInstructorModal";
import DeleteInstructorModal from "@/components/secretary/DeleteInstructorModal";

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
    fetchInstructors();
  }, [status, session, router]);

  const fetchInstructors = async () => {
    const res = await fetch("/api/instructors");
    const data: InstructorsResponse = await res.json();
    setInstructors(data.instructors ?? []);
    setActiveScheduleLabel(
      data.activeSchedule
        ? `${data.activeSchedule.academicYear} • ${data.activeSchedule.semester}`
        : ""
    );
    setLoading(false);
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
    fetchInstructors();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <main className="px-5 py-6">
        <div className="mx-auto max-w-[1200px]">
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
              className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#1a0f4a] transition"
            >
              <Plus size={18} />
              Add Instructor
            </button>
          </div>

          <InstructorsTable
            instructors={instructors}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
