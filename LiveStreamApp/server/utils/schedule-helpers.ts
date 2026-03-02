import PassageModel from '../models/Passage';

export const getCachedAvailableDays = defineCachedFunction(async () => {
  return await PassageModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
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

export const getCachedPublishedDays = defineCachedFunction(async () => {
  return await PassageModel.aggregate([
    { $match: { isPublished: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
        sampleDate: { $first: "$startTime" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}, {
  maxAge: 60 * 60, // 1 hour
  name: 'publishedDays',
  getKey: () => 'default'
});
