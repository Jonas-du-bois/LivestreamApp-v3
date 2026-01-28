import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import PassageModel from '../../models/Passage';

const schema = z.object({
  passageId: z.string(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED']),
});

export default defineEventHandler(async (event) => {
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }
  const { passageId, status } = result.data;

  try {
    const passage = await PassageModel.findById(passageId).populate('group', 'name').exec();
    if (!passage) throw createError({ statusCode: 404, statusMessage: 'Passage not found' });

    passage.status = status;
    await passage.save();

    const payload = {
      passageId: passage._id,
      status: passage.status,
      groupName: (passage.group as any)?.name || null,
    };

    const io = ((event.node.res as any)?.socket?.server as any)?.io as IOServer | undefined;
    if (io) io.to('schedule-updates').emit('status-change', payload);
    else console.warn('[status] io instance not found, skipping emit');

    return { ok: true, payload };
  } catch (err) {
    console.error('[status] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update status' });
  }
});
