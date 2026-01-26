import { Server as IOServer } from 'socket.io';
import PassageModel from '../../models/Passage';

interface StatusUpdateBody {
  passageId: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
}

export default defineEventHandler(async (event) => {
  const body = await readBody<StatusUpdateBody>(event);
  const { passageId, status } = body || {};

  if (!passageId || !status) throw createError({ statusCode: 400, statusMessage: 'passageId and status are required' });

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