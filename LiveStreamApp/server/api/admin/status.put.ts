import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import PassageModel from '../../models/Passage';
import StreamModel from '../../models/Stream';

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
      .populate('apparatus', 'name code icon')
      .exec();
    if (!passage) throw createError({ statusCode: 404, statusMessage: 'Passage not found' });

    const io = ((event.node.res as any)?.socket?.server as any)?.io || (globalThis as any).io as IOServer | undefined;
    const location = passage.location || (passage.apparatus as any)?.name || 'Unknown';

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
    if (status === 'FINISHED') {
      passage.endTime = new Date();
    }
    await passage.save();

    // Update stream's currentPassage when passage goes LIVE or FINISHED
    const stream = await StreamModel.findOne({ location: passage.location }).exec();
    if (stream) {
      if (status === 'LIVE') {
        // Set this passage as the current one on the stream
        stream.currentPassage = passage._id as any;
        await stream.save();
        
        // Emit stream-update with full passage info for reactivity
        const streamPayload = {
          _id: stream._id,
          name: stream.name,
          url: stream.url,
          location: stream.location,
          isLive: stream.isLive,
          currentPassage: {
            _id: passage._id,
            group: passage.group,
            apparatus: passage.apparatus,
            status: passage.status,
            location: passage.location
          }
        };
        
        if (io) {
          console.log(`[status.put] Emitting stream-update to stream-${stream._id} and streams:`, streamPayload);
          io.to(`stream-${stream._id}`).emit('stream-update', streamPayload);
          io.to('streams').emit('stream-update', streamPayload);
        }
      } else if (status === 'FINISHED' && stream.currentPassage?.toString() === passageId) {
        // Clear currentPassage when the current one finishes
        stream.currentPassage = undefined;
        await stream.save();
        
        const streamPayload = {
          _id: stream._id,
          name: stream.name,
          url: stream.url,
          location: stream.location,
          isLive: stream.isLive,
          currentPassage: null
        };
        
        if (io) {
          console.log(`[status.put] Emitting stream-update to stream-${stream._id} and streams:`, streamPayload);
          io.to(`stream-${stream._id}`).emit('stream-update', streamPayload);
          io.to('streams').emit('stream-update', streamPayload);
        }
      }
    }

    const payload = {
      passageId: passage._id,
      status: passage.status,
      location,
      groupName: (passage.group as any)?.name || null,
      group: passage.group,
      apparatus: passage.apparatus
    };

    if (io) {
      console.log(`[status.put] Emitting status-update to schedule-updates:`, payload);
      io.to('schedule-updates').emit('status-update', payload);
    } else {
      console.warn('[status] io instance not found, skipping emit');
    }

    // ─── Auto-promote: when a passage is FINISHED, promote the next
    // SCHEDULED passage in the SAME location whose startTime has passed ───
    if (status === 'FINISHED' && passage.location) {
      const now = new Date();
      const nextPassage = await PassageModel.findOne({
        status: 'SCHEDULED',
        location: passage.location,
        startTime: { $lte: now }
      })
        .sort({ startTime: 1 })
        .populate('group', 'name')
        .populate('apparatus', 'name code icon')
        .exec();

      if (nextPassage) {
        nextPassage.status = 'LIVE';
        await nextPassage.save();
        console.log(`[status.put] Auto-promoted passage ${nextPassage._id} to LIVE (same location: ${passage.location})`);

        // Update stream to point to the new LIVE passage
        if (stream) {
          stream.currentPassage = nextPassage._id as any;
          await stream.save();

          const nextStreamPayload = {
            _id: stream._id,
            name: stream.name,
            url: stream.url,
            location: stream.location,
            isLive: stream.isLive,
            currentPassage: {
              _id: nextPassage._id,
              group: nextPassage.group,
              apparatus: nextPassage.apparatus,
              status: nextPassage.status,
              location: nextPassage.location
            }
          };

          if (io) {
            io.to(`stream-${stream._id}`).emit('stream-update', nextStreamPayload);
            io.to('streams').emit('stream-update', nextStreamPayload);
          }
        }

        // Emit status-update for the newly promoted passage
        const nextPayload = {
          passageId: nextPassage._id,
          status: 'LIVE',
          location: nextPassage.location || (nextPassage.apparatus as any)?.name || 'Unknown',
          groupName: (nextPassage.group as any)?.name || null,
          group: nextPassage.group,
          apparatus: nextPassage.apparatus
        };

        if (io) {
          console.log(`[status.put] Emitting status-update for auto-promoted passage:`, nextPayload);
          io.to('schedule-updates').emit('status-update', nextPayload);
        }
      }
    }

    return { ok: true, payload };
  } catch (err) {
    console.error('[status] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update status' });
  }
});
