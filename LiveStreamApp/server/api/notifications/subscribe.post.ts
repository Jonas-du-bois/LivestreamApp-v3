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

  // Validate input: union type web | fcm
  const body = await readValidatedBody(event, (b) => SubscriptionSchema.parse(b));
  const { type, endpoint } = body;

  try {
    // Upsert subscription (web ou fcm)
    await SubscriptionModel.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        type,
        // keys uniquement pour les subscriptions Web Push
        ...(type === 'web' ? { keys: body.keys } : { $unset: { 'keys.p256dh': '', 'keys.auth': '' } }),
      },
      { upsert: true, new: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[subscribe] Error:', err);
    throw createError({ statusCode: 500, statusMessage: 'Subscription failed' });
  }
});
