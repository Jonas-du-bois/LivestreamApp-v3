import { Server as IOServer } from 'socket.io';
import StreamModel from '../../models/Stream';

interface StreamUpdateBody {
  streamId: string;
  type?: string;
  url?: string;
  isLive?: boolean;
  currentPassageId?: string | null;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<StreamUpdateBody>(event);
  const { streamId, url, isLive, currentPassageId } = body || {};

  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'streamId is required' });

  try {
    const stream = await StreamModel.findById(streamId).exec();
    if (!stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' });

    if (typeof url === 'string') stream.url = url;
    if (typeof isLive === 'boolean') stream.isLive = isLive;
    if (typeof currentPassageId === 'string') stream.currentPassage = currentPassageId as any;
    if (currentPassageId === null) stream.currentPassage = undefined as any;

    await stream.save();

    const sanitized = {
      _id: stream._id,
      name: stream.name,
      url: stream.url,
      location: stream.location,
      isLive: stream.isLive,
      currentPassage: stream.currentPassage,
    };

    const socketAny = (event.node.res?.socket as any);
    const io = socketAny?.server?.io as IOServer | undefined;
    const room = `stream-${streamId}`;

    if (io) io.to(room).emit('stream-update', sanitized);
    else console.warn('[stream] io instance not found, skipping emit');

    return { ok: true, stream: sanitized };
  } catch (err) {
    console.error('[stream] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update stream' });
  }
});