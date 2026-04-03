"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: password,
        name: `${formData.get("firstName")} ${formData.get("lastName")}`,
        role: "student",
        studentId: formData.get("studentId"),
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/login?registered=true");
    } else {
      setError(data.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4">
      <div className="w-full max-w-[320px] rounded-[26px] border border-[#d9d9d9] bg-white shadow-sm">
        {/* Header */}
        <div className="rounded-t-[26px] bg-[#24135f] px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
              <span className="text-xl font-bold text-[#24135f]">D</span>
            </div>
            <h1 className="text-[18px] font-extrabold leading-tight text-white">
              Digital Evaluation
              <br />
              System
            </h1>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-7 pt-6">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* First Name */}
            <input
              type="text"
              name="firstName"
              required
              placeholder="First Name"
              className="h-8 w-full rounded-[4px] border border-[#6c63a8] px-3 text-[12px] outline-none focus:border-[#24135f]"
            />

            {/* Last Name */}
            <input
              type="text"
              name="lastName"
              required
              placeholder="Last Name"
              className="h-8 w-full rounded-[4px] border border-[#6c63a8] px-3 text-[12px] outline-none focus:border-[#24135f]"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              required
              placeholder="Bisu Email"
              className="h-8 w-full rounded-[4px] border border-[#6c63a8] px-3 text-[12px] outline-none focus:border-[#24135f]"
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Create Password"
              className="h-8 w-full rounded-[4px] border border-[#6c63a8] px-3 text-[12px] outline-none focus:border-[#24135f]"
            />

            {/* Confirm Password */}
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Confirm Password"
              className="h-8 w-full rounded-[4px] border border-[#6c63a8] px-3 text-[12px] outline-none focus:border-[#24135f]"
            />

            {/* Student ID */}
            <input
              type="text"
              name="studentId"
              required
              placeholder="Student ID Number"
              className="h-8 w-full rounded-[4px] border border-[#6c63a8] px-3 text-[12px] outline-none focus:border-[#24135f]"
            />

            {/* Terms */}
            <div className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" required id="terms" />
              <label htmlFor="terms" className="text-gray-600">
                I agree to the{" "}
                <span className="cursor-pointer text-[#24135f] underline">
                  Terms & Conditions
                </span>
              </label>
            </div>

            {/* Error */}
            {error && <p className="text-[12px] text-red-600">{error}</p>}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-[10px] bg-[#24135f] text-sm font-bold text-white transition hover:bg-[#1a0f4a] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-3 text-center text-[12px] text-[#4d4d4d]">
            Already have an Account?{" "}
            <Link href="/login" className="font-bold text-[#24135f] underline">
              LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}