type RateLimitRecord = {
  count: number;
  start: number;
  timeout: any;
};

const limits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

/**
 * Checks if the given IP address is rate limited.
 * Returns true if the limit is exceeded.
 */
export const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = limits.get(ip);

  // If no record, create one
  if (!record) {
    const timeout = setTimeout(() => limits.delete(ip), WINDOW_MS);
    limits.set(ip, { count: 1, start: now, timeout });
    return false;
  }

  // If window expired (safety check, though setTimeout should handle it)
  if (now - record.start > WINDOW_MS) {
    clearTimeout(record.timeout);
    limits.delete(ip);

    const timeout = setTimeout(() => limits.delete(ip), WINDOW_MS);
    limits.set(ip, { count: 1, start: now, timeout });
    return false;
  }

  // Check limit
  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  // Increment
  record.count++;
  return false;
};
