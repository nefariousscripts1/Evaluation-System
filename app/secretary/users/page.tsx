"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, X, AlertTriangle, Pencil, Trash2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
}

const roles = [
  { label: "Dean", value: "dean" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Director of Instructions", value: "director" },
  { label: "Campus Director", value: "campus_director" },
  { label: "Faculty", value: "faculty" },
  { label: "Secretary", value: "secretary" },
];

export default function UsersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "faculty",
    department: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }
    fetchUsers();
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "faculty", department: "" });
    setError("");
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "faculty", department: "" });
  };

  // Delete with custom modal
  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    
    setDeleteLoading(true);
    const res = await fetch(`/api/users/${deletingUser.id}`, { method: "DELETE" });
    
    if (res.ok) {
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } else {
      alert("Failed to delete user");
    }
    setDeleteLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save user");
      }

      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleLabel = (roleValue: string) => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <main className="px-5 py-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6">
            <h1 className="text-[28px] font-extrabold text-[#24135f]">Users Management</h1>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={handleAddUser}
              className="inline-flex items-center gap-2 rounded-full bg-[#24135f] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#1a0f4a] transition"
            >
              <Plus size={18} />
              Create Account
            </button>
          </div>

          {/* Users Table */}
          <div className="rounded-[18px] border border-[#dddddd] bg-white overflow-hidden">
            <table className="w-full text-left">
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
                            onClick={() => handleEditUser(user)}
                            className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#24135f] text-white hover:bg-[#1a0f4a] transition"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
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
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No users found. Click "Create Account" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-[400px] rounded-[22px] border border-[#d9d9d9] bg-white shadow-sm overflow-hidden">
            <div className="bg-[#24135f] px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-extrabold text-white">
                  {editingUser ? "Edit User Account" : "Create User Account"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                  Select Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f]"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                  Name
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

              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., CSM, CTE, CAS"
                  className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="mt-2 h-12 w-full rounded-[6px] bg-[#24135f] text-[14px] font-extrabold text-white transition hover:bg-[#1a0f4a] disabled:opacity-50"
              >
                {formLoading ? "Saving..." : editingUser ? "Update" : "Create"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-[12px] text-[#24135f] hover:underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-[400px] rounded-[18px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h2 className="text-[18px] font-bold text-[#24135f]">Delete User</h2>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-700">
                Are you sure you want to delete <br />
                <span className="font-bold text-[#24135f]">{deletingUser.name}</span>?
              </p>
              <p className="mt-2 text-center text-sm text-gray-500">
                This action cannot be undone.
              </p>

              <div className="flex justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}