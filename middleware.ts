import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow public routes
    if (
      path === "/login" ||
      path === "/register" ||
      path === "/" ||
      path === "/student/evaluate" ||
      path === "/forgot-password" ||
      path === "/reset-password"
    ) {
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;

    // Legacy STUDENT session support
    if (role === "student") {
      if (path === "/student/evaluate" || path === "/student" || path === "/") {
        return NextResponse.next();
      }
      if (path.startsWith("/secretary") || path.startsWith("/faculty") ||
          path.startsWith("/chairperson") || path.startsWith("/dean") ||
          path.startsWith("/director") || path.startsWith("/campus-director")) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // Secretary routes
    if (path.startsWith("/secretary") && role !== "secretary") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Faculty routes
    if (path.startsWith("/faculty") && role !== "faculty") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Chairperson routes
    if (path.startsWith("/chairperson") && role !== "chairperson") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Dean routes
    if (path.startsWith("/dean") && role !== "dean") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Director routes
    if (path.startsWith("/director") && role !== "director") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Campus Director routes
    if (path.startsWith("/campus-director") && role !== "campus_director") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Legacy evaluate route (for chairperson, dean, director, campus_director)
    if (path === "/evaluate" && !["chairperson", "dean", "director", "campus_director"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Results route
    if (path === "/results" && !["faculty", "chairperson", "dean", "director", "campus_director", "secretary"].includes(role)) {
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
