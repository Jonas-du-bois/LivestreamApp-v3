import StreamModel from '../models/Stream';

export default defineCachedEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { isLive } = query;

    const filter: any = {};
    if (typeof isLive !== 'undefined') {
      // Accept 'true' or '1' as true
      filter.isLive = String(isLive) === 'true' || String(isLive) === '1';
    }

    // Populate currentPassage with group and apparatus to provide more details
    const streams = await StreamModel.find(filter)
      .populate({ path: 'currentPassage', populate: ['group', 'apparatus'] })
      .lean();

    return streams;
  } catch (err) {
    console.error('[streams] Error fetching streams', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch streams' });
  }
}, {
  swr: true,
  maxAge: 10
});
