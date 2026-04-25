"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <div className="app-auth-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-[#e3def1] bg-white p-8 text-center shadow-[0_24px_56px_rgba(36,19,95,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b7498]">
          Something Went Wrong
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-[#24135f]">
          We hit an unexpected problem.
        </h1>
        <p className="mt-3 text-sm text-[#6c6684]">
          The request did not complete successfully. Please try the page again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="app-btn-primary mt-6 inline-flex px-5 py-3"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
