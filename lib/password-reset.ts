import crypto from "node:crypto";
import { getAppBaseUrl, getAuthSecret } from "@/lib/auth-config";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

type ResetTokenPayload = {
  email: string;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createPasswordResetToken(email: string, expiresInMs = ONE_HOUR_IN_MS) {
  const payload: ResetTokenPayload = {
    email,
    exp: Date.now() + expiresInMs,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyPasswordResetToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Invalid reset token");
  }

  const expectedSignature = sign(encodedPayload);

  if (signature !== expectedSignature) {
    throw new Error("Invalid reset token");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload)) as ResetTokenPayload;

  if (!payload.email || typeof payload.exp !== "number") {
    throw new Error("Invalid reset token");
  }

  if (Date.now() > payload.exp) {
    throw new Error("Reset token has expired");
  }

  return payload;
}

export function buildPasswordResetUrl(token: string) {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}
