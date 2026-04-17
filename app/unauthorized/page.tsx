import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="app-auth-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#e3def1] bg-white p-8 text-center shadow-[0_24px_56px_rgba(36,19,95,0.12)]">
        <div className="mb-4 text-6xl">🔒</div>
        <h1 className="text-2xl font-bold text-[#c53b4f]">Unauthorized Access</h1>
        <p className="mt-3 text-sm text-[#6c6684]">
          You do not have permission to access this page.
        </p>
        <Link href="/" className="app-btn-primary mt-6 inline-flex px-5 py-3">
          Go to Home
        </Link>
      </div>
    </div>
  );
}
