import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';
import { SCHEDULE_CACHE_MAX_AGE, SCHEDULE_CACHE_STALE_MAX_AGE } from '../utils/timings';
import { z } from 'zod';
import { useValidatedQuery } from 'h3-zod';

const schema = z.object({
  day: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v[0] : v),
  apparatus: z.union([z.string(), z.array(z.string())]).optional(),
  division: z.union([z.string(), z.array(z.string())]).optional(),
  salle: z.union([z.string(), z.array(z.string())]).optional()
});

export default defineCachedEventHandler(async (event) => {
  const validatedQuery = await useValidatedQuery(event, schema);

  // Day Filter: Expects string. If array (duplicate param), take first.
  let dayFilter = validatedQuery.day;

  // Other filters: Allow string or string[]
  const apparatusFilter = validatedQuery.apparatus;
  const divisionFilter = validatedQuery.division;
  const salleFilter = validatedQuery.salle;

  try {
    // Load pre-computed metadata
    const storage = useStorage('cache');
    const cachedMeta = await storage.getItem('schedule:metadata') as any || {};
    
    const availableApparatus = cachedMeta.availableApparatus || [];
    const availableCategories = cachedMeta.availableCategories || [];
    const availableLocations = cachedMeta.availableLocations || [];
    const availableDays = cachedMeta.availableDays || [];
    const dayAggregation = cachedMeta.dayAggregation || [];

    let apparatusIdsPromise: Promise<any> | null = null;
    if (apparatusFilter && apparatusFilter !== 'Tout') {
      const rawNames = Array.isArray(apparatusFilter) ? apparatusFilter : [apparatusFilter];
      const appNames = rawNames.filter(n => typeof n === 'string');
      if (appNames.length > 0) {
        apparatusIdsPromise = ApparatusModel.find({ name: { $in: appNames } }).select('_id').lean();
      }
    }

    let groupIdsPromise: Promise<any> | null = null;
    if (divisionFilter && divisionFilter !== 'Tout') {
      const rawCategories = Array.isArray(divisionFilter) ? divisionFilter : [divisionFilter];
      const categories = rawCategories.filter(c => typeof c === 'string');
      if (categories.length > 0) {
        groupIdsPromise = GroupModel.find({ category: { $in: categories } }).select('_id').lean();
      }
    }

    const [apparatusIdsResult, groupIdsResult] = await Promise.all([
      apparatusIdsPromise,
      groupIdsPromise
    ]);

    // Process Day Map
    const dayMap = new Map<string, string[]>(); // Map 'samedi' -> ['2023-10-14']

    dayAggregation.forEach((d: any) => {
      if (!d.sampleDate) return;
      const date = new Date(d.sampleDate);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      const key = dayName.toLowerCase();

      if (!dayMap.has(key)) {
        dayMap.set(key, []);
      }
      dayMap.get(key)?.push(d._id);
    });

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

    const passages = await PassageModel.find(dbQuery)
      .select('startTime endTime location status score group apparatus')
      .populate('group', 'name category canton logo')
      .populate('apparatus', 'name code icon')
      .sort({ startTime: 1 }) // Sorting at DB level
      .lean()
      .exec();

    // 5. Format Response
    const formattedData = passages.map((p: any) => ({
      _id: p._id,
      group: p.group ? {
        _id: p.group._id,
        name: p.group.name,
        category: p.group.category,
        canton: p.group.canton,
        logo: p.group.logo
      } : null,
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
