"use client";

import { ChevronDown } from "lucide-react";

type Props = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
  className?: string;
};

export default function AcademicYearSelect({
  value,
  options,
  onChange,
  hideLabel = false,
  className = "",
}: Props) {
  return (
    <div className={`flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 ${className}`.trim()}>
      {!hideLabel && (
        <label className="text-[14px] font-bold text-[#24135f]">
          Select Academic Year:
        </label>
      )}

      <div className="relative w-full min-w-0 sm:min-w-[170px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="app-select h-[46px] rounded-[16px] text-[14px] sm:h-[44px]"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#24135f]"
        />
      </div>
    </div>
  );
}
