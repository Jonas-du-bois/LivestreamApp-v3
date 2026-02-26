import { z } from 'zod';
import net from 'node:net';

// --- Security Helpers ---

/**
 * Validates that a URL is safe for Web Push (HTTPS only, no localhost/private IPs).
 * Prevents SSRF attacks.
 */
const isSafeUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);

    // 1. Enforce HTTPS
    if (url.protocol !== 'https:') return false;

    // Handle IPv6 brackets: [::1] -> ::1 for net.isIP check
    let hostname = url.hostname;
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
      hostname = hostname.slice(1, -1);
    }

    // 2. Check if hostname is an IP address (v4 or v6)
    const isIP = net.isIP(hostname);

    if (isIP) {
      // It is an IP address. Check against private/reserved ranges.

      // IPv6 Loopback (::1) or Unspecified (::)
      if (hostname === '::1' || hostname === '::') return false;

      // IPv4 Loopback (127.0.0.0/8)
      if (hostname.startsWith('127.')) return false;

      // IPv4 Private Ranges
      // 10.0.0.0/8
      if (hostname.startsWith('10.')) return false;
      // 192.168.0.0/16
      if (hostname.startsWith('192.168.')) return false;
      // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) return false;
      // Carrier Grade NAT (100.64.0.0/10)
      if (hostname.startsWith('100.') && parseInt(hostname.split('.')[1]) >= 64 && parseInt(hostname.split('.')[1]) <= 127) return false;
      // Link-local (169.254.0.0/16) - critical for cloud metadata protection
      if (hostname.startsWith('169.254.')) return false;

      return true;
    } else {
      // It is a domain name.
      // Block localhost
      if (hostname.toLowerCase() === 'localhost') return false;

      // Allow other domains (e.g. 10.com, google.com) even if they start with numbers
      return true;
    }
  } catch (e) {
    return false; // Invalid URL format
  }
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  // Security: Enforce safe URLs to prevent SSRF
  endpoint: z.string().url().max(500).refine(isSafeUrl, {
    message: 'Invalid endpoint: Must be a public HTTPS URL (SSRF protection)',
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
  endpoint: z.string().min(10).max(4096).refine((val) => {
    // If it looks like a URL (starts with http), validate it strictly
    if (val.startsWith('http')) {
      return isSafeUrl(val);
    }
    // Otherwise assume it's an FCM token (opaque string)
    return true;
  }, { message: 'Invalid endpoint: Must be a public HTTPS URL if using Web Push' }),

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
