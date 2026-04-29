import bcrypt from "bcrypt";

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2x$", "$2y$"];

export function looksLikeBcryptHash(value: string) {
  return BCRYPT_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export async function verifyPassword(password: string, storedPassword: string) {
  if (looksLikeBcryptHash(storedPassword)) {
    return {
      isValid: await bcrypt.compare(password, storedPassword),
      shouldRehash: false,
    };
  }

  return {
    isValid: password === storedPassword,
    shouldRehash: password === storedPassword,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
