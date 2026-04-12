"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppLogo from "@/components/AppLogo";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing. Request a new password reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4 py-8">
      <div className="w-full max-w-[380px] rounded-[28px] border border-[#ddd7ea] bg-white shadow-[0_18px_45px_rgba(36,19,95,0.08)]">
        <div className="rounded-t-[28px] bg-[#24135f] px-6 py-6 text-white">
          <div className="flex items-center gap-4">
            <AppLogo className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-[22px] font-extrabold leading-tight">Reset Password</h1>
              <p className="mt-1 text-sm text-white/80">
                Create a new password for your account.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-[12px] border border-[#cfc7e2] px-4 text-sm outline-none transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/15"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 w-full rounded-[12px] border border-[#cfc7e2] px-4 text-sm outline-none transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/15"
              />
            </div>

            {message && (
              <div className="rounded-[14px] border border-[#d6e9da] bg-[#effaf2] px-4 py-3 text-sm text-[#18794e]">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-[14px] bg-[#24135f] text-sm font-bold text-white transition hover:bg-[#1b0f4d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#5b5375]">
            Return to{" "}
            <Link href="/login" className="font-semibold text-[#24135f] underline">
              login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
