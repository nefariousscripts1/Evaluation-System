"use client";

import { Loader2 } from "lucide-react";

type InlineLoadingIndicatorProps = {
  label?: string;
};

export default function InlineLoadingIndicator({
  label = "Loading...",
}: InlineLoadingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#f7f4ff] px-3 py-1.5 text-[13px] font-medium text-[#6c6684]">
      <Loader2 size={14} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}
