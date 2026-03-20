import { z } from 'zod';
import dns from 'node:dns/promises';

// --- Helper to check if an IP is private/loopback/link-local ---
const isPrivateIP = (ip: string) => {
  // IPv4 Loopback, Private, Link-local, Any (0.0.0.0 bypass)
  if (
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.') ||
    ip === '0.0.0.0'
  ) {
    return true;
  }
  // IPv4 172.16.0.0 - 172.31.255.255
  const parts = ip.split('.');
  if (parts.length === 4 && parts[0] === '172') {
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // IPv6 Loopback, Any (:: bypass), ULA, Link-local
  if (
    ip === '::1' ||
    ip === '::' ||
    ip.toLowerCase().startsWith('fc') ||
    ip.toLowerCase().startsWith('fd') ||
    ip.toLowerCase().startsWith('fe8') ||
    ip.toLowerCase().startsWith('fe9') ||
    ip.toLowerCase().startsWith('fea') ||
    ip.toLowerCase().startsWith('feb')
  ) {
    return true;
  }

  // IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (ip.toLowerCase().startsWith('::ffff:')) {
    const ipv4 = ip.substring(7);
    return isPrivateIP(ipv4);
  }

  return false;
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).superRefine(async (urlStr, ctx) => {
    try {
      const url = new URL(urlStr);

      // Enforce HTTPS
      if (url.protocol !== 'https:') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endpoint must use HTTPS',
        });
        return;
      }

      // Prevent SSRF via DNS Rebinding by resolving hostname
      const hostname = url.hostname;

      // Use explicit timeout and ensure it is cleared on success to prevent UnhandledPromiseRejection crashes
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<dns.LookupAddress[]>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DNS Timeout')), 2000);
      });

      const addresses = await Promise.race([
        dns.lookup(hostname, { all: true }),
        timeoutPromise
      ]).finally(() => clearTimeout(timer));

      if (!addresses || addresses.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Could not resolve endpoint hostname',
        });
        return;
      }

      for (const { address } of addresses) {
        if (isPrivateIP(address)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Endpoint resolves to a private or loopback IP address',
          });
          return;
        }
      }
    } catch (err: any) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err.message === 'DNS Timeout' ? 'DNS resolution timed out' : 'Invalid endpoint URL',
      });
    }
  }),
  keys: z.object({
    p256dh: z.string().max(200),
    auth: z.string().max(100),
  }),
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
