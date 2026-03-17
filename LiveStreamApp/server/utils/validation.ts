import { z } from 'zod';
import dns from 'node:dns/promises';

// --- SSRF Protection Helper ---
const isRestrictedIP = (ip: string): boolean => {
  // Simple check for basic IPv4 and IPv6 restricted ranges
  // 127.0.0.0/8
  if (/^127\./.test(ip)) return true;
  // 10.0.0.0/8
  if (/^10\./.test(ip)) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  // 192.168.0.0/16
  if (/^192\.168\./.test(ip)) return true;
  // 169.254.0.0/16
  if (/^169\.254\./.test(ip)) return true;
  // 0.0.0.0/8
  if (/^0\./.test(ip)) return true;

  // IPv6 loopback
  if (ip === '::1' || ip === '0000:0000:0000:0000:0000:0000:0000:0001') return true;
  // IPv6 ULA (fc00::/7)
  if (/^[fF][cCdD]/.test(ip)) return true;
  // IPv6 link-local (fe80::/10)
  if (/^[fF][eE][89aAbB]/.test(ip)) return true;

  return false;
};

// Timeout helper for DNS resolution to prevent DoS via slow DNS servers
const resolveWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 2000): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('DNS resolution timeout')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500),
  keys: z.object({
    p256dh: z.string().max(200),
    auth: z.string().max(100),
  }),
}).superRefine(async (data, ctx) => {
  try {
    const url = new URL(data.endpoint);

    // Security: Enforce HTTPS
    if (url.protocol !== 'https:') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Endpoint must use HTTPS protocol',
        path: ['endpoint']
      });
      return;
    }

    // Security: Prevent SSRF by checking hostname
    const hostname = url.hostname;

    // Quick check for obvious localhosts and direct restricted IP inputs
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || isRestrictedIP(hostname)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Localhost and private IP endpoints are forbidden',
        path: ['endpoint']
      });
      return;
    }

    // Resolve DNS to prevent direct IP attacks (e.g., numeric IPs, hex IPs)
    // and DNS rebinding to local IPs at registration time.
    // Use dns.resolve4/6 instead of dns.lookup to avoid libuv thread pool exhaustion.
    try {
      const records4 = await resolveWithTimeout(dns.resolve4(hostname).catch(() => [] as string[]));
      const records6 = await resolveWithTimeout(dns.resolve6(hostname).catch(() => [] as string[]));
      const allRecords = [...records4, ...records6];

      if (allRecords.length === 0) {
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endpoint hostname could not be resolved',
          path: ['endpoint']
        });
        return;
      }

      for (const ip of allRecords) {
        if (isRestrictedIP(ip)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Endpoint resolves to a restricted IP address',
            path: ['endpoint']
          });
          return;
        }
      }
    } catch (dnsError) {
       ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DNS resolution failed or timed out',
          path: ['endpoint']
       });
       return;
    }
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid or unreachable endpoint URL',
      path: ['endpoint']
    });
  }
});

const FcmSubscriptionSchema = z.object({
  type: z.literal('fcm'),
  /** FCM registration token (device token) */
  endpoint: z.string().min(10).max(4096),
});

export const SubscriptionSchema = z.discriminatedUnion('type', [
  WebSubscriptionSchema,
  FcmSubscriptionSchema,
]);

export const SyncFavoritesSchema = z.object({
  /** Web Push URL ou FCM token selon le type de subscription */
  endpoint: z.string().min(10).max(4096),
  favorites: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
  ).max(50),
});

export const isValidRoom = (room: string): boolean => {
  const allowedRooms = ['live-scores', 'schedule-updates', 'streams', 'admin-dashboard'];
  if (allowedRooms.includes(room)) return true;
  // Dynamic rooms: stream-{ObjectId}
  if (/^stream-[a-fA-F0-9]{24}$/.test(room)) return true;
  return false;
};
