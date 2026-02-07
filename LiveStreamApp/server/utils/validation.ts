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

/**
 * Validates a Socket.io room name against a strict whitelist.
 * This prevents users from joining arbitrary channels and potential resource exhaustion attacks.
 */
export const isValidRoom = (room: string): boolean => {
  // Public channels
  const allowedRooms = new Set([
    'live-scores',
    'schedule-updates',
    'streams',
    'admin-dashboard'
  ]);

  if (allowedRooms.has(room)) {
    return true;
  }

  // Specific stream channels: stream-{ObjectId}
  const streamRoomRegex = /^stream-[0-9a-fA-F]{24}$/;
  if (streamRoomRegex.test(room)) {
    return true;
  }

  return false;
};
