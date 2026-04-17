import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[24px] border border-[#e3def1] bg-white shadow-[0_16px_40px_rgba(36,19,95,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}
