import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Always allow these paths
    if (path === "/login" || path === "/register" || path === "/") {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;

    // Secretary routes
    if (path.startsWith("/secretary")) {
      if (role === "secretary") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};