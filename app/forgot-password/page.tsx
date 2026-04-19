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
  const [messageTone, setMessageTone] = useState<"success" | "warning">("success");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl("");
    setMessageTone("success");

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
      setMessageTone(data.deliveryConfigured === false ? "warning" : "success");
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
    <div className="app-auth-shell relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <AppLogo className="h-[88vw] max-h-[1100px] w-[88vw] max-w-[1100px] object-contain opacity-[0.05] blur-[1.4px]" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-[400px] rounded-[30px] border border-[#ddd7ea] bg-white/95 shadow-[0_22px_50px_rgba(36,19,95,0.1)] backdrop-blur">
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
                  className="app-input h-11 rounded-[14px]"
                />
              </div>

              {message && (
                <div
                  className={
                    messageTone === "warning"
                      ? "rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                      : "app-alert-success"
                  }
                >
                  <p>{message}</p>
                  {resetUrl && (
                    <p className="mt-2 break-all text-xs text-[#0c5f39]">
                      Dev reset link: <a href={resetUrl} className="underline">{resetUrl}</a>
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="app-alert-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="app-btn-primary h-11 w-full rounded-[14px]"
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
    </div>
  );
}
