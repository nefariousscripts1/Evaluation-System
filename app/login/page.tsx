"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, KeyRound, Lock, ShieldCheck, User, UserSquare2 } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { getErrorMessage } from "@/lib/error-message";

const staffRoles = [
  { label: "Campus Director", value: "campus_director" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Dean", value: "dean" },
  { label: "Director of Instructions", value: "director" },
  { label: "Instructor/Faculty", value: "faculty" },
  { label: "Secretary", value: "secretary" },
];

function getRedirectPath(role: string) {
  if (role === "secretary") return "/secretary/dashboard";
  if (role === "faculty") return "/results";
  if (role === "chairperson") return "/chairperson/results";
  if (role === "dean") return "/dean/results";
  if (role === "director") return "/director/results";
  if (role === "campus_director") return "/campus-director/results";
  return "/login";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"staff" | "student">(
    searchParams.get("mode") === "student" ? "student" : "staff"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);
  const [openRoleDropdownUpward, setOpenRoleDropdownUpward] = useState(false);
  const errorMessage = error ? getErrorMessage(error) : "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenRoleDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const requestedMode = searchParams.get("mode") === "student" ? "student" : "staff";
    setMode(requestedMode);
  }, [searchParams]);

  useEffect(() => {
    if (!openRoleDropdown || !dropdownRef.current) {
      return;
    }

    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const estimatedMenuHeight = Math.min(staffRoles.length * 56 + 16, 220);
    const spaceBelow = window.innerHeight - dropdownRect.bottom;
    const spaceAbove = dropdownRect.top;

    setOpenRoleDropdownUpward(
      spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow
    );
  }, [openRoleDropdown]);

  const switchMode = (nextMode: "staff" | "student") => {
    setMode(nextMode);
    setError("");
    setOpenRoleDropdown(false);
    router.replace(nextMode === "student" ? "/login?mode=student" : "/login");
  };

  const handleStaffSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const role = selectedRole.trim();

    if (!role) {
      setError("Please select a staff role");
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

      router.push(getRedirectPath(role));
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong during login");
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/student-access/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: formData.get("accessCode"),
          studentId: formData.get("studentId"),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Failed to validate student access");
        setLoading(false);
        return;
      }

      router.push("/student/evaluate");
      router.refresh();
    } catch (err) {
      console.error("Student access error:", err);
      setError("Something went wrong while starting student access");
      setLoading(false);
    }
  };

  return (
    <div className="app-auth-shell min-h-screen px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full overflow-visible rounded-[36px] border border-[#ece7f7] bg-white shadow-[0_30px_80px_rgba(36,19,95,0.14)] lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-t-[36px] bg-[#24135f] px-8 py-10 text-white sm:px-10 sm:py-12 lg:rounded-l-[36px] lg:rounded-tr-none">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 backdrop-blur">
                <AppLogo className="h-14 w-14 object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                  Access Portal
                </p>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight">
                  Digital Evaluation System
                </h1>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <div className="rounded-[24px] border border-white/12 bg-white/10 p-5 shadow-[0_16px_34px_rgba(17,10,49,0.18)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold">Staff Login</h2>
                    <p className="text-sm text-white/75">
                      Secure access for secretary, faculty, and leadership roles.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/12 bg-white/10 p-5 shadow-[0_16px_34px_rgba(17,10,49,0.18)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold">Student Access</h2>
                    <p className="text-sm text-white/75">
                      Students only need the secretary&apos;s access code and their Student ID.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative z-30 overflow-visible rounded-b-[36px] px-6 py-8 sm:px-10 sm:py-10 lg:rounded-bl-none lg:rounded-r-[36px]">
            <div className="mx-auto max-w-[460px]">
              <div className="rounded-full border border-[#ece7f7] bg-[#f8f5ff] p-1 shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => switchMode("staff")}
                    className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                      mode === "staff"
                        ? "bg-[#24135f] text-white shadow-[0_12px_26px_rgba(36,19,95,0.16)]"
                        : "text-[#5f5880] hover:bg-white"
                    }`}
                  >
                    Staff Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("student")}
                    className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                      mode === "student"
                        ? "bg-[#24135f] text-white shadow-[0_12px_26px_rgba(36,19,95,0.16)]"
                        : "text-[#5f5880] hover:bg-white"
                    }`}
                  >
                    Student Access
                  </button>
                </div>
              </div>

              <div className="mt-8">
                {mode === "staff" ? (
                  <>
                    <div>
                      <h2 className="text-[30px] font-extrabold text-[#24135f]">Staff Sign In</h2>
                      <p className="mt-2 text-sm text-[#6e6888]">
                        Use your email, password, and role to continue.
                      </p>
                    </div>

                    <form onSubmit={handleStaffSubmit} className="mt-8 space-y-5">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#24135f]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder="name@bisu.edu.ph"
                          className="app-input placeholder:text-[#b0abc4]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#24135f]">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          required
                          placeholder="Enter your password"
                          className="app-input placeholder:text-[#b0abc4]"
                        />
                      </div>

                      <div ref={dropdownRef} className="relative z-20">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#24135f]">
                          Staff Role
                        </label>

                        <button
                          type="button"
                          onClick={() => setOpenRoleDropdown((prev) => !prev)}
                          className="app-input flex items-center justify-between"
                        >
                          <span className={selectedRole ? "font-bold" : "text-[#8d88a5]"}>
                            {staffRoles.find((role) => role.value === selectedRole)?.label || "Select your role"}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`transition ${openRoleDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {openRoleDropdown && (
                          <div
                            className={`absolute left-0 right-0 max-h-[220px] overflow-y-auto rounded-[20px] border border-[#e2dceb] bg-white p-2 shadow-[0_22px_50px_rgba(36,19,95,0.14)] ${
                              openRoleDropdownUpward
                                ? "bottom-[calc(100%+10px)]"
                                : "top-[calc(100%+10px)]"
                            }`}
                          >
                            {staffRoles.map((role) => {
                              const isSelected = selectedRole === role.value;

                              return (
                                <button
                                  key={role.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedRole(role.value);
                                    setOpenRoleDropdown(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-[14px] px-4 py-3 text-left text-sm transition ${
                                    isSelected
                                      ? "bg-[#24135f] font-bold text-white"
                                      : "text-[#24135f] hover:bg-[#f7f4ff]"
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <User size={16} />
                                    {role.label}
                                  </span>
                                  {isSelected ? <Check size={16} /> : null}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {error ? (
                        <p className="app-alert-danger">
                          {errorMessage}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={loading}
                        className="app-btn-primary h-12 w-full"
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </button>
                    </form>

                    <div className="mt-6 flex items-center justify-between gap-4 text-sm">
                      <Link href="/forgot-password" className="font-semibold text-[#3a2d72] hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-[30px] font-extrabold text-[#24135f]">Student Access</h2>
                      <p className="mt-2 text-sm text-[#6e6888]">
                        Enter the active access code from the secretary and your Student ID.
                      </p>
                    </div>

                    <form onSubmit={handleStudentSubmit} className="mt-8 space-y-5">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#24135f]">
                          <Lock size={14} />
                          Access Code
                        </label>
                        <input
                          type="text"
                          name="accessCode"
                          required
                          autoComplete="off"
                          placeholder="Enter access code"
                          className="app-input font-semibold uppercase tracking-[0.12em] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#b0abc4]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#24135f]">
                          <UserSquare2 size={14} />
                          Student ID
                        </label>
                        <input
                          type="text"
                          name="studentId"
                          required
                          autoComplete="off"
                          placeholder="Enter your Student ID"
                          className="app-input placeholder:text-[#b0abc4]"
                        />
                      </div>

                      {error ? (
                        <p className="app-alert-danger">
                          {errorMessage}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={loading}
                        className="app-btn-primary h-12 w-full"
                      >
                        {loading ? "Verifying..." : "Continue to Evaluation"}
                      </button>
                    </form>

                    <div className="mt-6 rounded-[20px] border border-[#ece7f7] bg-white p-4 text-sm text-[#6e6888] shadow-[0_12px_28px_rgba(36,19,95,0.06)]">
                      Student accounts no longer need username/password login. Access is limited to
                      the currently open evaluation session.
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
