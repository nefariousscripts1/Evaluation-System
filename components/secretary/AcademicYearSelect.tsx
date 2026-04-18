"use client";

import AppSelect from "@/components/ui/AppSelect";

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

      <div className="w-full min-w-0 sm:min-w-[170px]">
        <AppSelect
          value={value}
          onChange={onChange}
          options={options.map((option) => ({ value: option, label: option }))}
          triggerClassName="min-h-[46px] rounded-[16px] text-[14px] sm:min-h-[44px]"
        />
      </div>
    </div>
  );
}
