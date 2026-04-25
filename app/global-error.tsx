"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global application error:", error);

  return (
    <html lang="en">
      <body className="app-auth-shell flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-[28px] border border-[#e3def1] bg-white p-8 text-center shadow-[0_24px_56px_rgba(36,19,95,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b7498]">
            Application Error
          </p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#24135f]">
            The application needs a fresh start.
          </h1>
          <p className="mt-3 text-sm text-[#6c6684]">
            Please reload the current page and try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="app-btn-primary mt-6 inline-flex px-5 py-3"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
