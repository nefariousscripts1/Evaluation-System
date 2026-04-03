"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
  editingUser: User | null;
}

const roles = [
  { label: "Dean", value: "dean" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Director of Instructions", value: "director" },
  { label: "Campus Director", value: "campus_director" },
  { label: "Faculty", value: "faculty" },
  { label: "Secretary", value: "secretary" },
];

export default function UserModal({ isOpen, onClose, onSave, editingUser }: UserModalProps) {
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "faculty",
    department: "",
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "",
        role: editingUser.role || "faculty",
        department: editingUser.department || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "faculty",
        department: "",
      });
    }
    setError("");
  }, [editingUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      setFormLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      setFormLoading(false);
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setError("Password is required for new users");
      setFormLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save user");
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-[400px] rounded-[22px] border border-[#d9d9d9] bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#24135f] px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold text-white">
              {editingUser ? "Edit User Account" : "Create User Account"}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {/* Select Role */}
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

          {/* Name */}
          <div>
            <label className="mb-1 block text-[12px] font-bold text-[#24135f]">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
            />
          </div>

          {/* Email Address */}
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

          {/* Password */}
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

          {/* Department */}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formLoading}
            className="mt-2 h-12 w-full rounded-[6px] bg-[#24135f] text-[14px] font-extrabold text-white transition hover:bg-[#1a0f4a] disabled:opacity-50"
          >
            {formLoading ? "Saving..." : editingUser ? "Update" : "Create"}
          </button>

          {/* Cancel Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] text-[#24135f] hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}