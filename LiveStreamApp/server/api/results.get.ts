import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';

export default defineEventHandler(async (event) => {
  try {
    // ⚡ Bolt Optimization: Use Aggregation Pipeline instead of find().populate()
    // This moves grouping and sorting to the database, reducing memory usage and transfer size.
    const result = await PassageModel.aggregate([
      // 1. Filter published passages
      { $match: { isPublished: true } },

      // 2. Sort by score descending (uses index { isPublished: 1, score: -1 })
      { $sort: { score: -1 } },

      // 3. Join Apparatus
      {
        $lookup: {
          from: ApparatusModel.collection.name,
          localField: 'apparatus',
          foreignField: '_id',
          as: 'apparatus'
        }
      },
      { $unwind: '$apparatus' }, // Filter out passages with missing apparatus (matches original behavior)

      // 4. Join Group
      {
        $lookup: {
          from: GroupModel.collection.name,
          localField: 'group',
          foreignField: '_id',
          as: 'group'
        }
      },
      { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } }, // Allow passages with missing group (matches original behavior)

      // 5. Group by Apparatus Code
      {
        $group: {
          _id: '$apparatus.code',
          passages: {
            $push: {
              _id: '$_id',
              group: {
                $cond: {
                  if: { $ifNull: ['$group._id', false] },
                  then: {
                    _id: '$group._id',
                    name: '$group.name',
                    category: '$group.category',
                    canton: '$group.canton',
                    logo: '$group.logo'
                  },
                  else: null
                }
              },
              apparatus: {
                _id: '$apparatus._id',
                name: '$apparatus.name',
                code: '$apparatus.code',
                icon: '$apparatus.icon'
              },
              score: '$score',
              startTime: '$startTime',
              endTime: '$endTime',
              location: '$location',
              status: '$status'
            }
          }
        }
      }
    ]);

    const grouped: Record<string, any[]> = {};

    result.forEach((item: any) => {
      // Passages are already sorted by score due to the initial $sort + $push order preservation
      const passages = item.passages.map((p: any, index: number) => ({
        ...p,
        rank: index + 1
      }));
      grouped[item._id] = passages;
    });

    return grouped;

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
});
