import PassageModel from '../models/Passage';

export default defineEventHandler(async (event) => {
  try {
    const passages = await PassageModel.find({ status: 'FINISHED', 'scores.isPublished': true })
      .populate('group', 'name')
      .populate('apparatus', 'name code icon')
      .sort({ 'scores.total': -1 })
      .lean()
      .exec();

    return passages.map((p: any) => ({
      _id: p._id,
      group: p.group ? { _id: p.group._id, name: p.group.name } : null,
      apparatus: p.apparatus ? { _id: p.apparatus._id, name: p.apparatus.name, code: p.apparatus.code, icon: p.apparatus.icon } : null,
      scores: p.scores,
      startTime: p.startTime,
      endTime: p.endTime,
      location: p.location,
      status: p.status,
    }));
  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
});
