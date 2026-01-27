import SubscriptionModel from '../../models/Subscription';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { endpoint, favorites } = body || {};

  if (!endpoint || !Array.isArray(favorites)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid sync data' });
  }

  try {
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
