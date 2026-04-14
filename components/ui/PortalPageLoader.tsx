"use client";

import { Loader2 } from "lucide-react";

type PortalPageLoaderProps = {
  title?: string;
  description?: string;
  cards?: number;
  compact?: boolean;
};

export default function PortalPageLoader({
  title = "Loading portal",
  description = "Preparing your data and layout...",
  cards = 2,
  compact = false,
}: PortalPageLoaderProps) {
  return (
    <main className="px-4 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[18px] border border-[#dddddd] bg-white shadow-[0_18px_45px_rgba(36,19,95,0.08)]">
        <div className="h-1.5 bg-[linear-gradient(90deg,#24135f_0%,#5f49b8_45%,#c7b5ff_100%)]" />
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2ecff] text-[#24135f]">
                  <Loader2 size={20} className="animate-spin" />
                </span>
                <div>
                  <h2 className="text-[24px] font-extrabold text-[#24135f]">{title}</h2>
                  <p className="mt-1 text-[14px] text-[#6c6684]">{description}</p>
                </div>
              </div>
            </div>

            <div className="h-10 w-full animate-pulse rounded-[12px] bg-[#f3effc] sm:w-[220px]" />
          </div>

          <div className={`mt-8 grid gap-5 ${compact ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
            {Array.from({ length: cards }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[18px] border border-[#ece7f6] bg-[#fcfbff] p-5"
              >
                <div className="h-5 w-40 rounded-full bg-[#ece5fb]" />
                <div className="mt-5 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#efe8ff]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded-full bg-[#efe8ff]" />
                    <div className="h-3 w-28 rounded-full bg-[#f4efff]" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-12 rounded-[14px] bg-[#f4efff]" />
                  <div className="h-12 rounded-[14px] bg-[#f4efff]" />
                  <div className="h-32 rounded-[16px] bg-[#f7f4ff]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
