import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600">Evaluation Submitted!</h1>
        <p className="mt-2 text-gray-600">Thank you for your feedback.</p>
        <div className="mt-6 space-x-4">
          <Link href="/evaluate" className="inline-block rounded-md bg-primary px-4 py-2 text-white hover:bg-[#0F1F2B]">
            Evaluate Another
          </Link>
          <Link href="/" className="inline-block rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}