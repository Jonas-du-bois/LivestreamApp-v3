import { z } from 'zod';
import { resolve } from 'node:dns/promises';

// Helper to prevent SSRF and DNS Rebinding
const isInternalIP = (ip: string) => {
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === '::' || ip === '::1') return true;
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
  }
  if (ip.includes(':')) {
    const firstBlock = parseInt(ip.split(':')[0], 16);
    if ((firstBlock & 0xfe00) === 0xfc00) return true; // ULA
    if ((firstBlock & 0xffc0) === 0xfe80) return true; // Link-local
  }
  return false;
};

// --- Subscription schemas (union discriminée web | fcm) ---

const WebSubscriptionSchema = z.object({
  type: z.literal('web'),
  endpoint: z.string().url().max(500).superRefine(async (url, ctx) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'HTTPS is required' });
        return;
      }
      if (isInternalIP(parsed.hostname)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid hostname' });
        return;
      }
      // Async DNS resolution to prevent DNS rebinding (e.g., 127.0.0.1.nip.io)
      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DNS lookup timeout')), 2000);
      });
      try {
        const records = await Promise.race([resolve(parsed.hostname), timeoutPromise]);
        if (records.some(isInternalIP)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid resolved IP' });
        }
      } catch (err: any) {
        // ENOTFOUND or timeouts are treated as invalid endpoints
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DNS resolution failed' });
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid URL format' });
    }
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
