import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';
import { RESULTS_CACHE_MAX_AGE } from '../utils/timings';

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);
  let dayFilter = query.day;
  if (Array.isArray(dayFilter)) dayFilter = dayFilter[0];
  if (typeof dayFilter !== 'string') dayFilter = undefined;

  try {
    // 1. Metadata: Available Days
    const dayAggregation = await PassageModel.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          sampleDate: { $first: "$startTime" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dayMap = new Map<string, string[]>();
    const availableDaysSet = new Set<string>();

    dayAggregation.forEach((d: any) => {
      if (!d.sampleDate) return;
      const date = new Date(d.sampleDate);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const key = dayName.toLowerCase();
      availableDaysSet.add(dayName);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)?.push(d._id);
    });

    const availableDays = Array.from(availableDaysSet);

    // 2. Build Filter Query
    const matchQuery: any = { isPublished: true };

    if (dayFilter && dayFilter !== 'Tout') {
      const targetDateStrings = dayMap.get(dayFilter.toLowerCase());
      if (targetDateStrings && targetDateStrings.length > 0) {
        const ranges = targetDateStrings.map((ds: string) => {
          const start = new Date(`${ds}T00:00:00.000Z`);
          const end = new Date(`${ds}T23:59:59.999Z`);
          return { startTime: { $gte: start, $lte: end } };
        });
        if (ranges.length === 1 && ranges[0]) {
          matchQuery.startTime = ranges[0].startTime;
        } else {
          matchQuery.$or = ranges;
        }
      }
    }

    // 3. Aggregation Pipeline
    const pipeline: any[] = [
      { $match: matchQuery },
      { $sort: { score: -1 } },

      // Lookup Group FIRST
      {
        $lookup: {
          from: GroupModel.collection.name,
          localField: 'group',
          foreignField: '_id',
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

      {
        $project: {
          _id: 1,
          score: 1,
          status: 1,
          group: 1,
          apparatus: 1,
          startTime: 1,
          endTime: 1,
          location: 1
        }
      },

      {
        $group: {
          _id: "$apparatus",
          passages: { $push: "$$ROOT" }
        }
      },

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

       grouped[code] = item.passages.map((p: any, index: number) => ({
         ...p,
         group: (p.group && p.group._id) ? p.group : null,
         apparatus: appInfo,
         rank: index + 1
       }));
    });

    return {
      meta: {
        availableDays
      },
      data: grouped
    };

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results' });
  }
}, {
  maxAge: RESULTS_CACHE_MAX_AGE,
  swr: true,
  name: 'api-results-v2'
});
