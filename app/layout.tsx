import type { Metadata } from "next";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/sessionprovider";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Digital Evaluation System",
  description: "Faculty Evaluation System for University",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Get the current path - we need to check in a client component
  // For now, we'll check if session exists - login page doesn't have session

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {session ? (
            <div className="app-shell-bg flex min-h-screen min-w-0">
              <Sidebar />
              <div className="min-w-0 flex-1 transition-all duration-300">
                <Navbar />
                <main className="min-h-screen min-w-0 bg-transparent pt-16 lg:pt-0">
                  {children}
                </main>
              </div>
            </div>
          ) : (
            <main className="min-h-screen bg-white">{children}</main>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
