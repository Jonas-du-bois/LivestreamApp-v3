import { z } from 'zod';

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  // Security: Prevent SSRF by explicitly validating the endpoint URL
  endpoint: z.string().url().max(500).refine((val) => {
    try {
      const url = new URL(val);
      // Enforce HTTPS
      if (url.protocol !== 'https:') return false;

      const hostname = url.hostname.toLowerCase();

      // Note: This synchronous validation prevents trivial SSRF via direct IP inputs.
      // It does NOT prevent DNS rebinding or domains that resolve to internal IPs (e.g. 127.0.0.1.nip.io).
      // Full protection would require asynchronous DNS resolution or network-level blocking.

      if (hostname === 'localhost') return false;

      // Block IPv6 loopback, IPv4-mapped loopback, and Unique Local Addresses (ULA)
      if (hostname === '[::1]' || hostname.startsWith('[::ffff:127.') || hostname.startsWith('[fc00:') || hostname.startsWith('[fd00:')) return false;

      // Block purely numeric hostnames (decimal IP bypass)
      if (/^\d+$/.test(hostname)) return false;

      // Block hex/octal representations (like 0x7f.0.0.1)
      if (/0x[0-9a-f]/i.test(hostname)) return false;

      // Block IPv4 loopback, private/link-local ranges, and non-standard IP formats
      const isIPv4 = /^(\d{1,3}\.){1,3}\d{1,3}$/.test(hostname);
      if (isIPv4) {
        const parts = hostname.split('.');
        // Require exact 4-part representation
        if (parts.length !== 4) return false;
        // Block octal trickery (e.g. 0177.0.0.1)
        if (parts.some(p => p.length > 1 && p.startsWith('0'))) return false;

        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);

        if (p0 === 127) return false; // 127.0.0.0/8
        if (p0 === 0) return false; // 0.0.0.0/8
        if (p0 === 169 && p1 === 254) return false; // 169.254.0.0/16
        if (p0 === 10) return false; // 10.0.0.0/8
        if (p0 === 172 && p1 >= 16 && p1 <= 31) return false; // 172.16.0.0/12
        if (p0 === 192 && p1 === 168) return false; // 192.168.0.0/16
      }
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid endpoint URL (must be HTTPS and public)' }),
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
