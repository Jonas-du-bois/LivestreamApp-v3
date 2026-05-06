import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import StreamModel from '../../models/Stream';
import ApiVideoClient from '@api.video/nodejs-client';

const schema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['custom', 'apivideo']).default('custom'),
  url: z.string().url().startsWith('http').or(z.literal('')).optional(),
});

export default defineEventHandler(async (event) => {
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }

  const { name, location, type, url } = result.data;

  try {
    const stream = new StreamModel({
      name,
      location,
      url: type === 'custom' ? url : undefined,
      isLive: false,
    });

    if (type === 'apivideo') {
      const config = useRuntimeConfig();
      const apiKey = config.apiVideoKey;
      if (!apiKey) {
        throw createError({ statusCode: 500, statusMessage: 'API_VIDEO_KEY environment variable is not set.' });
      }

      const client = new ApiVideoClient({ apiKey });
      const liveStream = await client.liveStreams.create({
        name: name || `Stream - ${location || 'Unknown'}`,
      });

      stream.apiVideoLiveStreamId = liveStream.liveStreamId;
      stream.streamKey = liveStream.streamKey;
      stream.url = `https://embed.api.video/live/${liveStream.liveStreamId}`;
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
    };

    const socketAny = (event.node.res?.socket as any);
    const io = socketAny?.server?.io as IOServer | undefined;

    if (io) {
      io.to('streams').emit('stream-update', sanitized); // Broadcast to list view
    } else {
      console.warn('[stream] io instance not found, skipping emit');
    }

    return { ok: true, stream: sanitized };
  } catch (err) {
    console.error('[stream] create error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to create stream' });
  }
});
