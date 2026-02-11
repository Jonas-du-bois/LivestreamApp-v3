type RateLimitRecord = {
  count: number;
  start: number;
  timeout: any;
};

const limits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

/**
 * Checks if the given IP address (or key) is rate limited.
 * Returns true if the limit is exceeded.
 */
export const isRateLimited = (key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): boolean => {
  const now = Date.now();
  const record = limits.get(key);

  // If no record, create one
  if (!record) {
    const timeout = setTimeout(() => limits.delete(key), windowMs);
    limits.set(key, { count: 1, start: now, timeout });
    return false;
  }

  // If window expired (safety check, though setTimeout should handle it)
  if (now - record.start > windowMs) {
    clearTimeout(record.timeout);
    limits.delete(key);

    const timeout = setTimeout(() => limits.delete(key), windowMs);
    limits.set(key, { count: 1, start: now, timeout });
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
