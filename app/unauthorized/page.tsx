import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1>
        <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
        <Link href="/" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-white hover:bg-[#0F1F2B]">
          Go to Home
        </Link>
      </div>
    </div>
  );
}