import PassageModel from '../models/Passage';
import StreamModel from '../models/Stream';

export default defineEventHandler(async (event) => {
  try {
    // Fetch live passages and streams in parallel
    const [livePassages, liveStreams] = await Promise.all([
      PassageModel.find({ status: 'LIVE' })
        .populate('group')
        .populate('apparatus')
        .sort({ startTime: 1 })
        .lean(),
      StreamModel.find({ isLive: true })
        .populate({ path: 'currentPassage', populate: ['group', 'apparatus'] })
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
