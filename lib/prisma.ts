import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizeDatabaseUrl(value: string, options?: { direct?: boolean }) {
  try {
    const url = new URL(value);
    const isSupabasePooler = url.hostname.endsWith(".pooler.supabase.com");
    const projectRef = url.username.startsWith("postgres.")
      ? url.username.slice("postgres.".length)
      : null;

    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }

    if (isSupabasePooler && !options?.direct && !url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }

    if (options?.direct && isSupabasePooler && projectRef) {
      url.hostname = `db.${projectRef}.supabase.co`;
      url.port = "5432";
      url.searchParams.delete("pgbouncer");
      url.searchParams.delete("connection_limit");
    }

    return url.toString();
  } catch {
    return value;
  }
}

function normalizeDatabaseEnvironment() {
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);
  }

  if (process.env.DIRECT_URL) {
    process.env.DIRECT_URL = normalizeDatabaseUrl(process.env.DIRECT_URL, { direct: true });
  }
}

normalizeDatabaseEnvironment();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
