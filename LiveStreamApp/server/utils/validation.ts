import { z } from 'zod';

// --- SSRF Prevention Helper ---
// Helper to validate that a URL string uses HTTPS and doesn't point to local/private IP ranges
const ssrfSafeUrl = z.string().url().max(500).refine((val) => {
  try {
    const parsed = new URL(val);

    // Web Push endpoints MUST be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.localhost')) {
      return false;
    }

    // Block AWS metadata and private IP ranges commonly used for SSRF
    // This is a basic string check. For total robustness, DNS resolution check is better,
    // but this prevents basic direct IP SSRF.
    const privateIpRegex = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.\d+\.\d+\.\d+|127\.\d+\.\d+\.\d+)$/;
    if (privateIpRegex.test(hostname)) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}, { message: "Invalid endpoint URL (HTTPS only, no private IPs)" });

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: ssrfSafeUrl,
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
  endpoint: z.string().min(10).max(4096), // FCM tokens can be long and aren't URLs, Web Push endpoints are URLs. We keep it permissive here since we just look it up.
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
