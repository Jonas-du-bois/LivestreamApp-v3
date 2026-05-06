import StreamModel from '../../../../models/Stream';

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

    if (!stream.apiVideoLiveStreamId) {
      return { ok: true, metrics: { viewers: 0 } };
    }

    const config = useRuntimeConfig();
    const apiKey = config.apiVideoKey;
    if (!apiKey) {
      throw createError({ statusCode: 500, statusMessage: 'API_VIDEO_KEY environment variable is not set.' });
    }

    // We calculate "from" as 5 minutes ago to get the most recent peak
    const fromDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const url = `https://ws.api.video/data/metrics/ccv/peak?mediaId=${stream.apiVideoLiveStreamId}&mediaType=live-stream&from=${fromDate}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[stream metrics] API error', response.status, errorText);
      return { ok: false, metrics: { viewers: 0 }, error: 'Failed to fetch metrics from api.video' };
    }

    const data = await response.json();
    let viewers = 0;
    if (data && data.data && data.data.length > 0) {
      // The data array contains metric values. Usually just one object for the requested period.
      viewers = data.data[0].metricValue || 0;
    }

    return { ok: true, metrics: { viewers } };
  } catch (err: any) {
    console.error('[stream metrics] error', err);
    return { ok: false, metrics: { viewers: 0 }, error: err.message || 'Server error' };
  }
});
