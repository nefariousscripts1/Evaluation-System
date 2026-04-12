"use client";

import { Pencil, Trash2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number, name: string) => Promise<void>;
}

const rolesMap: Record<string, string> = {
  dean: "Dean",
  chairperson: "Chairperson",
  director: "Director of Instructions",
  campus_director: "Campus Director",
  faculty: "Faculty",
  secretary: "Secretary",
  student: "Student",
};

export default function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  const getRoleLabel = (roleValue: string) => {
    return rolesMap[roleValue] || roleValue;
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await onDelete(id, name);
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete user. Check console for details.");
      }
    }
  };

  return (
    <div className="overflow-x-auto rounded-[18px] border border-[#dddddd] bg-white">
      <table className="w-full min-w-[860px] text-left">
        <thead className="bg-[#24135f] text-white">
          <tr>
            <th className="px-6 py-4 text-[16px] font-bold">Name</th>
            <th className="px-6 py-4 text-[16px] font-bold">Email</th>
            <th className="px-6 py-4 text-[16px] font-bold">Role</th>
            <th className="px-6 py-4 text-[16px] font-bold">Department</th>
            <th className="px-6 py-4 text-[16px] font-bold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="border-t border-[#ececec]">
                <td className="px-6 py-4 text-[#3b3160]">{user.name}</td>
                <td className="px-6 py-4 text-[#3b3160]">{user.email}</td>
                <td className="px-6 py-4 text-[#3b3160]">{getRoleLabel(user.role)}</td>
                <td className="px-6 py-4 text-[#3b3160]">{user.department || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onEdit(user)}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#24135f] text-white hover:bg-[#1a0f4a] transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#ff2d2d] text-white hover:bg-[#cc0000] transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                No users found. Click "Create Account" to add one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
