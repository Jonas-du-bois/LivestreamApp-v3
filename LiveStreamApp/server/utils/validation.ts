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
