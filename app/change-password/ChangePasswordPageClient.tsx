"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { getErrorMessage } from "@/lib/error-message";
import { changePasswordSchema } from "@/lib/validation";

function getDefaultRouteForRole(role?: string) {
  switch (role) {
    case "secretary":
      return "/secretary/dashboard";
    case "student":
      return "/student/evaluate";
    case "faculty":
      return "/faculty/dashboard";
    case "chairperson":
      return "/chairperson/results";
    case "dean":
      return "/dean/results";
    case "director":
      return "/director/results";
    case "campus_director":
      return "/campus-director/results";
    default:
      return "/";
  }
}

export default function ChangePasswordPageClient() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const parsedPayload = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsedPayload.success) {
      setError(parsedPayload.error.issues[0]?.message || "Enter a valid password");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload.data),
      });

      const data = await readApiResponse<{
        message: string;
        mustChangePassword: boolean;
      }>(response);

      setMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await update({ mustChangePassword: data.mustChangePassword });
      router.replace(getDefaultRouteForRole(session?.user.role));
      router.refresh();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Failed to change password"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-auth-shell relative min-h-screen overflow-hidden px-4 py-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[30px] border border-[#ddd7ea] bg-white/95 shadow-[0_22px_50px_rgba(36,19,95,0.1)] backdrop-blur">
          <div className="rounded-t-[28px] bg-[#24135f] px-6 py-6 text-white sm:px-8">
            <h1 className="text-[26px] font-extrabold leading-tight">Change Your Password</h1>
            <p className="mt-2 text-sm text-white/80">
              Your account is protected, but you need to set a new password before entering the
              app.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="mb-2 block text-sm font-semibold text-[#24135f]">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="app-input"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-[#24135f]">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="app-input"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-[#24135f]">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="app-input"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {message ? <div className="app-alert-success">{message}</div> : null}
              {error ? <div className="app-alert-danger">{getErrorMessage(error)}</div> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="app-btn-primary h-12 w-full rounded-[14px]"
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
