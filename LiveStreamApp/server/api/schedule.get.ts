import PassageModel from '../models/Passage';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { day, apparatus } = query;

  try {
    // 1. Fetch all passages to build metadata
    const allPassages = await PassageModel.find()
      .populate('group')
      .populate('apparatus')
      .sort({ startTime: 1 })
      .lean()
      .exec();

    // 2. Build Metadata
    const daysSet = new Set<string>();
    const apparatusSet = new Set<string>();

    allPassages.forEach((p: any) => {
      if (p.startTime) {
        // Use French locale for days to match frontend expectations (e.g., 'samedi')
        const d = new Date(p.startTime).toLocaleDateString('fr-FR', { weekday: 'long' });
        daysSet.add(d);
      }
      if (p.apparatus && p.apparatus.name) {
        apparatusSet.add(p.apparatus.name);
      }
    });

    const availableDays = Array.from(daysSet);
    const availableApparatus = Array.from(apparatusSet);

    // 3. Apply Filters
    let filtered = allPassages;

    if (day && day !== 'Tout') {
      filtered = filtered.filter((p: any) => {
        const d = new Date(p.startTime).toLocaleDateString('fr-FR', { weekday: 'long' });
        return d.toLowerCase() === (day as string).toLowerCase();
      });
    }

    if (apparatus && apparatus !== 'Tout') {
      const apps = Array.isArray(apparatus) ? apparatus : [apparatus];
      filtered = filtered.filter((p: any) => {
        return apps.includes(p.apparatus?.name);
      });
    }

    // 4. Format Data
    const formattedData = filtered.map((p: any) => ({
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
