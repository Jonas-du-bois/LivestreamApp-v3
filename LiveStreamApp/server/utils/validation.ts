import { z } from 'zod';
import { isIP } from 'node:net';

// Security: Prevent SSRF by blocking private IP ranges and localhost
const isPrivateIP = (hostname: string) => {
  // Strip brackets from IPv6 hostnames (e.g., [::1] -> ::1)
  const cleanHostname = hostname.replace(/^\[|\]$/g, '');

  // Localhost is always private
  if (cleanHostname === 'localhost') return true;

  const ipVersion = isIP(cleanHostname);
  if (ipVersion === 0) return false; // Not an IP address (it's a domain name)

  if (ipVersion === 4) {
    // 0.0.0.0/8 (Current network)
    if (cleanHostname.startsWith('0.')) return true;
    // IPv4 Private Ranges
    // 127.0.0.0/8
    if (cleanHostname.startsWith('127.')) return true;
    // 10.0.0.0/8
    if (cleanHostname.startsWith('10.')) return true;
    // 169.254.0.0/16 (Link Local)
    if (cleanHostname.startsWith('169.254.')) return true;
    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanHostname)) return true;
    // 192.168.0.0/16
    if (cleanHostname.startsWith('192.168.')) return true;
  }

  if (ipVersion === 6) {
    // IPv6 Private/Local
    // ::1 (Loopback)
    if (cleanHostname === '::1') return true;
    // fc00::/7 (Unique Local)
    if (/^[fF][cCdD]/.test(cleanHostname)) return true;
    // fe80::/10 (Link Local)
    if (/^[fF][eE][89aAbB]/.test(cleanHostname)) return true;
  }

  return false;
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  // Security: Enforce HTTPS and block private IPs to prevent SSRF via Web Push
  endpoint: z.string().url().max(500)
    .startsWith('https://', { message: 'Endpoint must use HTTPS' })
    .refine((url) => {
      try {
        const { hostname } = new URL(url);
        return !isPrivateIP(hostname);
      } catch {
        return false;
      }
    }, { message: 'Endpoint must not be a private IP or localhost' }),
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
