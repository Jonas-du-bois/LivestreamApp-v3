import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const dayFilter = query.day as string | undefined;
  const apparatusFilter = query.apparatus as string | string[] | undefined;

  try {
    // 1. Metadata: Available Days
    // Get all distinct start times to determine available days and map them
    const startTimes = await PassageModel.distinct('startTime').exec();

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

    // 3. Metadata: Available Apparatus (Dynamic)
    // "If no group is passing at 'Saut' today..." -> Depend on Day filter
    const metaQuery = { ...dbQuery };
    delete metaQuery.apparatus; // Don't restrict by apparatus selection itself

    const usedApparatusIds = await PassageModel.distinct('apparatus', metaQuery).exec();
    const usedApparatusDocs = await ApparatusModel.find({ _id: { $in: usedApparatusIds } }).select('name').lean();
    const availableApparatus = usedApparatusDocs.map((a: any) => a.name);

    // 4. Fetch Data
    const passages = await PassageModel.find(dbQuery)
      .select('startTime endTime location status scores group apparatus')
      .populate('group', 'name')
      .populate('apparatus', 'name code icon')
      .sort({ startTime: 1 }) // Sorting at DB level
      .lean()
      .exec();

    // 5. Format Response
    const formattedData = passages.map((p: any) => ({
      _id: p._id,
      group: p.group ? { _id: p.group._id, name: p.group.name } : null,
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
      scores: p.scores
    }));

    return {
      meta: {
        availableApparatus,
        availableDays
      },
      data: formattedData
    };

  } catch (err) {
    console.error('[schedule] Error:', err);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch schedule' });
  }
});
