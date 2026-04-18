"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type AppSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type AppSelectProps = {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
};

export default function AppSelect({
  value,
  options,
  onChange,
  label,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuClassName = "",
}: AppSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [value]);

  return (
    <div ref={containerRef} className={`w-full ${className}`.trim()}>
      {label ? (
        <label className="mb-2 block text-sm font-semibold text-[#24135f]">{label}</label>
      ) : null}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setOpen((current) => !current);
            }
          }}
          disabled={disabled}
          className={`app-select-trigger ${open ? "app-select-trigger-open" : ""} ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          } ${triggerClassName}`.trim()}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <div className="min-w-0 text-left">
            <p className={`truncate ${selectedOption ? "font-semibold text-[#24135f]" : "text-[#8d88a5]"}`}>
              {selectedOption?.label || placeholder}
            </p>
            {selectedOption?.sublabel ? (
              <p className="mt-0.5 truncate text-[11px] text-[#7b7498]">{selectedOption.sublabel}</p>
            ) : null}
          </div>
          <ChevronDown
            size={18}
            className={`shrink-0 text-[#24135f] transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div className={`app-select-menu ${menuClassName}`.trim()} role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={`app-select-option ${isSelected ? "app-select-option-selected" : ""}`}
                >
                  <div className="min-w-0 text-left">
                    <p className="truncate">{option.label}</p>
                    {option.sublabel ? (
                      <p
                        className={`mt-0.5 truncate text-[11px] ${
                          isSelected ? "text-white/80" : "text-[#7b7498]"
                        }`}
                      >
                        {option.sublabel}
                      </p>
                    ) : null}
                  </div>
                  {isSelected ? <Check size={16} className="shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
