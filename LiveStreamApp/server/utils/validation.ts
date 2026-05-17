import { z } from 'zod';

// --- Subscription schemas (union discriminée web | fcm) ---

// Security: Prevent SSRF by validating that Web Push endpoint is a safe external HTTPS URL.
// Blocks loopback, localhost, and RFC1918 private IPs.
const isSafeUrl = (val: string): boolean => {
  try {
    const parsed = new URL(val);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname;

    // Block obvious local hostnames
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.local')) return false;

    // Block IPv4 private/loopback ranges
    const parts = host.split('.');
    if (parts.length === 4 && parts.every(p => !isNaN(Number(p)) && p.trim() !== '')) {
      const [a, b] = parts.map(Number);
      if (
        a === 10 || // 10.0.0.0/8
        a === 127 || // 127.0.0.0/8
        a === 0 || // 0.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) || // 192.168.0.0/16
        (a === 169 && b === 254) // 169.254.0.0/16 (Link-local/Cloud Metadata)
      ) {
        return false;
      }
    }

    // Block basic IPv6 loopback/private ranges
    if (host.includes(':')) {
      const lowerHost = host.toLowerCase();
      if (
        lowerHost === '[::1]' ||
        lowerHost.startsWith('[fc') ||
        lowerHost.startsWith('[fd') ||
        lowerHost.startsWith('[fe8') ||
        lowerHost.startsWith('[fe9') ||
        lowerHost.startsWith('[fea') ||
        lowerHost.startsWith('[feb')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).refine(isSafeUrl, { message: 'Invalid or insecure endpoint URL' }),
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
