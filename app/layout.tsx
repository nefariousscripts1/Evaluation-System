import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

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
  
  // Check if the current path is login or register
  // We need to do this check in a client component, but for now we'll check if session exists
  // For login/register pages, session will be null anyway

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {session ? (
            <div className="flex">
              <Sidebar />
              <div className="ml-[294px] flex-1">
                <Navbar />
                <main className="min-h-screen bg-[#f3f3f3]">{children}</main>
              </div>
            </div>
          ) : (
            <main className="min-h-screen bg-[#f3f3f3]">{children}</main>
          )}
        </SessionProvider>
      </body>
    </html>
  );
}