import prisma from "@/lib/db";
import {
  buildDatabaseErrorDetails,
  isDatabaseConnectionError,
} from "@/lib/database-health";
import { hashPassword, verifyPassword } from "@/lib/password-auth";
import { staffLoginSchema } from "@/lib/validation";

export type StaffAuthFailureReason =
  | "validation_failed"
  | "user_not_found"
  | "user_deleted"
  | "role_mismatch"
  | "password_invalid"
  | "database_unreachable"
  | "server_error";

export type StaffAuthResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
        mustChangePassword: boolean;
      };
    }
  | {
      ok: false;
      reason: StaffAuthFailureReason;
      details?: Record<string, unknown>;
    };

export async function authorizeStaffCredentials(credentials: unknown): Promise<StaffAuthResult> {
  try {
    const parsedCredentials = staffLoginSchema.safeParse(credentials);

    if (!parsedCredentials.success) {
      return {
        ok: false,
        reason: "validation_failed",
        details: {
          issues: parsedCredentials.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      };
    }

    const { email, password, role } = parsedCredentials.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { ok: false, reason: "user_not_found", details: { email, role } };
    }

    if (user.deletedAt) {
      return {
        ok: false,
        reason: "user_deleted",
        details: {
          email,
          role,
          userId: user.id,
          deletedAt: user.deletedAt.toISOString(),
        },
      };
    }

    if (user.role !== role) {
      return {
        ok: false,
        reason: "role_mismatch",
        details: {
          email,
          selectedRole: role,
          actualRole: user.role,
          userId: user.id,
        },
      };
    }

    const passwordResult = await verifyPassword(password, user.password);

    if (!passwordResult.isValid) {
      return {
        ok: false,
        reason: "password_invalid",
        details: {
          email,
          role,
          userId: user.id,
        },
      };
    }

    if (passwordResult.shouldRehash) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashPassword(password),
        },
      });
    }

    return {
      ok: true,
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      const details = buildDatabaseErrorDetails(error);
      console.error("[auth] database_unreachable", details);

      return {
        ok: false,
        reason: "database_unreachable",
        details,
      };
    }

    const details = {
      message: error instanceof Error ? error.message : "Unknown server error",
      name: error instanceof Error ? error.name : "UnknownError",
    };
    console.error("[auth] server_error", details);

    return {
      ok: false,
      reason: "server_error",
      details,
    };
  }
}
