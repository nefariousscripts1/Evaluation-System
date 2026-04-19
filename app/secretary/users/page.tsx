"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, X, AlertTriangle, Pencil, Trash2, Search } from "lucide-react";
import AppSelect from "@/components/ui/AppSelect";
import AppMultiSelect from "@/components/ui/AppMultiSelect";
import { getErrorMessage } from "@/lib/error-message";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  department: string | null;
}

const formRoles = [
  { label: "Dean", value: "dean" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Director of Instructions", value: "director" },
  { label: "Campus Director", value: "campus_director" },
  { label: "Faculty", value: "faculty" },
  { label: "Secretary", value: "secretary" },
];

const roleFilterOptions = [
  { label: "All Roles", value: "all" },
  { label: "Faculty", value: "faculty" },
  { label: "Chairpersons", value: "chairperson" },
  { label: "Deans", value: "dean" },
  { label: "Directors", value: "director" },
  { label: "Campus Directors", value: "campus_director" },
  { label: "Secretaries", value: "secretary" },
];

const roleLabels: Record<string, string> = {
  faculty: "Faculty",
  chairperson: "Chairperson",
  dean: "Dean",
  director: "Director of Instructions",
  campus_director: "Campus Director",
  secretary: "Secretary",
};

const departmentOptions = [
  { label: "CSM", value: "CSM", sublabel: "College of Science and Management" },
  { label: "CTE", value: "CTE", sublabel: "College of Teacher Education" },
  { label: "SAS", value: "SAS", sublabel: "School of Advanced Studies" },
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
  const [selectedRole, setSelectedRole] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "faculty",
    departments: [] as string[],
  });
  const errorMessage = error ? getErrorMessage(error) : "";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "secretary") {
      router.push("/unauthorized");
      return;
    }
    void fetchUsers();
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "faculty", departments: [] });
    setError("");
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role,
      departments: user.department
        ? user.department.split(", ").filter(Boolean)
        : [],
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "faculty", departments: [] });
  };

  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete user");
      }

      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      await fetchUsers();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";
    const department = formData.departments.length > 0 ? formData.departments.join(", ") : null;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          department,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save user");
      }

      handleCloseModal();
      await fetchUsers();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save user");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        (user.name || "").toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [searchTerm, selectedRole, users]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      <main className="app-page">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6">
            <h1 className="text-[28px] font-extrabold text-[#24135f]">Users Management</h1>
            <p className="mt-2 text-sm text-[#6c6684]">
              Manage staff accounts only. Student IDs are handled in Student Management.
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <button
              onClick={handleAddUser}
              className="app-btn-primary px-5 py-2.5 text-[14px]"
            >
              <Plus size={18} />
              Create Account
            </button>
          </div>

          <div className="mb-4 rounded-[22px] border border-[#dddddd] bg-white p-4 shadow-[0_14px_34px_rgba(36,19,95,0.06)] sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="relative w-full max-w-[420px]">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email"
                  className="app-input h-11 rounded-[14px] pl-10 text-[14px]"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {roleFilterOptions.map((role) => {
                  const isActive = selectedRole === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold transition ${
                        isActive
                          ? "border-[#24135f] bg-[#24135f] text-white"
                          : "border-[#d9d4eb] bg-white text-[#24135f] hover:border-[#24135f]"
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[13px] text-[#6c6684]">
                Showing <span className="font-bold text-[#24135f]">{filteredUsers.length}</span>{" "}
                staff account{filteredUsers.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          {error ? (
            <div className="app-alert-danger mb-4">
              {errorMessage}
            </div>
          ) : null}

          <div className="app-table-shell overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="app-table-head">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="app-table-row">
                      <td className="app-table-cell">{user.name || "N/A"}</td>
                      <td className="app-table-cell">{user.email}</td>
                      <td className="app-table-cell">{roleLabels[user.role] || user.role}</td>
                      <td className="app-table-cell">{user.department || "N/A"}</td>
                      <td className="app-table-cell">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="app-icon-btn h-9 w-9 border-0 bg-[#24135f] text-white hover:bg-[#1a0f4a] hover:text-white"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="app-icon-btn h-9 w-9 border-0 bg-[#c53b4f] text-white hover:bg-[#a93042] hover:text-white"
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
                      No staff accounts matched the selected role or search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
          <div className="w-full max-w-[400px] rounded-[22px] border border-[#d9d9d9] bg-white shadow-sm">
            <div className="rounded-t-[22px] bg-[#24135f] px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-extrabold text-white">
                  {editingUser ? "Edit User Account" : "Create User Account"}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
                  Select Role
                </label>
                <AppSelect
                  value={formData.role}
                  onChange={(nextValue) => setFormData({ ...formData, role: nextValue })}
                  options={formRoles}
                  triggerClassName="min-h-10 rounded-[10px] border-[#6d63a3] text-[14px] shadow-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-bold text-[#24135f]">Name</label>
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
                <AppMultiSelect
                  values={formData.departments}
                  onChange={(nextDepartments) =>
                    setFormData({ ...formData, departments: nextDepartments })
                  }
                  options={departmentOptions}
                  placeholder="Select one, two, or three departments"
                  triggerClassName="min-h-[38px] rounded-[8px] border-[#6d63a3] px-3 py-2 text-[14px] shadow-none"
                  menuClassName="rounded-[16px]"
                />
                <p className="mt-1 text-[11px] text-[#8a84a4]">
                  You can select up to three departments for the same account.
                </p>
              </div>

              {error ? <div className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{errorMessage}</div> : null}

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
                type="button"
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

              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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
