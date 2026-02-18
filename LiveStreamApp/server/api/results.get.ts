import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';

export default defineCachedEventHandler(async (event) => {
  try {
    // OPTIMIZATION: Use Aggregation Pipeline instead of find() + in-memory processing
    // This reduces memory usage and leverages DB for sorting and grouping
    // BOLT: Optimized to group by Apparatus ID first, reducing Apparatus lookups from O(N) to O(M)
    const pipeline: any[] = [
      { $match: { isPublished: true } },
      { $sort: { score: -1 } },

      // Lookup Group FIRST (needed for each passage)
      {
        $lookup: {
          from: GroupModel.collection.name,
          localField: 'group',
          foreignField: '_id',
          // OPTIMIZATION: Project early to avoid fetching large history/description fields
          pipeline: [
            { $project: { _id: 1, name: 1, category: 1, canton: 1, logo: 1 } }
          ],
          as: 'group'
        }
      },
      {
        $unwind: {
          path: '$group',
          preserveNullAndEmptyArrays: true
        }
      },

      // OPTIMIZATION: Project ONLY used fields to reduce payload size before grouping.
      // This strips large unused fields like 'history' and 'monitors' (~80% size reduction).
      {
        $project: {
          _id: 1,
          group: 1,
          apparatus: 1,
          score: 1,
          startTime: 1,
          endTime: 1,
          location: 1,
          status: 1,
          isPublished: 1
        }
      },

      // OPTIMIZATION: Group by Apparatus ID immediately to avoid looking up apparatus details for every passage
      {
        $group: {
          _id: "$apparatus", // Group by ObjectId
          passages: { $push: "$$ROOT" }
        }
      },

      // Now Lookup Apparatus for the GROUP (only ~6 times instead of hundreds)
      {
        $lookup: {
          from: ApparatusModel.collection.name,
          localField: "_id",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, name: 1, code: 1, icon: 1 } }
          ],
          as: "apparatusInfo"
        }
      },
      { $unwind: "$apparatusInfo" }
    ];

    const result = await PassageModel.aggregate(pipeline);

    const grouped: Record<string, any[]> = {};

    result.forEach((item: any) => {
       if (!item.apparatusInfo || !item.apparatusInfo.code) return;

       const appInfo = item.apparatusInfo;
       const code = appInfo.code;

       // Add rank (since passages are already sorted by score desc in the group)
       // And inject the apparatus info back into each passage object
       grouped[code] = item.passages.map((p: any, index: number) => ({
         ...p,
         // Ensure group is null if missing (orphaned passage), matching original behavior
         group: (p.group && p.group._id) ? p.group : null,
         // Inject the looked-up info to match the expected API response structure
         apparatus: appInfo,
         rank: index + 1
       }));
    });

    return grouped;

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
}, {
  maxAge: 10,
  swr: true,
  name: 'api-results'
});
