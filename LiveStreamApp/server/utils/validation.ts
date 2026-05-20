import { z } from 'zod';
import { promises as dns } from 'node:dns';

// --- SSRF Protection Helpers ---
const isInternalIP = (ip: string): boolean => {
  // Loopback (IPv4/IPv6)
  if (ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('127.')) return true;

  // IPv4 Private (RFC 1918)
  if (ip.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('192.168.')) return true;

  // Link-Local (IPv4/IPv6)
  if (ip.startsWith('169.254.')) return true;
  if (ip.toLowerCase().startsWith('fe80:')) return true;

  // Unique Local Addresses (IPv6 ULA)
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;

  return false;
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).superRefine(async (val, ctx) => {
    try {
      const url = new URL(val);

      // Enforce HTTPS
      if (url.protocol !== 'https:') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endpoint must use HTTPS',
        });
        return;
      }

      // Block raw local hostnames/IPs
      if (url.hostname === 'localhost' || isInternalIP(url.hostname)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endpoint cannot be a local or private address',
        });
        return;
      }

      // Async DNS resolution with timeout to prevent DNS rebinding to internal IPs
      const dnsPromise = dns.lookup(url.hostname);
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('DNS resolution timeout')), 2000);
      });

      const lookupResult = await Promise.race([dnsPromise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
      }) as { address: string };

      if (isInternalIP(lookupResult.address)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endpoint resolves to a private IP address',
        });
      }
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid endpoint URL or DNS resolution failed',
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
