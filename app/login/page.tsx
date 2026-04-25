"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Lock, ShieldCheck, User, UserSquare2 } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { getErrorMessage } from "@/lib/error-message";
import { staffLoginSchema, studentAccessStartSchema } from "@/lib/validation";

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

    const parsedCredentials = staffLoginSchema.safeParse({
      email,
      password,
      role,
    });

    if (!parsedCredentials.success) {
      setError(parsedCredentials.error.issues[0]?.message || "Enter a valid email, password, and role");
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
    const parsedAccess = studentAccessStartSchema.safeParse({
      accessCode: formData.get("accessCode"),
      studentId: formData.get("studentId"),
    });

    if (!parsedAccess.success) {
      setError(parsedAccess.error.issues[0]?.message || "Enter a valid access code and student ID");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/student-access/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedAccess.data),
      });

      await readApiResponse(res);

      // HttpOnly cookie is automatically sent with next request
      router.push("/student/evaluate");
    } catch (err) {
      console.error("Student access error:", err);
      setError(getApiErrorMessage(err, "Something went wrong while starting student access"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-auth-shell relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <AppLogo className="h-[88vw] max-h-[1100px] w-[88vw] max-w-[1100px] object-contain opacity-[0.05] blur-[1.4px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-[560px] rounded-[34px] border border-[#ece6f7] bg-white/95 px-6 py-7 shadow-[0_28px_80px_rgba(36,19,95,0.12)] backdrop-blur sm:px-10 sm:py-9">
          <div className="flex flex-col items-center text-center">
            <AppLogo className="h-16 w-16 object-contain sm:h-[74px] sm:w-[74px]" />
            <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-[#24135f] sm:text-[32px]">
              Digital Evaluation System
            </h1>
          </div>

          <div className="mx-auto mt-6 max-w-[360px] rounded-full border border-[#e3dbf0] bg-white p-1 shadow-[0_12px_30px_rgba(36,19,95,0.07)]">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => switchMode("staff")}
                className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                  mode === "staff"
                    ? "bg-[#24135f] text-white shadow-[0_10px_24px_rgba(36,19,95,0.18)]"
                    : "text-[#4d4668] hover:bg-[#f8f5ff]"
                }`}
              >
                Staff Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("student")}
                className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                  mode === "student"
                    ? "bg-[#24135f] text-white shadow-[0_10px_24px_rgba(36,19,95,0.18)]"
                    : "text-[#4d4668] hover:bg-[#f8f5ff]"
                }`}
              >
                Student Login
              </button>
            </div>
          </div>

          <div className="mx-auto mt-7 max-w-[420px]">
            {mode === "staff" ? (
              <>
                <div>
                  <h2 className="text-lg font-extrabold text-[#24135f]">Staff Login</h2>
                  <p className="mt-1 text-sm text-[#6e6888]">
                    Sign in using your BISU email, password, and assigned staff role.
                  </p>
                </div>

                <form onSubmit={handleStaffSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#24135f]">
                      <User size={13} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="name@bisu.edu.ph"
                      className="app-input h-11 rounded-[14px] placeholder:text-[#b0abc4]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#24135f]">
                      <Lock size={13} />
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Enter your password"
                      className="app-input h-11 rounded-[14px] placeholder:text-[#b0abc4]"
                    />
                  </div>

                  <div ref={dropdownRef} className="relative z-20">
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#24135f]">
                      <ShieldCheck size={13} />
                      Staff Role
                    </label>

                    <button
                      type="button"
                      onClick={() => setOpenRoleDropdown((prev) => !prev)}
                      className="app-input flex h-11 items-center justify-between rounded-[14px]"
                    >
                      <span className={selectedRole ? "font-semibold" : "text-[#8d88a5]"}>
                        {staffRoles.find((role) => role.value === selectedRole)?.label || "Select your role"}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`transition ${openRoleDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {openRoleDropdown && (
                      <div
                        className={`absolute left-0 right-0 max-h-[220px] overflow-y-auto rounded-[18px] border border-[#e2dceb] bg-white p-2 shadow-[0_22px_50px_rgba(36,19,95,0.14)] ${
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

                  {error ? <p className="app-alert-danger">{errorMessage}</p> : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="app-btn-primary h-12 w-full rounded-[14px]"
                  >
                    {loading ? "Signing in..." : "Log In"}
                  </button>
                </form>

                <div className="mt-4 text-center text-sm">
                  <Link href="/forgot-password" className="font-semibold text-[#3a2d72] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-extrabold text-[#24135f]">Student Access</h2>
                  <p className="mt-1 text-sm text-[#6e6888]">
                    Enter the active access code from the secretary and your Student ID.
                  </p>
                </div>

                <form onSubmit={handleStudentSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#24135f]">
                      <Lock size={13} />
                      Access Code
                    </label>
                    <input
                      type="text"
                      name="accessCode"
                      required
                      autoComplete="off"
                      placeholder="Enter access code"
                      className="app-input h-11 rounded-[14px] font-semibold uppercase tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal placeholder:text-[#b0abc4]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#24135f]">
                      <UserSquare2 size={13} />
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      required
                      autoComplete="off"
                      placeholder="Enter your Student ID"
                      className="app-input h-11 rounded-[14px] placeholder:text-[#b0abc4]"
                    />
                  </div>

                  {error ? <p className="app-alert-danger">{errorMessage}</p> : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="app-btn-primary h-12 w-full rounded-[14px]"
                  >
                    {loading ? "Verifying..." : "Continue to Evaluation"}
                  </button>
                </form>

                <div className="mt-5 rounded-[16px] border border-[#ece7f7] bg-white px-4 py-4 text-sm leading-6 text-[#6e6888] shadow-[0_10px_24px_rgba(36,19,95,0.05)]">
                  Student accounts no longer need username/password login. Access is limited to the
                  currently open evaluation session.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
