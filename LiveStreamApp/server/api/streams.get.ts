import StreamModel from '../models/Stream';

export default defineEventHandler(async (event) => {
  try {
    const streams = await StreamModel.find().lean();
    return streams;
  } catch (err) {
    console.error('[streams] Error fetching streams', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch streams' });
  }
});
