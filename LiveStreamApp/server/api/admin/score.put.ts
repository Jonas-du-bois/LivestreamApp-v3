import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import PassageModel from '../../models/Passage';
import GroupModel from '../../models/Group';
import ApparatusModel from '../../models/Apparatus';

const schema = z.object({
  passageId: z.string(),
  programScore: z.number().min(0).max(20).optional(),
  techScore: z.number().min(0).max(20).optional(),
  totalScore: z.number().min(0).max(20).optional(),
});

export default defineEventHandler(async (event) => {
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }
  const { passageId, programScore, techScore, totalScore } = result.data;

  try {
    const passage = await PassageModel.findById(passageId).populate('group', 'name').populate('apparatus', 'code').exec();

    if (!passage) throw createError({ statusCode: 404, statusMessage: 'Passage not found' });

    // Update scores
    const scores = passage.scores = (passage.scores || { isPublished: false } as any) as any;
    if (typeof programScore === 'number') scores.program = programScore;
    if (typeof techScore === 'number') scores.technical = techScore;
    if (typeof totalScore === 'number') scores.total = totalScore;
    passage.status = 'FINISHED';
    scores.isPublished = true;

    await passage.save();

    // Compute rank among published finished passages
    const finished = await PassageModel.find({ status: 'FINISHED', 'scores.isPublished': true })
      .sort({ 'scores.total': -1 })
      .select('_id')
      .lean()
      .exec();

    const rank = finished.findIndex((f: any) => f._id.toString() === passage._id.toString()) + 1;

    const payload = {
      passageId: passage._id,
      groupName: (passage.group as any)?.name || null,
      apparatusCode: (passage.apparatus as any)?.code || null,
      totalScore: scores?.total ?? null,
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
