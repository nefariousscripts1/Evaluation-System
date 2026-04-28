import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isStudentRoute(pathname: string) {
  return pathname === "/student" || pathname.startsWith("/student/");
}

function withPathnameHeader(req: { headers: Headers; nextUrl: { pathname: string } }) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (PUBLIC_ROUTES.includes(path) || isStudentRoute(path)) {
      return withPathnameHeader(req);
    }

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      const response = NextResponse.redirect(loginUrl);
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }

    const role = token.role as string;

    if (role === "student") {
      if (path === "/student/evaluate" || path === "/student" || path === "/") {
        return withPathnameHeader(req);
      }

      if (
        path.startsWith("/secretary") ||
        path.startsWith("/faculty") ||
        path.startsWith("/chairperson") ||
        path.startsWith("/dean") ||
        path.startsWith("/director") ||
        path.startsWith("/campus-director")
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }

      return withPathnameHeader(req);
    }

    if (path.startsWith("/secretary") && role !== "secretary") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/faculty") && role !== "faculty") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/chairperson") && role !== "chairperson") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/dean") && role !== "dean") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/director") && role !== "director") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/campus-director") && role !== "campus_director") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      path === "/evaluate" &&
      !["chairperson", "dean", "director", "campus_director"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (
      path === "/results" &&
      !["faculty", "chairperson", "dean", "director", "campus_director", "secretary"].includes(
        role
      )
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return withPathnameHeader(req);
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
