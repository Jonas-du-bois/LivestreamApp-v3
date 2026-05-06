import { Server as IOServer } from 'socket.io';
import StreamModel from '../../../../models/Stream';
import ApiVideoClient from '@api.video/nodejs-client';

export default defineEventHandler(async (event) => {
  const streamId = getRouterParam(event, 'streamId');
  if (!streamId) {
    throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' });
  }

  try {
    const stream = await StreamModel.findById(streamId).exec();
    if (!stream) {
      throw createError({ statusCode: 404, statusMessage: 'Stream not found' });
    }

    const config = useRuntimeConfig();
    const apiKey = config.apiVideoKey;
    if (!apiKey) {
      throw createError({ statusCode: 500, statusMessage: 'API_VIDEO_KEY environment variable is not set.' });
    }

    const client = new ApiVideoClient({ apiKey });
    
    // Optionally delete old live stream if it exists
    if (stream.apiVideoLiveStreamId) {
      try {
        await client.liveStreams.delete(stream.apiVideoLiveStreamId);
      } catch (err) {
        console.warn(`[stream regenerate] Failed to delete old stream ${stream.apiVideoLiveStreamId}, continuing...`, err);
      }
    }

    const payload: any = {
      name: stream.name || `Stream - ${stream.location || 'Unknown'}`,
      public: true, // We default to public streams
    };

    // Only add these if they are false, since api.video defaults them to true usually, 
    // or pass them explicitly.
    if (stream.record !== undefined) payload.record = stream.record;
    // Timeshift might not be supported natively as a creation parameter in this version 
    // but we pass it anyway as requested.
    // Some players or API versions use timeshift or dvr properties.
    if (stream.timeshift !== undefined) payload.timeshift = stream.timeshift;

    const liveStream = await client.liveStreams.create(payload as any);

    stream.apiVideoLiveStreamId = liveStream.liveStreamId;
    stream.streamKey = liveStream.streamKey;
    stream.url = `https://embed.api.video/live/${liveStream.liveStreamId}`;
    stream.isLive = false;
    stream.liveStartedAt = undefined;

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
    };

    const socketAny = (event.node.res?.socket as any);
    const io = socketAny?.server?.io as IOServer | undefined;
    const room = `stream-${stream._id}`;

    if (io) {
      io.to(room).emit('stream-update', sanitized);
      io.to('streams').emit('stream-update', sanitized);
    } else {
      console.warn('[stream] io instance not found, skipping emit');
    }

    return { ok: true, stream: sanitized };
  } catch (err: any) {
    console.error('[stream] regenerate error', err);
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to regenerate stream' });
  }
});
