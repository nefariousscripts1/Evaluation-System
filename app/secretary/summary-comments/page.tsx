"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import AcademicYearSelect from "@/components/secretary/AcademicYearSelect";
import PaginationControls from "@/components/secretary/PaginationControls";
import ProfileInfoCard from "@/components/secretary/ProfileInfoCard";
import SummaryCommentsTable, {
  SummaryComment,
} from "@/components/secretary/SummaryCommentsTable";

type SummaryCommentsResponse = {
  years: string[];
  selectedInstructor: {
    id: number;
    name: string;
    label: string;
  } | null;
  comments: SummaryComment[];
  total: number;
};

const pageSize = 5;

export default function SummaryCommentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<SummaryComment[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedInstructor, setSelectedInstructor] =
    useState<SummaryCommentsResponse["selectedInstructor"]>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Search for an instructor to view student comments.");

  const startIndex = (page - 1) * pageSize;
  const startDisplay = total === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });

        if (searchTerm) params.set("search", searchTerm);
        if (academicYear) params.set("academicYear", academicYear);

        const res = await fetch(`/api/summary-comments?${params.toString()}`, {
          cache: "no-store",
        });
        const data: SummaryCommentsResponse & { message?: string } = await res.json();

        if (data.years.length > 0) {
          setAcademicYearOptions(data.years);
          if (!academicYear || !data.years.includes(academicYear)) {
            setAcademicYear(data.years[0]);
          }
        }

        setSelectedInstructor(data.selectedInstructor);
        setComments(data.comments || []);
        setTotal(data.total || 0);

        if (!searchTerm) {
          setMessage("Search for an instructor to view student comments.");
        } else if (!data.selectedInstructor) {
          setMessage("No instructor matched your search.");
        } else if ((data.total || 0) === 0) {
          setMessage("No student comments found for this instructor in the selected academic year.");
        } else {
          setMessage("");
        }
      } catch (error) {
        console.error("Failed to load summary comments:", error);
        setSelectedInstructor(null);
        setComments([]);
        setTotal(0);
        setMessage("Unable to load summary comments right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [searchTerm, academicYear, page]);

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  return (
    <main className="px-5 py-6">
      <div className="mx-auto max-w-[1380px] rounded-[10px] border border-[#dddddd] bg-white px-8 py-6">
        <div className="pb-5">
          <h1 className="text-[26px] font-extrabold leading-none text-[#24135f] md:text-[30px]">
            View Director of Instruction
          </h1>
          <h2 className="text-[26px] font-extrabold leading-none text-[#24135f] md:text-[30px]">
            Summary Comments
          </h2>
        </div>

        <div className="space-y-5 rounded-[6px] border border-[#e3e3e3] bg-white p-5">
          {selectedInstructor ? (
            <ProfileInfoCard
              name={selectedInstructor.name}
              label={selectedInstructor.label}
            />
          ) : (
            <div className="rounded-[8px] border border-dashed border-[#d8d2e6] bg-[#faf8ff] px-5 py-4 text-[14px] text-[#6c6684]">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
              <div className="relative w-full md:max-w-[320px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8e89aa]"
                />
                <input
                  type="text"
                  placeholder="Search Instructor"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="h-[40px] w-full rounded-[4px] border border-[#cfcadf] bg-white pl-10 pr-4 text-[14px] text-[#24135f] outline-none focus:border-[#24135f]"
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="rounded-[4px] bg-[#24135f] px-5 py-2 text-[14px] font-bold text-white transition hover:bg-[#1b0f4d]"
              >
                Search
              </button>
            </div>

            <div className="flex justify-start lg:justify-end">
              <AcademicYearSelect
                value={academicYear}
                options={academicYearOptions.length > 0 ? academicYearOptions : ["No Years"]}
                onChange={handleAcademicYearChange}
              />
            </div>
          </div>

          {searchTerm && selectedInstructor && total === 0 && (
            <p className="text-[13px] text-[#6c6684]">
              No comments were saved for <span className="font-semibold text-[#24135f]">{selectedInstructor.name}</span> in <span className="font-semibold text-[#24135f]">{academicYear}</span>.
            </p>
          )}

          {!searchTerm && academicYear && (
            <p className="text-[13px] text-[#6c6684]">
              Search for an instructor. Latest available academic year is <span className="font-semibold text-[#24135f]">{academicYear}</span>.
            </p>
          )}

          <div className="rounded-[6px] border border-[#dcd7e7]">
            <SummaryCommentsTable
              comments={comments}
              startIndex={startDisplay}
            />
          </div>

          {loading && (
            <p className="px-1 text-[13px] text-[#6c6684]">Loading comments...</p>
          )}

          <PaginationControls
            start={startDisplay}
            end={endDisplay}
            total={total}
            hasPrevious={page > 1}
            hasNext={page < totalPages}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        </div>
      </div>
    </main>
  );
}
