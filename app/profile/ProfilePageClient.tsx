"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { getApiErrorMessage, readApiResponse } from "@/lib/client-api";
import { getErrorMessage } from "@/lib/error-message";
import type { AppRole } from "@/lib/server-auth";
import { ownProfileUpdateSchema } from "@/lib/validation";

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    const parsedPayload = ownProfileUpdateSchema.safeParse({ name });

    if (!parsedPayload.success) {
      setError(parsedPayload.error.issues[0]?.message || "Enter a valid name");
      setIsSaving(false);
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
      setMessage(data.message);
      await update({ name: data.user.name ?? "" });
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Failed to update profile"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-page">
      <div className="app-page-card-narrow max-w-3xl">
        <div className="flex flex-col gap-3 border-b border-[#ede8f7] pb-6">
          <h1 className="app-section-title">My Profile</h1>
          <p className="app-section-subtitle">
            Update your personal display name. Your account email and role are managed by the
            system.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
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
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  aria-invalid={Boolean(error)}
                />
              </div>

              {message ? <div className="app-alert-success">{message}</div> : null}
              {error ? <div className="app-alert-danger">{getErrorMessage(error)}</div> : null}

              <button type="submit" disabled={isSaving} className="app-btn-primary min-w-[180px]">
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
