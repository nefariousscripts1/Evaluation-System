export default async function StudentEvaluateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen evaluation portal without sidebar
  return <div className="w-full bg-[#f5f4f7]">{children}</div>;
}
