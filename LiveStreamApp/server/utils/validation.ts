import { z } from 'zod';

// Helper to block private/internal endpoints (SSRF Protection)
const isPrivateEndpoint = (url: string) => {
  try {
    const { hostname } = new URL(url);
    if (hostname === 'localhost') return true;
    if (hostname.startsWith('127.')) return true;
    if (hostname.startsWith('192.168.')) return true;
    if (hostname.startsWith('10.')) return true;
    // 172.16.0.0/12
    const parts = hostname.split('.');
    if (parts[0] === '172') {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
    return false;
  } catch {
    return true; // Consider invalid URLs as risky
  }
};

export const SubscriptionSchema = z.object({
  // Security: Enforce HTTPS and block private IPs to prevent SSRF
  endpoint: z.string().url().startsWith('https').max(500).refine(url => !isPrivateEndpoint(url), {
    message: "Endpoint must be a public HTTPS URL"
  }),
  keys: z.object({
    p256dh: z.string().max(200),
    auth: z.string().max(100),
  }),
});

export const SyncFavoritesSchema = z.object({
  // Security: Enforce HTTPS and block private IPs
  endpoint: z.string().url().startsWith('https').max(500).refine(url => !isPrivateEndpoint(url), {
    message: "Endpoint must be a public HTTPS URL"
  }),
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
