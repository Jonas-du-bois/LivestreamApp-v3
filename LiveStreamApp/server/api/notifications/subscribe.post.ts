import SubscriptionModel from '../../models/Subscription';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { endpoint, keys } = body || {};

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid subscription data' });
  }

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
