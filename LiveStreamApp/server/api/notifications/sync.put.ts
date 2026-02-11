import SubscriptionModel from '../../models/Subscription';
import { SyncFavoritesSchema } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  // Security: Rate Limit (60 req/min) - Looser limit for sync to allow frequent updates
  const ip = getRequestIP(event) || 'unknown';
  if (isRateLimited(`${ip}:sync`, 60, 60000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    });
  }

  // Validate input using Zod schema to prevent DoS and injection
  const { endpoint, favorites } = await readValidatedBody(event, (body) => SyncFavoritesSchema.parse(body));

  try {
    // Only update favorites for an existing subscription
    await SubscriptionModel.findOneAndUpdate(
      { endpoint },
      { favorites },
      { new: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[sync] Error:', err);
    throw createError({ statusCode: 500, statusMessage: 'Sync failed' });
  }
});
