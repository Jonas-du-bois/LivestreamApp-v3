import { z } from 'zod';

// Security: Prevent SSRF by validating endpoint URLs synchronously
const isSafeUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    // Web Push endpoints MUST use HTTPS
    if (url.protocol !== 'https:') return false;

    const hostname = url.hostname.toLowerCase();

    // Block explicitly forbidden hostnames (loopback, any, etc.)
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)) return false;

    // Block RFC1918 private IPv4 networks and local links
    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, 0.0.0.0/8
    const privateIpRegex = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|127\.\d+\.\d+\.\d+|0\.\d+\.\d+\.\d+)$/;
    if (privateIpRegex.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).refine(isSafeUrl, { message: 'Invalid or forbidden endpoint URL' }),
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
