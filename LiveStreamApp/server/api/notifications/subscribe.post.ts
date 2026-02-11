import SubscriptionModel from '../../models/Subscription';
import { SubscriptionSchema } from '../../utils/validation';

export default defineEventHandler(async (event) => {
  // Security: Rate Limit (5 req/min)
  const ip = getRequestIP(event) || 'unknown';
  if (isRateLimited(`${ip}:subscribe`, 5, 60000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    });
  }

  // Validate input using Zod schema
  const { endpoint, keys } = await readValidatedBody(event, (body) => SubscriptionSchema.parse(body));

  try {
    // Upsert subscription
    await SubscriptionModel.findOneAndUpdate(
      { endpoint },
      { endpoint, keys },
      { upsert: true, new: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[subscribe] Error:', err);
    throw createError({ statusCode: 500, statusMessage: 'Subscription failed' });
  }
});
