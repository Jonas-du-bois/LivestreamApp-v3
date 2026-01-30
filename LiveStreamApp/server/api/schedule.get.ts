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

    // Available Apparatus: Remove apparatus filter from current dbQuery
    const metaQueryApparatus = { ...dbQuery };
    delete metaQueryApparatus.apparatus;

    const usedApparatusIds = await PassageModel.distinct('apparatus', metaQueryApparatus).exec();
    const usedApparatusDocs = await ApparatusModel.find({ _id: { $in: usedApparatusIds } }).select('name').lean();
    const availableApparatus = usedApparatusDocs.map((a: any) => a.name);

    // Available Categories: Remove group filter from dbQuery
    const metaQueryCategories = { ...dbQuery };
    delete metaQueryCategories.group;

    const usedGroupIds = await PassageModel.distinct('group', metaQueryCategories).exec();
    const usedGroups = await GroupModel.find({ _id: { $in: usedGroupIds } }).select('category').lean();
    const availableCategories = [...new Set(usedGroups.map((g: any) => g.category).filter(Boolean))];

    // Available Locations: Remove location filter from dbQuery
    const metaQueryLocations = { ...dbQuery };
    delete metaQueryLocations.location;

    const availableLocations = await PassageModel.distinct('location', metaQueryLocations).exec();

    // 4. Fetch Data
    const passages = await PassageModel.find(dbQuery)
      .select('startTime endTime location status score group apparatus')
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
