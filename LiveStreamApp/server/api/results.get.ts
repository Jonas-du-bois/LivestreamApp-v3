import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';
import { RESULTS_CACHE_MAX_AGE } from '../utils/timings';

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);
  let dayFilter = query.day;
  if (Array.isArray(dayFilter)) dayFilter = dayFilter[0];
  if (typeof dayFilter !== 'string') dayFilter = undefined;

  let roundFilter = query.round;
  if (Array.isArray(roundFilter)) roundFilter = roundFilter[0];
  if (typeof roundFilter !== 'string') roundFilter = undefined;

  try {
    // 1. Metadata: Available Days & Rounds
    const dayAggregation = await getCachedAvailablePublishedDays();

    const dayMap = new Map<string, string[]>();
    const availableDaysSet = new Set<string>();

    dayAggregation.forEach((d: any) => {
      if (!d.sampleDate) return;
      const date = new Date(d.sampleDate);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'Europe/Zurich' });
      const key = dayName.toLowerCase();
      availableDaysSet.add(dayName);
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)?.push(d._id);
    });

    const availableDays = ['Tout', ...Array.from(availableDaysSet)];

    // Default to 'Tout' if none provided
    let activeDay = dayFilter;
    if (!activeDay) {
      activeDay = 'Tout';
    }

    // Check if any finals are published for the ACTIVE DAY to decide default round
    let dayStartTimeFilter: any = null;
    if (activeDay && activeDay !== 'Tout') {
      const targetDateStrings = dayMap.get(activeDay.toLowerCase());
      if (targetDateStrings && targetDateStrings.length > 0) {
        const ranges = targetDateStrings.map((ds: string) => {
          const start = new Date(`${ds}T00:00:00.000+02:00`); // CEST is +02:00 in May
          const end = new Date(`${ds}T23:59:59.999+02:00`);
          return { startTime: { $gte: start, $lte: end } };
        });
        dayStartTimeFilter = ranges.length === 1 ? ranges[0] : { $or: ranges };
      }
    }

    const hasFinals = await PassageModel.exists({ 
      round: 'FINAL', 
      isPublished: true,
      ...(dayStartTimeFilter ? dayStartTimeFilter : {})
    });

    const defaultRound = hasFinals ? 'FINAL' : 'QUALIFIER';
    const activeRound = roundFilter || defaultRound;

    // 2. Build Filter Query
    const matchQuery: any = { isPublished: true, round: activeRound };
    if (dayStartTimeFilter) {
      Object.assign(matchQuery, dayStartTimeFilter);
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
            { $project: { _id: 1, name: 1, category: 1, subCategory: 1, canton: 1, logo: 1 } }
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

       // Group by category locally to assign proper ranks
       const categoryMap = new Map<string, any[]>();
       item.passages.forEach((p: any) => {
         const cat = p.group?.subCategory || p.group?.category || 'Sans catégorie';
         if (!categoryMap.has(cat)) categoryMap.set(cat, []);
         categoryMap.get(cat)!.push({
           ...p,
           group: (p.group && p.group._id) ? p.group : null,
           apparatus: appInfo
         });
       });

       const finalPassages: any[] = [];
       // For each category, assign rank (they are already sorted by score)
       for (const [cat, passList] of categoryMap.entries()) {
         passList.forEach((p, index) => {
           p.rank = index + 1;
           finalPassages.push(p);
         });
       }

       grouped[code] = finalPassages;
    });

    return {
      meta: {
        availableDays,
        activeDay,
        activeRound,
        hasFinals
      },
      data: grouped
    };

  } catch (err) {
    console.error('[results] Error fetching results', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch results: ' + err });
  }
}, {
  maxAge: RESULTS_CACHE_MAX_AGE,
  swr: true,
  name: 'api-results-v2',
  getKey: (event) => {
    const day = getQuery(event).day;
    const round = getQuery(event).round;
    return `results-${day ? String(day).toLowerCase() : 'all'}-${round || 'QUALIFIER'}`;
  },
  shouldBypassCache(event) {
    const query = getQuery(event);
    return !!query._t || !!query.server;
  }
});
