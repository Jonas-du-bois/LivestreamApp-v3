import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);
  const dayFilter = query.day as string | undefined;
  const apparatusFilter = query.apparatus as string | string[] | undefined;
  const divisionFilter = query.division as string | string[] | undefined;
  const salleFilter = query.salle as string | string[] | undefined;

  try {
    // 1. Metadata: Available Days
    // Get all distinct start times to determine available days and map them
    const startTimes = await PassageModel.distinct('startTime').exec();
    // Sort timestamps to ensure consistent day order (prevents hydration mismatches)
    startTimes.sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());

    const dayMap = new Map<string, Date[]>();
    const availableDaysSet = new Set<string>();

    startTimes.forEach((d: any) => {
      if (!d) return;
      const date = new Date(d);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const key = dayName.toLowerCase();

      availableDaysSet.add(dayName); // Keep original casing (or lowercase?) - Existing code used lowercase comparison but display might be mixed.
      // Actually existing code: `availableDays = Array.from(daysSet)` where `daysSet.add(d)` (lowercase 'samedi' usually).

      if (!dayMap.has(key)) {
        dayMap.set(key, []);
      }
      dayMap.get(key)?.push(date);
    });

    const availableDays = Array.from(availableDaysSet);

    // 2. Build Filter Query
    const dbQuery: any = {};

    // Filter by Day
    if (dayFilter && dayFilter !== 'Tout') {
      const targetDates = dayMap.get(dayFilter.toLowerCase());
      if (targetDates && targetDates.length > 0) {
        // Since we got exact timestamps from distinct(), we can use $in
        dbQuery.startTime = { $in: targetDates };
      } else {
        // If the day doesn't exist in map (e.g. bad input), return nothing
        dbQuery.startTime = { $exists: false, $eq: null };
      }
    }

    // Filter by Apparatus
    if (apparatusFilter && apparatusFilter !== 'Tout') {
      const appNames = Array.isArray(apparatusFilter) ? apparatusFilter : [apparatusFilter];
      const apps = await ApparatusModel.find({ name: { $in: appNames } }).select('_id').lean();
      const appIds = apps.map((a: any) => a._id);
      dbQuery.apparatus = { $in: appIds };
    }

    // Filter by Division (Category)
    if (divisionFilter && divisionFilter !== 'Tout') {
      const categories = Array.isArray(divisionFilter) ? divisionFilter : [divisionFilter];
      const groups = await GroupModel.find({ category: { $in: categories } }).select('_id').lean();
      const groupIds = groups.map((g: any) => g._id);
      dbQuery.group = { $in: groupIds };
    }

    // Filter by Salle (Location)
    if (salleFilter && salleFilter !== 'Tout') {
      const locations = Array.isArray(salleFilter) ? salleFilter : [salleFilter];
      dbQuery.location = { $in: locations };
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

    const [facets] = await PassageModel.aggregate([
      {
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
            { $project: { name: 1 } }
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
      }
    ]);

    const availableApparatus = facets?.apparatus ? facets.apparatus.map((a: any) => a.name) : [];
    const availableCategories = facets?.categories
      ? [...new Set(facets.categories.map((c: any) => c.category).filter(Boolean))]
      : [];
    const availableLocations = facets?.locations ? facets.locations.map((l: any) => l._id).filter(Boolean) : [];

    // 4. Fetch Data
    const passages = await PassageModel.find(dbQuery)
      .select('startTime endTime location status score group apparatus')
      .populate('group', 'name category')
      .populate('apparatus', 'name code icon')
      .sort({ startTime: 1 }) // Sorting at DB level
      .lean()
      .exec();

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
  maxAge: 10
});
