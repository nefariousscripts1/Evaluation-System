import React from "react";
import AppSelect, { type AppSelectOption } from "@/components/ui/AppSelect";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: AppSelectOption[];
  error?: string;
  placeholder?: string;
}

export default function Select({
  label,
  options,
  error,
  className = "",
  value,
  onChange,
  placeholder,
  disabled,
}: SelectProps) {
  return (
    <div className="w-full">
      <AppSelect
        label={label}
        value={String(value ?? "")}
        onChange={(nextValue) =>
          onChange?.({
            target: { value: nextValue },
          } as React.ChangeEvent<HTMLSelectElement>)
        }
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {error && <p className="mt-2 text-sm text-[#c53b4f]">{error}</p>}
    </div>
  );
}
