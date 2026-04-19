"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import PaginationControls from "@/components/secretary/PaginationControls";
import ProfileInfoCard from "@/components/secretary/ProfileInfoCard";
import SummaryCommentsTable, {
  SummaryComment,
} from "@/components/secretary/SummaryCommentsTable";
import AppSelect from "@/components/ui/AppSelect";
import PortalPageLoader from "@/components/ui/PortalPageLoader";
import {
  getCampusDirectorRoleFilterLabel,
  getCampusDirectorRoleOptions,
  type CampusDirectorRoleFilter,
} from "@/lib/reporting-roles";

type TargetOption = {
  id: number;
  label: string;
  sublabel?: string;
};

type CampusDirectorCommentsResponse = {
  academicYear: string;
  years: string[];
  semesters: string[];
  semester: string;
  role: CampusDirectorRoleFilter;
  selectedTarget: {
    id: number;
    name: string;
    label: string;
  } | null;
  comments: SummaryComment[];
  total: number;
};

const pageSize = 5;
const roleOptions = getCampusDirectorRoleOptions();

export default function CampusDirectorCommentsView() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [role, setRole] = useState<CampusDirectorRoleFilter>("all");
  const [academicYear, setAcademicYear] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<SummaryComment[]>([]);
  const [selectedTarget, setSelectedTarget] =
    useState<CampusDirectorCommentsResponse["selectedTarget"]>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const fetchTargetOptions = async () => {
      try {
        const params = new URLSearchParams({ role });
        const res = await fetch(`/api/campus-director/targets?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Failed to load search suggestions");
        }

        setTargetOptions(
          data.map(
            (target: {
              id: number;
              name: string | null;
              email: string;
              department: string | null;
              roleLabel: string;
            }) => ({
              id: target.id,
              label: target.name || target.email,
              sublabel: [target.roleLabel, target.department || target.email].filter(Boolean).join(" • "),
            })
          )
        );
      } catch (err) {
        console.error(err);
        setTargetOptions([]);
      }
    };

    setSearchInput("");
    setSearchTerm("");
    setSelectedTargetId(null);
    setShowSuggestions(false);
    setPage(1);
    fetchTargetOptions();
  }, [role]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          semester: "all",
          role,
        });

        if (searchTerm) {
          params.set("search", searchTerm);
        }

        if (selectedTargetId) {
          params.set("targetId", String(selectedTargetId));
        }

        if (academicYear) {
          params.set("academicYear", academicYear);
        }

        const res = await fetch(`/api/campus-director/comments?${params.toString()}`, {
          cache: "no-store",
        });
        const data: CampusDirectorCommentsResponse & { message?: string } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load campus director comments");
        }

        setAcademicYear(data.academicYear);
        setAcademicYearOptions(data.years.length > 0 ? data.years : [data.academicYear]);
        setSelectedTarget(data.selectedTarget);
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
        hasLoadedOnceRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load campus director comments");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [academicYear, page, role, searchTerm, selectedTargetId]);

  const filteredSuggestions = useMemo(() => {
    const normalized = searchInput.trim().toLowerCase();

    if (!normalized) {
      return targetOptions.slice(0, 8);
    }

    return targetOptions
      .filter((suggestion) =>
        `${suggestion.label} ${suggestion.sublabel || ""}`.toLowerCase().includes(normalized)
      )
      .slice(0, 8);
  }, [searchInput, targetOptions]);

  const startIndex = (page - 1) * pageSize;
  const startDisplay = totalComments === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + pageSize, totalComments);
  const totalPages = Math.max(1, Math.ceil(totalComments / pageSize));

  const handleSearch = () => {
    setPage(1);
    setSearchTerm(searchInput.trim());
    setSelectedTargetId(null);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: TargetOption) => {
    setSearchInput(suggestion.label);
    setSearchTerm(suggestion.label);
    setSelectedTargetId(suggestion.id);
    setPage(1);
    setShowSuggestions(false);
  };

  if (loading && !hasLoadedOnceRef.current) {
    return (
      <PortalPageLoader
        title="View Summary Comments"
        description="Loading campus-wide comment filters, search suggestions, and evaluated roles..."
        cards={1}
        compact
      />
    );
  }

  return (
    <main className="app-page-with-topbar">
      <div className="app-page-card max-w-[1600px]">
        <div className="pb-5">
          <h1 className="text-[28px] font-extrabold leading-tight text-[#24135f]">
            View Summary Comments
          </h1>
          <p className="mt-1 text-[13px] text-[#6c6684]">
            Search comments by role, academic year, and evaluated user.
          </p>
        </div>

        {error ? (
          <div className="app-alert-danger">{error}</div>
        ) : (
          <section className="rounded-[24px] border border-[#dddddd] bg-white p-4 shadow-[0_14px_34px_rgba(36,19,95,0.06)] sm:p-6">
            {selectedTarget ? (
              <ProfileInfoCard name={selectedTarget.name} label={selectedTarget.label} />
            ) : (
              <div className="rounded-[8px] border border-dashed border-[#d8d2e6] bg-[#faf8ff] px-5 py-4 text-[14px] text-[#6c6684]">
                No comments found for the selected role and academic year yet.
              </div>
            )}

            <div className="mt-5 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
              <div>
                <AppSelect
                  value={role}
                  onChange={(nextValue) => setRole(nextValue as CampusDirectorRoleFilter)}
                  options={roleOptions}
                  triggerClassName="min-h-[44px] rounded-[16px] text-[13px]"
                />
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    placeholder={`Search ${getCampusDirectorRoleFilterLabel(role)}`}
                    onChange={(event) => {
                      setSearchInput(event.target.value);
                      setSelectedTargetId(null);

                      if (!event.target.value.trim()) {
                        setPage(1);
                        setSearchTerm("");
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSearch();
                      }
                    }}
                    className="app-input h-[44px] rounded-[16px] pl-9 text-[13px]"
                  />

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[18px] border border-[#d9d3e8] bg-white p-2 shadow-[0_18px_40px_rgba(36,19,95,0.14)]">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSuggestionSelect(suggestion);
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
                  onClick={handleSearch}
                  className="app-btn-secondary px-4 py-2 text-[13px]"
                >
                  Search
                </button>
              </div>

              <div className="w-full">
                <AcademicYearSelect
                  value={academicYear}
                  options={academicYearOptions.length > 0 ? academicYearOptions : [academicYear || "No Years"]}
                  onChange={(value) => {
                    setAcademicYear(value);
                    setPage(1);
                  }}
                  hideLabel
                  className="justify-end"
                />
              </div>
            </div>

            {searchTerm && !selectedTarget && (
              <p className="mt-4 text-[13px] text-[#6c6684]">
                No {getCampusDirectorRoleFilterLabel(role).toLowerCase()} matched your search.
              </p>
            )}

            <div className="mt-4 rounded-[18px]">
              <div className="border-b border-[#ece7f6] px-4 py-3">
                <h3 className="text-[16px] font-bold text-[#24135f]">Comments list</h3>
              </div>
              <SummaryCommentsTable comments={comments} startIndex={startDisplay} />
              <PaginationControls
                start={startDisplay}
                end={endDisplay}
                total={totalComments}
                hasPrevious={page > 1}
                hasNext={page < totalPages}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
