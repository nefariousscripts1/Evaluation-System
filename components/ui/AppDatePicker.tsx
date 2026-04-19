"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type AppDatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDateValue(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayValue(value: string) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "";
  }

  return parsed.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default function AppDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  required = false,
  min,
  max,
}: AppDatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseDateValue(value);
  const minDate = parseDateValue(min ?? "");
  const maxDate = parseDateValue(max ?? "");
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? today);

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
  const startOffset = monthStart.getDay();
  const gridStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - startOffset);

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });

  const monthLabel = visibleMonth.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) {
      return true;
    }

    if (maxDate && date > maxDate) {
      return true;
    }

    return false;
  };

  const goToPreviousMonth = () => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  };

  const selectDate = (date: Date) => {
    if (isDisabled(date)) {
      return;
    }

    onChange(toDateValue(date));
    setOpen(false);
  };

  const canSelectToday = !isDisabled(today);

  return (
    <div ref={containerRef}>
      <label className="mb-2 block text-[14px] font-bold text-[#24135f]">{label}</label>

      <div className="relative">
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          value={value}
          onChange={() => undefined}
          required={required}
        />

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`flex h-[46px] w-full items-center justify-between rounded-[12px] border border-[#cfc8e2] bg-white px-4 text-left text-[15px] text-[#24135f] outline-none transition hover:border-[#b9b1d5] focus:border-[#24135f] focus:ring-1 focus:ring-[#24135f] ${
            open ? "border-[#24135f] ring-1 ring-[#24135f]" : ""
          }`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? "text-[#24135f]" : "text-[#9d98b8]"}>
            {value ? formatDisplayValue(value) : placeholder}
          </span>
          <CalendarDays size={18} className="shrink-0 text-[#24135f]" />
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 rounded-[22px] border border-[#e4ddf2] bg-white p-4 shadow-[0_24px_56px_rgba(36,19,95,0.16)]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e0f1] text-[#24135f] transition hover:bg-[#f7f4ff]"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="text-center">
                <p className="text-[15px] font-bold text-[#24135f]">{monthLabel}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8a84a4]">
                  Pick a date
                </p>
              </div>

              <button
                type="button"
                onClick={goToNextMonth}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e0f1] text-[#24135f] transition hover:bg-[#f7f4ff]"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((weekday) => (
                <div
                  key={weekday}
                  className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a84a4]"
                >
                  {weekday}
                </div>
              ))}

              {calendarDays.map((day) => {
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isToday = isSameDay(day, today);
                const disabled = isDisabled(day);

                return (
                  <button
                    key={toDateValue(day)}
                    type="button"
                    onClick={() => selectDate(day)}
                    disabled={disabled}
                    className={`flex aspect-square items-center justify-center rounded-[14px] text-[14px] font-semibold transition ${
                      isSelected
                        ? "bg-[#24135f] text-white shadow-[0_12px_24px_rgba(36,19,95,0.18)]"
                        : isToday
                        ? "border border-[#cfc8e2] bg-[#f8f5ff] text-[#24135f]"
                        : isCurrentMonth
                        ? "text-[#24135f] hover:bg-[#f7f4ff]"
                        : "text-[#b2abc8] hover:bg-[#faf8ff]"
                    } ${disabled ? "cursor-not-allowed opacity-35 hover:bg-transparent" : ""}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eee8f7] pt-4">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-[13px] font-semibold text-[#7b7498] transition hover:text-[#24135f]"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canSelectToday) {
                    selectDate(today);
                  }
                }}
                disabled={!canSelectToday}
                className="inline-flex items-center rounded-full bg-[#f7f4ff] px-4 py-2 text-[13px] font-bold text-[#24135f] transition hover:bg-[#eee7ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Today
              </button>
            </div>

            <p className="mt-3 text-[12px] text-[#8a84a4]">
              {monthEnd.toLocaleDateString("en-PH", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
