import SubscriptionModel from '../../models/Subscription';
import { SyncFavoritesSchema } from '../../utils/validation';

export default defineEventHandler(async (event) => {
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
