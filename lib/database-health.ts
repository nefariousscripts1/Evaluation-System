import { Prisma } from "@prisma/client";

type DatabaseUrlDiagnostics = {
  hasDatabaseUrl: boolean;
  protocol: string | null;
  host: string | null;
  port: string | null;
  database: string | null;
  isRailwayProxy: boolean;
  railwayPublicDomain: string | null;
  railwayStaticUrl: string | null;
  vercelUrl: string | null;
  vercelProjectProductionUrl: string | null;
};

function safeUrlValue(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getDatabaseUrlDiagnostics(): DatabaseUrlDiagnostics {
  const rawDatabaseUrl = safeUrlValue(process.env.DATABASE_URL);

  if (!rawDatabaseUrl) {
    return {
      hasDatabaseUrl: false,
      protocol: null,
      host: null,
      port: null,
      database: null,
      isRailwayProxy: false,
      railwayPublicDomain: safeUrlValue(process.env.RAILWAY_PUBLIC_DOMAIN),
      railwayStaticUrl: safeUrlValue(process.env.RAILWAY_STATIC_URL),
      vercelUrl: safeUrlValue(process.env.VERCEL_URL),
      vercelProjectProductionUrl: safeUrlValue(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    };
  }

  try {
    const parsed = new URL(rawDatabaseUrl);

    return {
      hasDatabaseUrl: true,
      protocol: parsed.protocol || null,
      host: parsed.hostname || null,
      port: parsed.port || null,
      database: parsed.pathname.replace(/^\/+/, "") || null,
      isRailwayProxy: parsed.hostname.endsWith(".proxy.rlwy.net"),
      railwayPublicDomain: safeUrlValue(process.env.RAILWAY_PUBLIC_DOMAIN),
      railwayStaticUrl: safeUrlValue(process.env.RAILWAY_STATIC_URL),
      vercelUrl: safeUrlValue(process.env.VERCEL_URL),
      vercelProjectProductionUrl: safeUrlValue(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    };
  } catch {
    return {
      hasDatabaseUrl: true,
      protocol: null,
      host: null,
      port: null,
      database: null,
      isRailwayProxy: false,
      railwayPublicDomain: safeUrlValue(process.env.RAILWAY_PUBLIC_DOMAIN),
      railwayStaticUrl: safeUrlValue(process.env.RAILWAY_STATIC_URL),
      vercelUrl: safeUrlValue(process.env.VERCEL_URL),
      vercelProjectProductionUrl: safeUrlValue(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    };
  }
}

export function isDatabaseConnectionError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /can't reach database server|p1001|connect|connection|timed out|timeout|econnrefused/i.test(
    error.message
  );
}

export function buildDatabaseErrorDetails(error: unknown) {
  return {
    message: error instanceof Error ? error.message : "Unknown database error",
    name: error instanceof Error ? error.name : "UnknownError",
    database: getDatabaseUrlDiagnostics(),
  };
}
