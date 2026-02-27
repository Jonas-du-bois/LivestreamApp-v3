import { z } from 'zod';

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).refine((url) => {
    try {
      const u = new URL(url);
      // Security: Enforce HTTPS for web push endpoints
      if (u.protocol !== 'https:') return false;

      const hostname = u.hostname.toLowerCase();

      // Security: Block loopback and private addresses to prevent SSRF
      // 1. Localhost / Loopback
      if (
        hostname === 'localhost' ||
        hostname === '[::1]' ||
        hostname.startsWith('127.') || // Block entire 127.0.0.0/8 block
        hostname === '0.0.0.0'
      ) {
        return false;
      }

      // 2. Private Network Ranges (RFC 1918)
      if (
        hostname.startsWith('10.') ||               // 10.0.0.0/8
        hostname.startsWith('192.168.')             // 192.168.0.0/16
      ) {
        return false;
      }

      // 3. Class B Private Network (172.16.0.0 - 172.31.255.255)
      // Regex matches 172.16.x.x through 172.31.x.x
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
        return false;
      }

      // 4. mDNS (.local)
      if (hostname.endsWith('.local')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid or insecure endpoint URL' }),
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
