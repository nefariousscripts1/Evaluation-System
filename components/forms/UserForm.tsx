"use client";

import { useId } from "react";
import AppMultiSelect from "@/components/ui/AppMultiSelect";
import AppSelect from "@/components/ui/AppSelect";
import type { AppRole } from "@/lib/server-auth";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  departments: string[];
};

type UserFormProps = {
  values: UserFormValues;
  onChange: (nextValues: UserFormValues) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  isEditing?: boolean;
};

const roleOptions = [
  { label: "Dean", value: "dean" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Director of Instructions", value: "director" },
  { label: "Campus Director", value: "campus_director" },
  { label: "Faculty", value: "faculty" },
  { label: "Secretary", value: "secretary" },
] satisfies Array<{ label: string; value: AppRole }>;

const departmentOptions = [
  { label: "CSM", value: "CSM", sublabel: "College of Science and Management" },
  { label: "CTE", value: "CTE", sublabel: "College of Teacher Education" },
  { label: "SAS", value: "SAS", sublabel: "School of Advanced Studies" },
];

export default function UserForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage,
  isEditing = false,
}: UserFormProps) {
  const formErrorId = useId();

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-8 py-6">
      <div>
        <label className="mb-1 block text-[12px] font-bold text-[#24135f]">Select Role</label>
        <AppSelect
          value={values.role}
          onChange={(role) => onChange({ ...values, role: role as AppRole })}
          options={roleOptions}
          triggerClassName="min-h-10 rounded-[10px] border-[#6d63a3] text-[14px] shadow-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-bold text-[#24135f]" htmlFor="user-name">
          Name
        </label>
        <input
          id="user-name"
          type="text"
          required
          autoComplete="name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          placeholder="e.g., Dr., Phd. Full Name"
          className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? formErrorId : undefined}
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-bold text-[#24135f]" htmlFor="user-email">
          Email Address
        </label>
        <input
          id="user-email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(event) => onChange({ ...values, email: event.target.value })}
          placeholder="name@bisu.edu.ph"
          className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? formErrorId : undefined}
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-bold text-[#24135f]" htmlFor="user-password">
          Password {isEditing ? "(leave blank to keep current)" : null}
        </label>
        <input
          id="user-password"
          type="password"
          required={!isEditing}
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => onChange({ ...values, password: event.target.value })}
          placeholder="Enter password"
          className="h-10 w-full rounded-[8px] border border-[#6d63a3] px-3 text-[14px] text-[#24135f] outline-none focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] placeholder:text-[#9d98b8]"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? formErrorId : undefined}
        />
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-bold text-[#24135f]">Department</label>
        <AppMultiSelect
          values={values.departments}
          onChange={(departments) => onChange({ ...values, departments })}
          options={departmentOptions}
          placeholder="Select one, two, or three departments"
          triggerClassName="min-h-[38px] rounded-[8px] border-[#6d63a3] px-3 py-2 text-[14px] shadow-none"
          menuClassName="rounded-[16px]"
        />
        <p className="mt-1 text-[11px] text-[#8a84a4]">
          You can select up to three departments for the same account.
        </p>
      </div>

      {errorMessage ? (
        <div
          id={formErrorId}
          className="rounded-lg bg-red-50 p-2 text-xs text-red-600"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-12 w-full rounded-[6px] bg-[#24135f] text-[14px] font-extrabold text-white transition hover:bg-[#1a0f4a] disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-[#24135f] hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
