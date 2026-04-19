"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type AppMultiSelectOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type AppMultiSelectProps = {
  values: string[];
  options: AppMultiSelectOption[];
  onChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
};

export default function AppMultiSelect({
  values,
  options,
  onChange,
  label,
  placeholder = "Select one or more options",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuClassName = "",
}: AppMultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values]
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
    if (!open || !containerRef.current) {
      return;
    }

    const dropdownRect = containerRef.current.getBoundingClientRect();
    const estimatedMenuHeight = Math.min(options.length * 64 + 16, 260);
    const spaceBelow = window.innerHeight - dropdownRect.bottom;
    const spaceAbove = dropdownRect.top;

    setOpenUpward(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
  }, [open, options.length]);

  const triggerLabel =
    selectedOptions.length > 0
      ? selectedOptions.map((option) => option.label).join(", ")
      : placeholder;

  const toggleValue = (nextValue: string) => {
    if (values.includes(nextValue)) {
      onChange(values.filter((value) => value !== nextValue));
      return;
    }

    onChange([...values, nextValue]);
  };

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
            <p
              className={`truncate ${
                selectedOptions.length > 0 ? "font-semibold text-[#24135f]" : "text-[#8d88a5]"
              }`}
            >
              {triggerLabel}
            </p>
            {selectedOptions.length > 1 ? (
              <p className="mt-0.5 truncate text-[11px] text-[#7b7498]">
                {selectedOptions.length} departments selected
              </p>
            ) : null}
          </div>
          <ChevronDown
            size={18}
            className={`shrink-0 text-[#24135f] transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div
            className={`app-select-menu max-h-[260px] space-y-2 overflow-y-auto ${
              openUpward ? "bottom-[calc(100%+8px)] top-auto" : ""
            } ${menuClassName}`.trim()}
            role="listbox"
            aria-multiselectable="true"
          >
            {options.map((option) => {
              const isSelected = values.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className={`app-select-option ${isSelected ? "app-select-option-selected" : ""}`}
                  aria-selected={isSelected}
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
