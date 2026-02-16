import StreamModel from '../models/Stream';

export default defineEventHandler(async (event) => {
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
      // OPTIMIZATION: Select only necessary fields to reduce payload size (avoids large history arrays)
      .populate({
        path: 'currentPassage',
        populate: [
          { path: 'group', select: 'name category' },
          { path: 'apparatus', select: 'name code icon' }
        ]
      })
      .lean();

    return streams;
  } catch (err) {
    console.error('[streams] Error fetching streams', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch streams' });
  }
});
