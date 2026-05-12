import { Prisma } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api";
import prisma from "@/lib/db";
import {
  buildDatabaseErrorDetails,
  getDatabaseUrlDiagnostics,
  isDatabaseConnectionError,
} from "@/lib/database-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<Array<{ ok: bigint | number }>>`SELECT 1 AS ok`;
    const normalizedResult = result.map((row) => ({
      ok: typeof row.ok === "bigint" ? Number(row.ok) : row.ok,
    }));

    return apiSuccess({
      ok: true,
      result: normalizedResult,
      database: getDatabaseUrlDiagnostics(),
    });
  } catch (error) {
    const details = buildDatabaseErrorDetails(error);

    if (
      isDatabaseConnectionError(error) ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    ) {
      console.error("[health:db] database connection failed", details);
      return apiError("Database connection failed", 503, {
        ok: false,
        reason: "database_unreachable",
        ...details,
      });
    }

    console.error("[health:db] unexpected error", details);
    return apiError("Database health check failed", 500, {
      ok: false,
      reason: "server_error",
      ...details,
    });
  }
}
