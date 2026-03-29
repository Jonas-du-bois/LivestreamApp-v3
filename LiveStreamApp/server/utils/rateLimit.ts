type RateLimitRecord = {
  count: number;
  start: number;
  windowMs: number;
};

const limits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;
const MAX_LIMITS_SIZE = 10000;

// Security: Periodically clean up expired records to prevent memory leaks/DoS.
// Using a single interval prevents unbounded setTimeout creation when under attack.
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of limits.entries()) {
    if (now - record.start > record.windowMs) {
      limits.delete(key);
    }
  }
}, WINDOW_MS).unref(); // unref to avoid blocking process exit

/**
 * Checks if the given IP address (or key) is rate limited.
 * Returns true if the limit is exceeded.
 */
export const isRateLimited = (key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): boolean => {
  const now = Date.now();
  const record = limits.get(key);

  if (!record) {
    // Security: Emergency circuit breaker to prevent Map from growing indefinitely
    // due to IP spoofing (X-Forwarded-For) exhaustion attacks.
    if (limits.size >= MAX_LIMITS_SIZE) {
      limits.clear();
    }
    limits.set(key, { count: 1, start: now, windowMs });
    return false;
  }

  // If window expired
  if (now - record.start > windowMs) {
    record.count = 1;
    record.start = now;
    record.windowMs = windowMs;
    return false;
  }

  // Check limit
  if (record.count >= maxRequests) {
    return true;
  }

  // Increment
  record.count++;
  return false;
};
