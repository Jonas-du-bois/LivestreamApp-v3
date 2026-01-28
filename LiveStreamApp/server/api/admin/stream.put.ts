import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import StreamModel from '../../models/Stream';

const schema = z.object({
  streamId: z.string(),
  type: z.string().optional(),
  url: z.string().optional(),
  isLive: z.boolean().optional(),
  currentPassageId: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }
  const { streamId, url, isLive, currentPassageId } = result.data;

  try {
    const stream = await StreamModel.findById(streamId).exec();
    if (!stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' });

    if (typeof url === 'string') stream.url = url;
    if (typeof isLive === 'boolean') stream.isLive = isLive;
    // Handle currentPassageId logic: string -> ObjectId, null -> undefined/null
    if (currentPassageId !== undefined) {
      stream.currentPassage = currentPassageId === null ? (undefined as any) : (currentPassageId as any);
    }

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
