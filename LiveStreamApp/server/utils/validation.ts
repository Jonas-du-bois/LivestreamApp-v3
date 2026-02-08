import { z } from 'zod';

export const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(500),
  keys: z.object({
    p256dh: z.string().max(200),
    auth: z.string().max(100),
  }),
});

export const SyncFavoritesSchema = z.object({
  endpoint: z.string().url().max(500),
  favorites: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId')
  ).max(50),
});

// Security: Validate Socket.io rooms to prevent arbitrary room joining
const VALID_STATIC_ROOMS = new Set([
  'live-scores',
  'schedule-updates',
  'streams',
  'admin-dashboard'
]);

const STREAM_ROOM_REGEX = /^stream-[0-9a-fA-F]{24}$/;

/**
 * Validates if a room name is allowed.
 * Security: Prevents joining arbitrary rooms and potential DoS.
 */
export const isValidRoom = (room: string): boolean => {
  if (typeof room !== 'string') return false;
  if (VALID_STATIC_ROOMS.has(room)) return true;
  return STREAM_ROOM_REGEX.test(room);
};
