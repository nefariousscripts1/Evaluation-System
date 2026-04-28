import type { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ApiRouteError } from "@/lib/api";
import prisma from "@/lib/db";

export type AppRole = Role;

function isAllowedRole(role: string | undefined, allowedRoles?: AppRole[]) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return Boolean(role && allowedRoles.includes(role as AppRole));
}

async function validateSession(session: Session | null) {
  if (!session) {
    return null;
  }

  const userId = Number.parseInt(session.user.id ?? "", 10);

  if (!Number.isInteger(userId) || userId <= 0 || !session.user.email) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      email: session.user.email,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      id: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function getAppSession() {
  return validateSession(await getServerSession(authOptions));
}

export async function requirePageSession() {
  const session = await getAppSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireApiSession(allowedRoles?: AppRole[]) {
  const session = await getAppSession();

  if (!session) {
    throw new ApiRouteError("Unauthorized", { status: 401 });
  }

  if (!isAllowedRole(session.user.role, allowedRoles)) {
    throw new ApiRouteError("Forbidden", { status: 403 });
  }

  return session;
}

export async function requireApiUserId(allowedRoles?: AppRole[]) {
  const session = await requireApiSession(allowedRoles);
  const userId = Number.parseInt(session.user.id ?? "", 10);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new ApiRouteError("Invalid session user", { status: 401 });
  }

  return { session, userId };
}

export async function requirePageRole(allowedRoles?: AppRole[]) {
  const session = await getAppSession();

  if (!session) {
    redirect("/login");
  }

  if (!isAllowedRole(session.user.role, allowedRoles)) {
    redirect("/unauthorized");
  }

  return session;
}

export function getDefaultRouteForRole(session: Session | null) {
  const role = session?.user?.role;

  switch (role) {
    case "secretary":
      return "/secretary/dashboard";
    case "student":
      return "/student/evaluate";
    case "faculty":
      return "/faculty/dashboard";
    case "chairperson":
      return "/chairperson/results";
    case "dean":
      return "/dean/results";
    case "director":
      return "/director/results";
    case "campus_director":
      return "/campus-director/results";
    default:
      return "/login";
  }
}
