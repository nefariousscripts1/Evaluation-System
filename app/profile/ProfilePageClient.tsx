"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { getErrorMessage } from "@/lib/error-message";
import type { AppRole } from "@/lib/server-auth";
import { changePasswordSchema, ownProfileUpdateSchema } from "@/lib/validation";

type ProfilePageClientProps = {
  user: {
    name: string | null;
    email: string;
    role: AppRole;
  };
};

const roleLabels: Record<AppRole, string> = {
  student: "Student",
  faculty: "Faculty",
  chairperson: "Chairperson",
  dean: "Dean",
  director: "Director of Instructions",
  campus_director: "Campus Director",
  secretary: "Secretary",
};

export default function ProfilePageClient({ user }: ProfilePageClientProps) {
  const { update } = useSession();
  const [name, setName] = useState(user.name ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    const parsedPayload = ownProfileUpdateSchema.safeParse({ name });

    if (!parsedPayload.success) {
      setProfileError(parsedPayload.error.issues[0]?.message || "Enter a valid name");
      setIsSavingProfile(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload.data),
      });

      const data = await readApiResponse<{
        message: string;
        user: {
          name: string | null;
        };
      }>(response);

      setName(data.user.name ?? "");
      setProfileMessage(data.message);
      await update({ name: data.user.name ?? "" });
    } catch (saveError) {
      setProfileError(getApiErrorMessage(saveError, "Failed to update profile"));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    const parsedPayload = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsedPayload.success) {
      setPasswordError(parsedPayload.error.issues[0]?.message || "Enter a valid password");
      setIsSavingPassword(false);
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

      setPasswordMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await update({ mustChangePassword: data.mustChangePassword });
    } catch (saveError) {
      setPasswordError(getApiErrorMessage(saveError, "Failed to update password"));
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <main className="app-page">
      <div className="app-page-card w-full max-w-none">
        <div className="flex flex-col gap-3 border-b border-[#ede8f7] pb-6">
          <h1 className="app-section-title">My Profile</h1>
          <p className="app-section-subtitle">
            Update your personal display name. Your account email and role are managed by the
            system.
          </p>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(340px,0.95fr)_minmax(420px,1.45fr)]">
          <div className="space-y-5">
            <section className="app-surface-subtle p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7299]">
                Account Summary
              </p>

              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-[#6d6686]">Email</dt>
                  <dd className="mt-1 break-all font-bold text-[#24135f]">{user.email}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-[#6d6686]">Role</dt>
                  <dd className="mt-1 font-bold text-[#24135f]">{roleLabels[user.role]}</dd>
                </div>
              </dl>
            </section>

            <section className="app-surface-subtle p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a7299]">
                Security
              </p>
              <h2 className="mt-3 text-lg font-bold text-[#24135f]">Password</h2>
              <p className="mt-2 text-sm leading-6 text-[#6d6686]">
                Change your password here without leaving your profile.
              </p>
              <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
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
                    aria-invalid={Boolean(passwordError)}
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
                    aria-invalid={Boolean(passwordError)}
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
                    aria-invalid={Boolean(passwordError)}
                    required
                  />
                </div>

                {passwordMessage ? <div className="app-alert-success">{passwordMessage}</div> : null}
                {passwordError ? <div className="app-alert-danger">{getErrorMessage(passwordError)}</div> : null}

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="app-btn-primary min-w-[200px]"
                >
                  {isSavingPassword ? "Updating..." : "Change Password"}
                </button>
              </form>
            </section>
          </div>

          <section className="app-surface-subtle p-5">
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-[#24135f]">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="app-input"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  aria-invalid={Boolean(profileError)}
                />
              </div>

              {profileMessage ? <div className="app-alert-success">{profileMessage}</div> : null}
              {profileError ? <div className="app-alert-danger">{getErrorMessage(profileError)}</div> : null}

              <button type="submit" disabled={isSavingProfile} className="app-btn-primary min-w-[180px]">
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
