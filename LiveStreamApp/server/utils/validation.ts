import { z } from 'zod';

// Security: Prevent SSRF by validating Web Push endpoint URLs
// We only allow HTTPS and block localhost/loopback/private/link-local IPs
const isSafeWebPushUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);

    if (url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;

    // Block localhost and loopback (including IPv6 brackets)
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '::1' || // Just in case
      hostname.endsWith('.localhost') ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // Block RFC1918 private IPv4 addresses and Link-Local (AWS IMDS etc.)
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIPv4) {
      const parts = hostname.split('.').map(Number);
      if (
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254) // Link-local
      ) {
        return false;
      }
    }

    // We cannot synchronously resolve DNS, but native Node URL parsing
    // normalizes standard IP formats. This prevents basic SSRF bypasses
    // without requiring an async .refine() which would break downstream code.

    return true;
  } catch {
    return false; // Malformed URL
  }
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).refine(isSafeWebPushUrl, {
    message: 'Invalid or insecure Web Push endpoint URL',
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
  endpoint: z.string().min(10).max(4096), // We don't restrict Sync to Web URLs because it handles FCM tokens too
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
