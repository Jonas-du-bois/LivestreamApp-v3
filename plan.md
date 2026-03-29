So the memory leak / DoS in `rateLimit.ts` is the best vulnerability to fix.
Actually, wait! There is another memory leak vector:
When `windowMs` is passed in `setTimeout(() => limits.delete(key), windowMs)`, if the window is long (e.g. 10 minutes), the timer stays in memory. But more importantly, creating a huge number of `setTimeout` calls is a classic Node.js memory exhaustion vulnerability. V8 can crash if too many timers are active, and `limits` will grow unbounded because there's no cap on `limits.size`.
Wait, we should add a size cap and remove `setTimeout`.

```typescript
type RateLimitRecord = {
  count: number;
  start: number;
  windowMs: number;
};

const limits = new Map<string, RateLimitRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;
const MAX_LIMITS_SIZE = 10000;

// Periodically clean up expired records to prevent memory leaks/DoS
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of limits.entries()) {
    if (now - record.start > record.windowMs) {
      limits.delete(key);
    }
  }
}, 60 * 1000).unref(); // Run every minute

export const isRateLimited = (key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): boolean => {
  const now = Date.now();
  const record = limits.get(key);

  if (!record) {
    // Security: Prevent Map from growing indefinitely (DoS vector via spoofed IPs)
    if (limits.size >= MAX_LIMITS_SIZE) {
      limits.clear(); // Emergency cleanup
    }
    limits.set(key, { count: 1, start: now, windowMs });
    return false;
  }

  if (now - record.start > windowMs) {
    record.count = 1;
    record.start = now;
    record.windowMs = windowMs;
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
};
```
Is there any other security vulnerability?
Wait, if `key` is `__proto__`, does `Map` care?
`Map` treats `__proto__` as just a string key, so it's immune to prototype pollution. Object would be vulnerable, but `Map` is fine.

Let's double check if there are any hardcoded secrets.
`adminPassword: process.env.NUXT_ADMIN_PASSWORD` - good.
What about `app/utils/rateLimit.ts`? Oh wait, it's `server/utils/rateLimit.ts`.
Let's modify it.
