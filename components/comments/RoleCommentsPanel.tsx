"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import PaginationControls from "@/components/secretary/PaginationControls";
import SummaryCommentsTable, {
  SummaryComment,
} from "@/components/secretary/SummaryCommentsTable";
import InlineLoadingIndicator from "@/components/ui/InlineLoadingIndicator";

type RoleCommentsPanelProps = {
  title: string;
  profileName: string;
  profileRole: string;
  academicYear: string;
  years: string[];
  comments: SummaryComment[];
  start: number;
  end: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onYearChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  searchInput?: string;
  searchPlaceholder?: string;
  onSearchInputChange?: (value: string) => void;
  onSearch?: () => void;
  isLoading?: boolean;
  suggestions?: Array<{
    id: number;
    label: string;
    sublabel?: string;
  }>;
  onSuggestionSelect?: (suggestion: { id: number; label: string; sublabel?: string }) => void;
};

export default function RoleCommentsPanel({
  title,
  profileName,
  profileRole,
  academicYear,
  years,
  comments,
  start,
  end,
  total,
  hasPrevious,
  hasNext,
  onYearChange,
  onPrevious,
  onNext,
  searchInput,
  searchPlaceholder = "Search",
  onSearchInputChange,
  onSearch,
  isLoading = false,
  suggestions = [],
  onSuggestionSelect,
}: RoleCommentsPanelProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (typeof searchInput !== "string") {
      return [];
    }

    const normalized = searchInput.trim().toLowerCase();
    if (!normalized) {
      return suggestions.slice(0, 8);
    }

    return suggestions
      .filter((suggestion) =>
        `${suggestion.label} ${suggestion.sublabel || ""}`.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [searchInput, suggestions]);

  return (
    <section>
      <h2 className="text-[20px] font-extrabold text-[#1f1a52]">{title}</h2>
      <div className="mt-4 rounded-[24px] border border-[#e3def1] bg-white p-5 shadow-[0_16px_36px_rgba(36,19,95,0.08)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ebdbff] text-[#5c4599] shadow-[0_12px_28px_rgba(92,69,153,0.16)]">
            <UserRound size={34} />
          </div>
          <div>
            <p className="text-[18px] font-bold leading-tight text-[#24135f]">{profileName}</p>
            <p className="mt-1 text-[14px] leading-tight text-[#6c6684]">{profileRole}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[15px] font-bold text-[#24135f]">Select Academic Year:</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {typeof searchInput === "string" && onSearchInputChange && onSearch && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[180px]">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    placeholder={searchPlaceholder}
                    onChange={(event) => onSearchInputChange(event.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setShowSuggestions(false);
                        onSearch();
                      }
                    }}
                    className="app-input h-[44px] rounded-[16px] pl-9 text-[13px]"
                  />

                  {showSuggestions && filteredSuggestions.length > 0 && onSuggestionSelect && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[18px] border border-[#d9d3e8] bg-white p-2 shadow-[0_18px_40px_rgba(36,19,95,0.14)]">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onSuggestionSelect(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full flex-col rounded-[12px] px-3 py-2 text-left transition hover:bg-[#f8f6ff]"
                        >
                          <span className="text-[13px] font-semibold text-[#24135f]">
                            {suggestion.label}
                          </span>
                          {suggestion.sublabel && (
                            <span className="text-[11px] text-[#7b7498]">{suggestion.sublabel}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onSearch}
                  className="app-btn-primary min-h-[44px] px-4 py-2 text-[13px] sm:min-h-[44px]"
                >
                  Search
                </button>
              </div>
            )}

            <div className="lg:w-[190px]">
              <AcademicYearSelect
                value={academicYear}
                options={years.length > 0 ? years : [academicYear || "No Years"]}
                onChange={onYearChange}
                hideLabel
                className="justify-end"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[20px] border border-[#dcd7e7] bg-white shadow-[0_12px_30px_rgba(36,19,95,0.06)]">
          <div className="flex items-center justify-between border-b border-[#ece7f6] bg-[#faf8ff] px-4 py-4">
            <h3 className="text-[16px] font-bold text-[#24135f]">Comments list</h3>
            {isLoading && (
              <InlineLoadingIndicator label="Refreshing comments..." />
            )}
          </div>
          <SummaryCommentsTable comments={comments} startIndex={start} />
          <PaginationControls
            start={start}
            end={end}
            total={total}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </div>
      </div>
    </section>
  );
}
