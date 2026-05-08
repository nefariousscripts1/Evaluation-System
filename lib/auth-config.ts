function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePlatformUrl(value: string) {
  return normalizeUrl(value.startsWith("http") ? value : `https://${value}`);
}

export function getAuthSecret() {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.PASSWORD_RESET_SECRET ||
    "dev-reset-secret"
  );
}

export function getAppBaseUrl() {
  const explicitUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

  if (explicitUrl) {
    return normalizeUrl(explicitUrl);
  }

  const railwayUrl = process.env.RAILWAY_STATIC_URL;

  if (railwayUrl) {
    return normalizePlatformUrl(railwayUrl);
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelProductionUrl) {
    return normalizePlatformUrl(vercelProductionUrl);
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return normalizePlatformUrl(vercelUrl);
  }

  return "http://localhost:3000";
}
