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
      <div className="mt-4 border-t border-[#8e8e8e] pt-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ebdbff] text-[#5c4599]">
            <UserRound size={34} />
          </div>
          <div>
            <p className="text-[18px] font-bold leading-tight text-[#191919]">{profileName}</p>
            <p className="text-[14px] leading-tight text-[#191919]">{profileRole}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[15px] font-bold text-[#191919]">Select Academic Year:</p>
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
                    className="h-[40px] w-full rounded-[4px] border border-[#cfcadf] bg-white pl-9 pr-4 text-[13px] text-[#24135f] outline-none focus:border-[#24135f]"
                  />

                  {showSuggestions && filteredSuggestions.length > 0 && onSuggestionSelect && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[8px] border border-[#d9d3e8] bg-white shadow-lg">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onSuggestionSelect(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="flex w-full flex-col px-3 py-2 text-left transition hover:bg-[#f8f6ff]"
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
                  className="min-h-[44px] rounded-[4px] bg-[#24135f] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#1b0f4d] sm:min-h-[40px]"
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

        <div className="mt-5 rounded-[6px] border border-[#dcd7e7]">
          <div className="flex items-center justify-between border-b border-[#ece7f6] px-4 py-3">
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
