function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
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
    const normalizedRailwayUrl = railwayUrl.startsWith("http")
      ? railwayUrl
      : `https://${railwayUrl}`;

    return normalizeUrl(normalizedRailwayUrl);
  }

  return "http://localhost:3000";
}
