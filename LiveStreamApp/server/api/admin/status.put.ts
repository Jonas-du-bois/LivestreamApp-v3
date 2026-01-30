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
    const passage = await PassageModel.findById(passageId)
      .populate('group', 'name')
      .populate('apparatus', 'name')
      .exec();
    if (!passage) throw createError({ statusCode: 404, statusMessage: 'Passage not found' });

    const io = ((event.node.res as any)?.socket?.server as any)?.io || (globalThis as any).io as IOServer | undefined;

    // Check for conflicting LIVE passages in the same location
    if (status === 'LIVE' && passage.location) {
      const conflictingPassages = await PassageModel.find({
        status: 'LIVE',
        location: passage.location,
        _id: { $ne: passage._id }
      }).populate('group', 'name');

      if (conflictingPassages.length > 0) {
        const now = new Date();
        for (const conflict of conflictingPassages) {
          conflict.status = 'FINISHED';
          conflict.endTime = now;
          await conflict.save();

          if (io) {
            io.to('schedule-updates').emit('status-update', {
              passageId: conflict._id,
              status: 'FINISHED',
              location: conflict.location!,
              groupName: (conflict.group as any)?.name || null,
            });
          }
        }
      }
    }

    passage.status = status;
    await passage.save();

    const location = passage.location || (passage.apparatus as any)?.name || 'Unknown';

    const payload = {
      passageId: passage._id,
      status: passage.status,
      location,
      groupName: (passage.group as any)?.name || null,
    };

    if (io) io.to('schedule-updates').emit('status-update', payload);
    else console.warn('[status] io instance not found, skipping emit');

    return { ok: true, payload };
  } catch (err) {
    console.error('[status] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update status' });
  }
});
