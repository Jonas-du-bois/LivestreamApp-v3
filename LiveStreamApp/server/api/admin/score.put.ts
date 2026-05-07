import { Server as IOServer } from 'socket.io';
import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import { updatePassageScore } from '../../utils/score-update';

const schema = z.object({
  passageId: z.string(),
  score: z.number().min(0).max(10),
});

export default defineEventHandler(async (event) => {
  // Security: Rate Limit (60 req/min) to prevent notification spam/DoS
  const ip = getRequestIP(event) || 'unknown';
  if (await isRateLimited(`${ip}:score`, 60, 60000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    });
  }

  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: result.error });
  }
  const { passageId, score } = result.data;

  try {
    const io = ((event.node.res as any)?.socket?.server as any)?.io || (globalThis as any).io as IOServer | undefined;
    const updateResult = await updatePassageScore({
      passageId,
      score,
      io,
      invalidateCache: true,
      source: 'admin:score'
    });

    const payload = updateResult.payload || { passageId, score, unchanged: true };
    return { ok: true, payload };
  } catch (err) {
    if ((err as any)?.statusCode) {
      throw err;
    }
    console.error('[score] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to update score' });
  }
});
