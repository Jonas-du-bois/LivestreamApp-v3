import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import { syncExternalScores } from '../../../utils/external-score-sync';

const schema = z.object({
  dryRun: z.boolean().optional().default(false)
});

const maskUrl = (value: string) => {
  try {
    const url = new URL(value);
    const token = url.searchParams.get('token');
    if (token) {
      const visibleStart = token.slice(0, 4);
      const visibleEnd = token.slice(-4);
      const masked = `${visibleStart}***${visibleEnd}`;
      url.searchParams.set('token', masked);
    }
    return url.toString();
  } catch {
    return 'invalid-url';
  }
};

export default defineEventHandler(async (event) => {
  const bodyResult = await useSafeValidatedBody(event, schema);
  if (!bodyResult.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validation Failed', data: bodyResult.error });
  }

  const config = useRuntimeConfig();
  const feedUrl = String(config.externalScoresFeedUrl || '').trim();
  if (!feedUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'EXTERNAL_SCORES_FEED_URL is missing'
    });
  }

  const io = ((event.node.res as any)?.socket?.server as any)?.io || (globalThis as any).io;
  const syncResult = await syncExternalScores({
    feedUrl,
    io,
    applyUpdates: !bodyResult.data.dryRun,
    source: bodyResult.data.dryRun ? 'admin:external-scores:dry-run' : 'admin:external-scores:sync',
    sampleLimit: 15
  });

  return {
    ok: true,
    dryRun: bodyResult.data.dryRun,
    feedUrl: maskUrl(feedUrl),
    result: syncResult
  };
});
