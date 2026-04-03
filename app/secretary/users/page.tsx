"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import UsersTable from "@/components/secretary/UsersTable";
import UserModal from "@/components/secretary/UserModal";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function UsersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (userData: any) => {
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to save user");
    }

    handleCloseModal();
    fetchUsers();
  };

  const handleDeleteUser = async (id: number, name: string) => {
    console.log("Deleting user:", id, name);
    
    const res = await fetch(`/api/users/${id}`, { 
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    
    console.log("Delete response status:", res.status);
    
    if (!res.ok) {
      const error = await res.json();
      console.error("Delete error:", error);
      throw new Error(error.error || "Failed to delete user");
    }
    
    fetchUsers();
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

          <UsersTable 
            users={users} 
            onEdit={handleEditUser} 
            onDelete={handleDeleteUser} 
          />
        </div>
      </main>

      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />
    </>
  );
}