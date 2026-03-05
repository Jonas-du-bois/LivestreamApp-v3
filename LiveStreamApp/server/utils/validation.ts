import { z } from 'zod';

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  // Security: SSRF Protection. Block local/private IP ranges and enforce HTTPS.
  endpoint: z.string().url().max(500).refine((url) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;

      const hostname = parsed.hostname;
      // Block localhost and loopback
      if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname.startsWith('127.')) return false;

      // Block RFC1918 Private Networks
      if (hostname.startsWith('10.')) return false;
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return false;
      if (hostname.startsWith('192.168.')) return false;

      // Block Link-local
      if (hostname.startsWith('169.254.')) return false;

      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid or forbidden endpoint URL' }),
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
