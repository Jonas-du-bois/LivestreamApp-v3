import PassageModel from '../models/Passage';

export default defineEventHandler(async (event) => {
  try {
    const passages = await PassageModel.find({ status: 'FINISHED' })
      .populate('group', 'name category')
      .populate('apparatus', 'name code icon')
      .sort({ 'scores.total': -1 })
      .lean()
      .exec();

    const grouped: Record<string, any[]> = {};

    passages.forEach((p: any) => {
       if (!p.apparatus || !p.apparatus.code) return;
       const code = p.apparatus.code;

       if (!grouped[code]) {
           grouped[code] = [];
       }

       grouped[code].push({
          _id: p._id,
          group: p.group ? { _id: p.group._id, name: p.group.name, category: p.group.category } : null,
          apparatus: p.apparatus ? { _id: p.apparatus._id, name: p.apparatus.name, code: p.apparatus.code, icon: p.apparatus.icon } : null,
          scores: p.scores,
          rank: 0, // Will compute below
          startTime: p.startTime,
          endTime: p.endTime,
          location: p.location,
          status: p.status,
       });
    });

    // Compute ranks
    Object.values(grouped).forEach(groupList => {
        // Sort descending by total score
        groupList.sort((a, b) => (b.scores?.total || 0) - (a.scores?.total || 0));
        groupList.forEach((p, index) => {
            p.rank = index + 1;
        });
    });

    return grouped;

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
});
