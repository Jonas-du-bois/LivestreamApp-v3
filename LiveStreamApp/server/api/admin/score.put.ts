import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import PassageModel from '../../models/Passage';
import GroupModel from '../../models/Group';
import ApparatusModel from '../../models/Apparatus';

const schema = z.object({
  passageId: z.string(),
  score: z.number().min(0).max(10),
});

export default defineEventHandler(async (event) => {
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }
  const { passageId, score } = result.data;

  try {
    // Use explicit $set to avoid object merging issues
    const updated = await PassageModel.findByIdAndUpdate(
      passageId,
      {
        $set: {
          score: typeof score === 'string' ? parseFloat(score) : score,
          isPublished: true,
          status: 'FINISHED'
        }
      },
      { new: true }
    ).populate('group', 'name').populate('apparatus', 'code').exec();

    if (!updated) throw createError({ statusCode: 404, statusMessage: 'Passage not found' });

    // Compute rank among published finished passages
    const finished = await PassageModel.find({ status: 'FINISHED', isPublished: true })
      .sort({ score: -1 })
      .select('_id')
      .lean()
      .exec();

    const rank = finished.findIndex((f: any) => f._id.toString() === updated._id.toString()) + 1;

    const payload = {
      passageId: updated._id,
      groupName: (updated.group as any)?.name || null,
      apparatusCode: (updated.apparatus as any)?.code || null,
      score: updated.score,
      rank,
    };

    // Emit to room
    const io = ((event.node.res as any)?.socket?.server as any)?.io as IOServer | undefined;

    if (io) {
      io.to('live-scores').emit('score-update', payload);
    } else {
      console.warn('[score] io instance not found, skipping emit');
      // Still proceed; DB has been updated
    }

    return { ok: true, payload };
  } catch (err) {
    console.error('[score] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update score' });
  }
});
