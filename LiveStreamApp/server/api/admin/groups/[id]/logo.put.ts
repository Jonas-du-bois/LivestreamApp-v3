import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import GroupModel from '../../../../models/Group';
import { Types } from 'mongoose';

const schema = z.object({
  logoUrl: z.string().trim().min(1).or(z.literal(''))
});

export default defineEventHandler(async (event) => {
  const groupId = getRouterParam(event, 'id');
  if (!groupId) {
    throw createError({ statusCode: 400, statusMessage: 'Group ID is required' });
  }
  if (!Types.ObjectId.isValid(groupId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid group ID' });
  }

  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }

  try {
    const group = await GroupModel.findById(groupId).exec();
    if (!group) {
      throw createError({ statusCode: 404, statusMessage: 'Group not found' });
    }

    group.logo = result.data.logoUrl;
    await group.save();

    return { ok: true, logo: group.logo };
  } catch (err: any) {
    if (err?.statusCode) {
      throw err;
    }
    console.error('[group logo] update error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update group logo' });
  }
});
