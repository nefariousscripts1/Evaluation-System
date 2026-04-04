"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface DeleteInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructor: Instructor | null;
}

export default function DeleteInstructorModal({ isOpen, onClose, onSuccess, instructor }: DeleteInstructorModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!instructor) return;
    
    setLoading(true);
    const res = await fetch(`/api/instructors?id=${instructor.id}`, { method: "DELETE" });
    
    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      alert("Failed to delete instructor");
    }
    setLoading(false);
  };

  if (!isOpen || !instructor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-[400px] rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h2 className="text-[18px] font-bold text-[#24135f]">Delete Instructor</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-center text-gray-700">
            Are you sure you want to delete <br />
            <span className="font-bold text-[#24135f]">{instructor.name}</span>?
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            This action cannot be undone.
          </p>

          <div className="flex justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}