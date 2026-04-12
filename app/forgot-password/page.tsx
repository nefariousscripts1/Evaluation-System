"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AppLogo from "@/components/AppLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send password reset email");
      }

      setMessage(data.message);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
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
              <h1 className="text-[22px] font-extrabold leading-tight">Forgot Password</h1>
              <p className="mt-1 text-sm text-white/80">
                We&apos;ll send you a secure reset link.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@bisu.edu.ph"
                className="h-11 w-full rounded-[12px] border border-[#cfc7e2] px-4 text-sm outline-none transition focus:border-[#24135f] focus:ring-2 focus:ring-[#24135f]/15"
              />
            </div>

            {message && (
              <div className="rounded-[14px] border border-[#d6e9da] bg-[#effaf2] px-4 py-3 text-sm text-[#18794e]">
                <p>{message}</p>
                {resetUrl && (
                  <p className="mt-2 break-all text-xs text-[#0c5f39]">
                    Dev reset link: <a href={resetUrl} className="underline">{resetUrl}</a>
                  </p>
                )}
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
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#5b5375]">
            Remembered your password?{" "}
            <Link href="/login" className="font-semibold text-[#24135f] underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
