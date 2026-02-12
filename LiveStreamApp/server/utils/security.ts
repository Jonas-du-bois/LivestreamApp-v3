import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Generates a secure token from the password.
 * Currently uses SHA-256 hash.
 */
export const generateAdminToken = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

/**
 * Verifies if the provided token matches the password.
 * The token should be the SHA-256 hash of the password.
 * Uses constant-time comparison.
 */
export const verifyAdminToken = (token: string, password: string): boolean => {
  if (!token || !password) return false;

  const expectedToken = generateAdminToken(password);

  const bufA = Buffer.from(token, 'utf8');
  const bufB = Buffer.from(expectedToken, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
};

/**
 * Verifies if the input password matches the stored password.
 * Uses constant-time comparison to prevent timing attacks.
 */
export const verifyPassword = (inputPassword: string, storedPassword: string): boolean => {
  if (!inputPassword || !storedPassword) return false;

  // Hashing both inputs ensures equal length buffers for timingSafeEqual
  const bufA = createHash('sha256').update(inputPassword).digest();
  const bufB = createHash('sha256').update(storedPassword).digest();

  return timingSafeEqual(bufA, bufB);
};
