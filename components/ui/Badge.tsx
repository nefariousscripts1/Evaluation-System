import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-[#f6f2ff] text-[#24135f]",
    success: "bg-[#f1fbf4] text-[#18794e]",
    warning: "bg-[#fff7db] text-[#9a6700]",
    danger: "bg-[#fff4f5] text-[#c53b4f]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
