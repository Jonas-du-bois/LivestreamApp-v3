import { z } from 'zod';

// --- Subscription schemas (union discriminée web | fcm) ---

/**
 * Security: Synchronous URL validation to prevent SSRF vulnerabilities.
 * Enforces HTTPS and blocks localhost, loopback, link-local, and RFC1918 private IP ranges.
 * Uses native URL parser to naturally normalize IPs (catching hex/octal bypasses like 0x7f.0.0.1).
 */
const isSsrfSafeUrl = (urlString: string): boolean => {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname;

    // Block obvious localhost/loopback representations
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '[::1]' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('127.') || // 127.x.x.x
      hostname === '0.0.0.0' || // Linux "any IPv4" resolves to loopback
      hostname.includes('::ffff:127.') // IPv4-mapped IPv6 loopback
    ) {
      return false;
    }

    // Since we can't reliably resolve DNS synchronously without blocking the event loop,
    // and async validation via .refine() requires refactoring all downstream .parse() calls to .parseAsync(),
    // we use a synchronous best-effort IP check.
    // In a high-security context, DNS resolution should be used to prevent DNS rebinding.

    // Basic regex for IPv4
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);

      // Block RFC1918 private networks
      if (
        octet1 === 10 || // 10.0.0.0/8
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12
        (octet1 === 192 && octet2 === 168) // 192.168.0.0/16
      ) {
        return false;
      }

      // Block link-local (169.254.0.0/16)
      if (octet1 === 169 && octet2 === 254) {
        return false;
      }
    }

    // Basic block for IPv6 private/local/unspecified addresses
    if (
      hostname.startsWith('[fc') || // Unique Local Addresses (fc00::/7)
      hostname.startsWith('[fd') ||
      hostname.startsWith('[fe8') || // Link-local (fe80::/10)
      hostname.startsWith('[fe9') ||
      hostname.startsWith('[fea') ||
      hostname.startsWith('[feb') ||
      hostname === '[::]' // Unspecified
    ) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).refine(isSsrfSafeUrl, {
    message: 'Invalid or insecure Web Push endpoint. Must be HTTPS and cannot target local/private networks.',
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
