import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';
import { SCHEDULE_CACHE_MAX_AGE, SCHEDULE_CACHE_STALE_MAX_AGE } from '../utils/timings';

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);

  // Security: Sanitize inputs to prevent DoS (Parameter Pollution) and Type Errors

  // Day Filter: Expects string. If array (duplicate param), take first.
  let dayFilter = query.day;
  if (Array.isArray(dayFilter)) dayFilter = dayFilter[0];
  if (typeof dayFilter !== 'string') dayFilter = undefined;

  // Other filters: Allow string or string[]
  const apparatusFilter = query.apparatus as string | string[] | undefined;
  const divisionFilter = query.division as string | string[] | undefined;
  const salleFilter = query.salle as string | string[] | undefined;

  try {
    // OPTIMIZATION: Run independent queries in parallel
    // 1. Metadata: Available Days (Aggregation)
    // 2. Filter Lookups (Apparatus IDs)
    // 3. Filter Lookups (Group IDs)

    // BOLT: Optimized aggregation - merged $project into $group to avoid redundant document creation
    const dayAggregationPromise = PassageModel.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          sampleDate: { $first: "$startTime" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    let apparatusIdsPromise = Promise.resolve(null);
    if (apparatusFilter && apparatusFilter !== 'Tout') {
      const rawNames = Array.isArray(apparatusFilter) ? apparatusFilter : [apparatusFilter];
      const appNames = rawNames.filter(n => typeof n === 'string');
      if (appNames.length > 0) {
        apparatusIdsPromise = ApparatusModel.find({ name: { $in: appNames } }).select('_id').lean();
      }
    }

    let groupIdsPromise = Promise.resolve(null);
    if (divisionFilter && divisionFilter !== 'Tout') {
      const rawCategories = Array.isArray(divisionFilter) ? divisionFilter : [divisionFilter];
      const categories = rawCategories.filter(c => typeof c === 'string');
      if (categories.length > 0) {
        groupIdsPromise = GroupModel.find({ category: { $in: categories } }).select('_id').lean();
      }
    }

    const [dayAggregation, apparatusIdsResult, groupIdsResult] = await Promise.all([
      dayAggregationPromise,
      apparatusIdsPromise,
      groupIdsPromise
    ]);

    // Process Day Map
    const dayMap = new Map<string, string[]>(); // Map 'samedi' -> ['2023-10-14']
    const availableDaysSet = new Set<string>();

    dayAggregation.forEach((d: any) => {
      if (!d.sampleDate) return;
      const date = new Date(d.sampleDate);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const key = dayName.toLowerCase();

      availableDaysSet.add(dayName);

      if (!dayMap.has(key)) {
        dayMap.set(key, []);
      }
      dayMap.get(key)?.push(d._id);
    });

    const availableDays = Array.from(availableDaysSet);

    // 2. Build Filter Query
    const dbQuery: any = {};

    // Filter by Day
    if (dayFilter && dayFilter !== 'Tout') {
      const targetDateStrings = dayMap.get(dayFilter.toLowerCase());
      if (targetDateStrings && targetDateStrings.length > 0) {
        // Construct Range Query for each identified day
        const ranges = targetDateStrings.map((ds: string) => {
          // Assume UTC day boundaries (since we grouped by UTC date string)
          const start = new Date(`${ds}T00:00:00.000Z`);
          const end = new Date(`${ds}T23:59:59.999Z`);
          return { startTime: { $gte: start, $lte: end } };
        });

        if (ranges.length === 1 && ranges[0]) {
          dbQuery.startTime = ranges[0].startTime;
        } else {
          dbQuery.$or = ranges;
        }
      } else {
        // If the day doesn't exist in map (e.g. bad input), return nothing
        dbQuery.startTime = { $exists: false, $eq: null };
      }
    }

    // Filter by Apparatus (from resolved promise)
    if (apparatusIdsResult && apparatusIdsResult.length > 0) {
      const appIds = apparatusIdsResult.map((a: any) => a._id);
      dbQuery.apparatus = { $in: appIds };
    }

    // Filter by Division (from resolved promise)
    if (groupIdsResult && groupIdsResult.length > 0) {
      const groupIds = groupIdsResult.map((g: any) => g._id);
      dbQuery.group = { $in: groupIds };
    }

    // Filter by Salle (Location) - Sync logic
    if (salleFilter && salleFilter !== 'Tout') {
      const rawLocations = Array.isArray(salleFilter) ? salleFilter : [salleFilter];
      // Security: Ensure all items are strings
      const locations = rawLocations.filter(l => typeof l === 'string');

      if (locations.length > 0) {
        dbQuery.location = { $in: locations };
      }
    }

    // 3. Metadata: Available Lists (Dynamic)
    // OPTIMIZATION: Use Aggregation Facets to fetch all metadata in a single DB round trip

    // Available Apparatus: Remove apparatus filter
    const metaQueryApparatus = { ...dbQuery };
    delete metaQueryApparatus.apparatus;

    // Available Categories: Remove group filter
    const metaQueryCategories = { ...dbQuery };
    delete metaQueryCategories.group;

    // Available Locations: Remove location filter
    const metaQueryLocations = { ...dbQuery };
    delete metaQueryLocations.location;

    // OPTIMIZATION: Hoist the 'startTime' match to filter the stream BEFORE entering the facet stage.
    // This utilizes the index on 'startTime' efficiently and reduces documents processed by $facet.
    const facetPipeline: any[] = [];

    if (dbQuery.startTime) {
      facetPipeline.push({ $match: { startTime: dbQuery.startTime } });
    } else if (dbQuery.$or) {
       // If day filter uses $or (multiple days), we can match that too
       facetPipeline.push({ $match: { $or: dbQuery.$or } });
    }

    facetPipeline.push({
      $facet: {
        apparatus: [
          { $match: metaQueryApparatus },
          { $group: { _id: "$apparatus" } },
          {
            $lookup: {
              from: ApparatusModel.collection.name,
              localField: "_id",
              foreignField: "_id",
              as: "info"
            }
          },
          { $unwind: "$info" },
          { $replaceRoot: { newRoot: "$info" } },
          { $project: { name: 1, code: 1 } }
        ],
        categories: [
          { $match: metaQueryCategories },
          { $group: { _id: "$group" } },
          {
            $lookup: {
              from: GroupModel.collection.name,
              localField: "_id",
              foreignField: "_id",
              as: "info"
            }
          },
          { $unwind: "$info" },
          { $replaceRoot: { newRoot: "$info" } },
          { $project: { category: 1 } }
        ],
        locations: [
          { $match: metaQueryLocations },
          { $group: { _id: "$location" } },
          { $sort: { _id: 1 } } // Optional: sort locations
        ]
      }
    });

    // OPTIMIZATION: Run metadata aggregation and data fetching in parallel
    const [facetsResult, passages] = await Promise.all([
      PassageModel.aggregate(facetPipeline),
      PassageModel.find(dbQuery)
        .select('startTime endTime location status score group apparatus')
        .populate('group', 'name category')
        .populate('apparatus', 'name code icon')
        .sort({ startTime: 1 }) // Sorting at DB level
        .lean()
        .exec()
    ]);

    const facets = facetsResult[0];

    const availableApparatus = facets?.apparatus ? facets.apparatus.map((a: any) => ({ code: a.code, name: a.name })) : [];
    const availableCategories = facets?.categories
      ? [...new Set(facets.categories.map((c: any) => c.category).filter(Boolean))]
      : [];
    const availableLocations = facets?.locations ? facets.locations.map((l: any) => l._id).filter(Boolean) : [];

    // 5. Format Response
    const formattedData = passages.map((p: any) => ({
      _id: p._id,
      group: p.group ? { _id: p.group._id, name: p.group.name, category: p.group.category } : null,
      apparatus: p.apparatus ? {
        _id: p.apparatus._id,
        name: p.apparatus.name,
        code: p.apparatus.code,
        icon: p.apparatus.icon
      } : null,
      startTime: p.startTime,
      endTime: p.endTime,
      location: p.location,
      status: p.status,
      score: p.score
    }));

    return {
      meta: {
        availableApparatus,
        availableDays,
        availableCategories,
        availableLocations
      },
      data: formattedData
    };

  } catch (err) {
    console.error('[schedule] Error:', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch schedule' });
  }
}, {
  swr: true,
  maxAge: SCHEDULE_CACHE_MAX_AGE,
  staleMaxAge: SCHEDULE_CACHE_STALE_MAX_AGE
});
