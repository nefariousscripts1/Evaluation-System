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
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {!hideLabel && (
        <label className="text-[14px] font-bold text-[#24135f]">
          Select Academic Year:
        </label>
      )}

      <div className="relative min-w-[170px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[40px] w-full appearance-none rounded-[4px] border border-[#cfcadf] bg-white px-4 pr-10 text-[14px] font-semibold text-[#24135f] outline-none focus:border-[#24135f]"
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
