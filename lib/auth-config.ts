function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizePlatformUrl(value: string) {
  return normalizeUrl(value.startsWith("http") ? value : `https://${value}`);
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)(:\d+)?$/i.test(value);
}

function getPlatformBaseUrl() {
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

  return null;
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
  const platformUrl = getPlatformBaseUrl();
  const isHostedEnvironment = Boolean(platformUrl);

  if (explicitUrl) {
    const normalizedExplicitUrl = normalizeUrl(explicitUrl);

    // Hosted deployments should not rely on localhost auth URLs.
    if (!(isHostedEnvironment && isLocalUrl(normalizedExplicitUrl))) {
      return normalizedExplicitUrl;
    }
  }

  if (platformUrl) {
    return platformUrl;
  }

  return "http://localhost:3000";
}

export function ensureAuthEnvironment() {
  const resolvedUrl = getAppBaseUrl();

  if (!process.env.NEXTAUTH_URL || (resolvedUrl !== process.env.NEXTAUTH_URL && !isLocalUrl(resolvedUrl))) {
    process.env.NEXTAUTH_URL = resolvedUrl;
  }

  if (!process.env.AUTH_URL || (resolvedUrl !== process.env.AUTH_URL && !isLocalUrl(resolvedUrl))) {
    process.env.AUTH_URL = resolvedUrl;
  }

  if (!process.env.NEXTAUTH_SECRET && process.env.AUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;
  }
}
