import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-[16px] font-semibold transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";
  const variantClasses = {
    primary:
      "bg-[#24135f] text-white shadow-[0_12px_28px_rgba(36,19,95,0.1)] hover:bg-[#1b0f4d]",
    secondary:
      "border border-[#e3def1] bg-white text-[#24135f] shadow-[0_10px_24px_rgba(36,19,95,0.08)] hover:bg-[#f7f4ff]",
    danger:
      "bg-[#c53b4f] text-white shadow-[0_12px_28px_rgba(197,59,79,0.14)] hover:bg-[#a93042]",
  };
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
