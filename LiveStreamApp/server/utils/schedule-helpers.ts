import PassageModel from '../models/Passage';
import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';

export const getCachedAvailableDays = defineCachedFunction(async () => {
  return await PassageModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime", timezone: "Europe/Zurich" } },
        sampleDate: { $first: "$startTime" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}, {
  maxAge: 60 * 60, // 1 hour
  name: 'availableDays',
  getKey: () => 'default'
});

export const getCachedAvailablePublishedDays = defineCachedFunction(async () => {
  return await PassageModel.aggregate([
    { $match: { isPublished: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime", timezone: "Europe/Zurich" } },
        sampleDate: { $first: "$startTime" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}, {
  maxAge: 60 * 60, // 1 hour
  name: 'availablePublishedDays',
  getKey: () => 'default'
});

export async function updateScheduleMetadata() {
  try {
    const facetPipeline: any[] = [
      {
        $facet: {
          apparatus: [
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
            { $project: { name: 1, code: 1 } },
            { $sort: { name: 1 } }
          ],
          categories: [
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
            { $group: { _id: "$location" } },
            { $sort: { _id: 1 } }
          ],
          days: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
                sampleDate: { $first: "$startTime" }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ];

    const facetsResult = await PassageModel.aggregate(facetPipeline);
    const facets = facetsResult[0];

    const availableApparatus = facets?.apparatus ? facets.apparatus.map((a: any) => ({ code: a.code, name: a.name })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })) : [];
    
    const availableCategories = facets?.categories
      ? [...new Set(facets.categories.map((c: any) => c.category).filter(Boolean))]
      : [];
      
    const availableLocations = facets?.locations ? facets.locations.map((l: any) => l._id).filter(Boolean) : [];

    // Process Day Map
    const availableDaysSet = new Set<string>();
    if (facets?.days) {
      facets.days.forEach((d: any) => {
        if (!d.sampleDate) return;
        const date = new Date(d.sampleDate);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        availableDaysSet.add(dayName);
      });
    }
    const availableDays = Array.from(availableDaysSet);

    const metaObject = {
      availableApparatus,
      availableCategories,
      availableLocations,
      availableDays,
      dayAggregation: facets?.days || []
    };

    const storage = useStorage('cache');
    await storage.setItem('schedule:metadata', metaObject);
    console.log('[Scheduler] Schedule metadata updated in cache');
  } catch (err) {
    console.error('[Scheduler] Error updating schedule metadata:', err);
  }
}
