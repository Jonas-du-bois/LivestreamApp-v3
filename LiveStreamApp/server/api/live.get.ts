import PassageModel from '../models/Passage';
import StreamModel from '../models/Stream';

export default defineEventHandler(async (event) => {
  try {
    // Fetch live passages and streams in parallel
    // OPTIMIZATION: Use field selection to prevent over-fetching large documents (e.g. group history)
    // NOTE: The selected fields must match the response mapping below (name, code, icon)
    const [livePassages, liveStreams] = await Promise.all([
      PassageModel.find({ status: 'LIVE' })
        .populate('group', 'name')
        .populate('apparatus', 'name code icon')
        .sort({ startTime: 1 })
        .lean(),
      StreamModel.find({ isLive: true })
        .populate({
          path: 'currentPassage',
          populate: [
            { path: 'group', select: 'name' },
            { path: 'apparatus', select: 'name code icon' }
          ]
        })
        .lean()
    ]);

    const formattedPassages = livePassages.map((p: any) => ({
      _id: p._id,
      group: p.group ? { _id: p.group._id, name: p.group.name } : null,
      apparatus: p.apparatus ? { _id: p.apparatus._id, name: p.apparatus.name, code: p.apparatus.code, icon: p.apparatus.icon } : null,
      startTime: p.startTime,
      endTime: p.endTime,
      location: p.location,
      status: p.status,
      score: p.score,
      monitors: p.monitors || []
    }));

    return {
      passages: formattedPassages,
      streams: liveStreams
    };
  } catch (err) {
    console.error('[live] Error fetching live data', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch live data' });
  }
});
