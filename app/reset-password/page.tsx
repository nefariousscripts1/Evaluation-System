"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppLogo from "@/components/AppLogo";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { resetPasswordSchema } from "@/lib/validation";

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

    const parsedRequest = resetPasswordSchema.safeParse({ token, password });
    if (!parsedRequest.success) {
      setError(parsedRequest.error.issues[0]?.message || "Enter a valid reset token and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedRequest.data),
      });

      const data = await readApiResponse<{ message: string }>(res);

      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reset password"));
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
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="app-input h-11 rounded-[14px]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#24135f]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="app-input h-11 rounded-[14px]"
                />
              </div>

              {message && (
                <div className="app-alert-success">
                  {message}
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
    </div>
  );
}
