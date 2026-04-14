"use client";

import React from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, User } from "lucide-react";
import AppLogo from "@/components/AppLogo";

const roles = [
  { label: "Campus Director", value: "campus_director" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Dean", value: "dean" },
  { label: "Director of Instructions", value: "director" },
  { label: "Instructor/Faculty", value: "faculty" },
  { label: "Secretary", value: "secretary" },
  { label: "Student", value: "student" },
];

function getRedirectPath(role: string) {
  if (role === "secretary") return "/secretary/dashboard";
  if (role === "student") return "/student/evaluate";
  if (role === "faculty") return "/results";
  if (role === "chairperson") return "/chairperson/results";
  if (["dean", "director", "campus_director"].includes(role)) {
    return "/evaluate";
  }
  return "/login";
}

export default function LoginPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenRoleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const role = selectedRole.trim();

    if (!role) {
      setError("Please select a role");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        role,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email, password, or role");
        setLoading(false);
        return;
      }

      const destination = getRedirectPath(role);
      router.push(destination);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong during login");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4">
      <div className="w-full max-w-[340px] overflow-visible rounded-[26px] border border-[#d9d9d9] bg-white shadow-sm">
        <div className="rounded-t-[26px] bg-[#24135f] px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center">
              <AppLogo className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-[22px] font-extrabold leading-tight text-white">
              Digital Evaluation
              <br />
              System
            </h1>
          </div>
        </div>

        <div className="overflow-visible px-6 pb-8 pt-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#24135f]">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="name@bisu.edu.ph"
                className="h-10 w-full rounded-lg border border-[#6c63a8] px-4 text-sm outline-none focus:border-[#24135f] placeholder:text-[#b4b4b4]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#24135f]">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Enter your password"
                className="h-10 w-full rounded-lg border border-[#6c63a8] px-4 text-sm outline-none focus:border-[#24135f] placeholder:text-[#b4b4b4]"
              />
            </div>

            <div ref={dropdownRef} className="relative z-50">
              <label className="mb-1 block text-[11px] font-semibold text-[#24135f]">
                Select Role
              </label>

              <input type="hidden" name="role" value={selectedRole} />

              <button
                type="button"
                onClick={() => setOpenRoleDropdown((prev) => !prev)}
                className={`flex h-10 w-full items-center justify-between rounded-lg border border-[#6c63a8] px-4 text-sm outline-none hover:border-[#24135f] ${
                  selectedRole ? "font-bold text-[#24135f]" : "font-normal text-[#24135f]"
                }`}
              >
                <span>
                  {roles.find((r) => r.value === selectedRole)?.label || "Select your role"}
                </span>
                <ChevronDown
                  size={18}
                  className={`transition ${openRoleDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {openRoleDropdown && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[999] max-h-64 overflow-y-auto rounded-xl border border-[#d9d9d9] bg-white py-2 shadow-lg">
                  {roles.map((role) => {
                    const isSelected = selectedRole === role.value;

                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role.value);
                          setOpenRoleDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[#f8f7ff] ${
                          isSelected
                            ? "bg-[#24135f] font-bold text-white"
                            : "font-medium text-[#24135f]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <User size={16} />
                          <span className={isSelected ? "font-bold" : "font-medium"}>
                            {role.label}
                          </span>
                        </span>
                        {isSelected && <Check size={16} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl bg-[#24135f] text-base font-bold text-white transition hover:bg-[#1a0f4a] disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/forgot-password" className="text-sm text-[#3a2d72] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm font-semibold text-[#24135f] hover:underline"
            >
              Create Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
