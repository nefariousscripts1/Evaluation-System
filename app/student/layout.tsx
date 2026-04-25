import Sidebar from "@/components/layout/Sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: Student access uses cookies, not NextAuth sessions
  // So we don't check requirePageRole here
  return (
    <div className="flex min-h-screen bg-[#f5f4f7]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
