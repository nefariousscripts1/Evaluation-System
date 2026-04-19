import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/sessionprovider";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

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
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isPublicShelllessRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  return (
    <html lang="en">
      <body className={poppins.className}>
        <SessionProvider session={session}>
          {session && !isPublicShelllessRoute ? (
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
