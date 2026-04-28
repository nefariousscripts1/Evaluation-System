import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/sessionprovider";
import ProtectedSessionMonitor from "@/components/auth/ProtectedSessionMonitor";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getAppSession, getDefaultRouteForRole } from "@/lib/server-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Evaluation System",
  description: "Faculty Evaluation System for University",
};

const PUBLIC_SHELLLESS_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);
const AUTH_SHELLLESS_ROUTES = new Set(["/change-password"]);

function normalizePathname(pathname: string | null) {
  if (!pathname) {
    return "";
  }

  const pathOnly = pathname.split("?")[0] || "";
  return pathOnly !== "/" ? pathOnly.replace(/\/+$/, "") : pathOnly;
}

function isStudentRoute(pathname: string) {
  return pathname === "/student" || pathname.startsWith("/student/");
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();
  const pathname = normalizePathname((await headers()).get("x-pathname"));
  const isPublicShelllessRoute = PUBLIC_SHELLLESS_ROUTES.has(pathname);
  const isAuthShelllessRoute = AUTH_SHELLLESS_ROUTES.has(pathname);
  const isStudentPortalRoute = isStudentRoute(pathname);
  const isShelllessRoute = isPublicShelllessRoute || isAuthShelllessRoute || isStudentPortalRoute;

  if (!session && pathname && !isShelllessRoute) {
    redirect("/login");
  }

  if (!session && isAuthShelllessRoute) {
    redirect("/login");
  }

  if (session?.user.mustChangePassword && pathname !== "/change-password") {
    redirect("/change-password");
  }

  if (session && isPublicShelllessRoute) {
    const defaultRoute = session.user.mustChangePassword
      ? "/change-password"
      : getDefaultRouteForRole(session);

    if (defaultRoute !== pathname) {
      redirect(defaultRoute);
    }
  }

  return (
    <html lang="en">
      <body className="font-sans">
        <SessionProvider session={session}>
          {session && !isShelllessRoute ? (
            <div className="app-shell-bg flex min-h-screen min-w-0">
              <ProtectedSessionMonitor />
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
