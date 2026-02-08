import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';

export default defineEventHandler(async (event) => {
  try {
    // OPTIMIZATION: Use Aggregation Pipeline instead of find() + in-memory processing
    // This reduces memory usage and leverages DB for sorting and grouping
    const pipeline: any[] = [
      { $match: { isPublished: true } },
      { $sort: { score: -1 } },
      {
        $lookup: {
          from: ApparatusModel.collection.name,
          localField: 'apparatus',
          foreignField: '_id',
          as: 'apparatus'
        }
      },
      { $unwind: '$apparatus' },
      {
        $lookup: {
          from: GroupModel.collection.name,
          localField: 'group',
          foreignField: '_id',
          as: 'group'
        }
      },
      {
        $unwind: {
          path: '$group',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          score: 1,
          startTime: 1,
          endTime: 1,
          location: 1,
          status: 1,
          "group._id": 1,
          "group.name": 1,
          "group.category": 1,
          "group.canton": 1,
          "group.logo": 1,
          "apparatus._id": 1,
          "apparatus.name": 1,
          "apparatus.code": 1,
          "apparatus.icon": 1
        }
      },
      {
        $group: {
          _id: "$apparatus.code",
          passages: { $push: "$$ROOT" }
        }
      }
    ];

    const result = await PassageModel.aggregate(pipeline);

    const grouped: Record<string, any[]> = {};

    result.forEach((item: any) => {
       if (!item._id) return;
       // Add rank (since passages are already sorted by score desc in the group)
       grouped[item._id] = item.passages.map((p: any, index: number) => ({
         ...p,
         // Ensure group is null if missing (orphaned passage), matching original behavior
         group: (p.group && p.group._id) ? p.group : null,
         rank: index + 1
       }));
    });

    return grouped;

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
});
