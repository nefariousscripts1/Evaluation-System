"use client";

import { Pencil, Trash2 } from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface InstructorsTableProps {
  instructors: Instructor[];
  onEdit: (instructor: Instructor) => void;
  onDelete: (instructor: Instructor) => void;
}

const formatDepartment = (dept: string) => {
  const departments = dept.split(", ");
  if (departments.length === 2) return "CSM / CTE";
  return dept;
};

export default function InstructorsTable({ instructors, onEdit, onDelete }: InstructorsTableProps) {
  return (
    <div className="rounded-[18px] border border-[#dddddd] bg-white overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-[#24135f] text-white">
          <tr>
            <th className="px-6 py-4 text-[16px] font-bold">Name</th>
            <th className="px-6 py-4 text-[16px] font-bold">Email</th>
            <th className="px-6 py-4 text-[16px] font-bold">Department</th>
            <th className="px-6 py-4 text-[16px] font-bold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {instructors.length > 0 ? (
            instructors.map((instructor) => (
              <tr key={instructor.id} className="border-t border-[#ececec]">
                <td className="px-6 py-4 text-[#3b3160] font-medium">
                  {instructor.name}
                </td>
                <td className="px-6 py-4 text-[#3b3160]">
                  {instructor.email}
                </td>
                <td className="px-6 py-4 text-[#3b3160]">
                  {formatDepartment(instructor.department || "N/A")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onEdit(instructor)}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#24135f] text-white hover:bg-[#1a0f4a] transition"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(instructor)}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#ff2d2d] text-white hover:bg-[#cc0000] transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                No instructors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}