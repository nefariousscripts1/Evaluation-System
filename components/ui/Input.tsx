import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-[#24135f]">{label}</label>
      )}
      <input
        className={`app-input ${className}`}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-[#c53b4f]">{error}</p>}
    </div>
  );
}
