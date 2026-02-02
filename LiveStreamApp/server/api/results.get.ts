import PassageModel from '../models/Passage';
import GroupModel from '../models/Group';
import ApparatusModel from '../models/Apparatus';

export default defineEventHandler(async (event) => {
  try {
    // ⚡ Bolt Optimization: Use Aggregation to group and sort in DB
    // This reduces data transfer and offloads processing to MongoDB
    const aggregated = await PassageModel.aggregate([
      { $match: { isPublished: true } },
      {
        $lookup: {
          from: ApparatusModel.collection.name,
          localField: 'apparatus',
          foreignField: '_id',
          as: 'apparatus_doc'
        }
      },
      { $unwind: '$apparatus_doc' },
      {
        $lookup: {
          from: GroupModel.collection.name,
          localField: 'group',
          foreignField: '_id',
          as: 'group_doc'
        }
      },
      { $unwind: { path: '$group_doc', preserveNullAndEmptyArrays: true } },
      { $sort: { score: -1 } },
      {
        $group: {
          _id: '$apparatus_doc.code',
          results: {
            $push: {
              _id: '$_id',
              group: {
                $cond: {
                  if: { $ifNull: ["$group_doc._id", false] },
                  then: {
                    _id: '$group_doc._id',
                    name: '$group_doc.name',
                    category: '$group_doc.category',
                    canton: '$group_doc.canton',
                    logo: '$group_doc.logo'
                  },
                  else: null
                }
              },
              apparatus: {
                _id: '$apparatus_doc._id',
                name: '$apparatus_doc.name',
                code: '$apparatus_doc.code',
                icon: '$apparatus_doc.icon'
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

    aggregated.forEach((group: any) => {
       const list = group.results;
       // Assign ranks (already sorted by score desc)
       list.forEach((p: any, index: number) => {
         p.rank = index + 1;
       });
       grouped[group._id] = list;
    });

    return grouped;

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
});
