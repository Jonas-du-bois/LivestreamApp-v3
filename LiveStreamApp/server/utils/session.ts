import { randomBytes } from 'node:crypto';

// In-memory session store: token -> expiry timestamp
const sessions = new Map<string, number>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of sessions.entries()) {
    if (expiry < now) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000).unref(); // unref so it doesn't keep the process alive unnecessarily

/**
 * Creates a new admin session and returns the session token.
 */
export const createAdminSession = (): string => {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  return token;
};

/**
 * Verifies if the provided token is a valid admin session.
 * Returns true if valid, false otherwise.
 */
export const verifyAdminSession = (token: string): boolean => {
  const expiry = sessions.get(token);
  if (!expiry) return false;

  if (expiry < Date.now()) {
    sessions.delete(token);
    return false;
  }

  return true;
};
