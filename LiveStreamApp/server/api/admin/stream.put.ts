import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import StreamModel from '../../models/Stream';

const schema = z.object({
  streamId: z.string(),
  type: z.string().optional(),
  name: z.string().optional(),
  cameraName: z.string().optional(),
  record: z.boolean().optional(),
  timeshift: z.boolean().optional(),
  // Security: Prevent Stored XSS by strictly validating URL scheme (http/https only)
  // This blocks javascript: and data: URIs which could be exploited in iframes or links.
  url: z.string().url().startsWith('http').or(z.literal('')).optional(),
  isLive: z.boolean().optional(),
  currentPassageId: z.string().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }
  const { streamId, url, isLive, currentPassageId, name, cameraName, record, timeshift } = result.data;

  try {
    const stream = await StreamModel.findById(streamId).exec();
    if (!stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' });

    if (typeof name === 'string') stream.name = name;
    if (typeof cameraName === 'string') stream.cameraName = cameraName;
    if (typeof record === 'boolean') stream.record = record;
    if (typeof timeshift === 'boolean') stream.timeshift = timeshift;
    if (typeof url === 'string') stream.url = url;
    if (typeof isLive === 'boolean') {
      if (isLive && !stream.isLive) {
        stream.liveStartedAt = new Date();
      } else if (!isLive) {
        stream.liveStartedAt = undefined;
      }
      stream.isLive = isLive;
    }
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
      apiVideoLiveStreamId: stream.apiVideoLiveStreamId,
      streamKey: stream.streamKey,
      liveStartedAt: stream.liveStartedAt,
      cameraName: stream.cameraName,
      record: stream.record,
      timeshift: stream.timeshift,
    };

    const socketAny = (event.node.res?.socket as any);
    const io = socketAny?.server?.io as IOServer | undefined;
    const room = `stream-${streamId}`;

    if (io) {
      io.to(room).emit('stream-update', sanitized);
      io.to('streams').emit('stream-update', sanitized); // Broadcast to list view
    } else console.warn('[stream] io instance not found, skipping emit');

    return { ok: true, stream: sanitized };
  } catch (err) {
    console.error('[stream] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update stream' });
  }
});
