import SubscriptionModel from '../../models/Subscription';
import { SubscriptionSchema } from '../../utils/validation';

export default defineEventHandler(async (event) => {
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
