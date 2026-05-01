import { z } from 'zod';
import { useSafeValidatedBody } from 'h3-zod';
import PassageModel from '../../models/Passage';
import ApparatusModel from '../../models/Apparatus';
import { PASSAGE_ROUND } from '../../models/Passage';

/**
 * Zod schema for finals generation request.
 */
const schema = z.object({
  apparatusId: z.string().describe('ID of the apparatus to generate finals for'),
  category: z.string().optional().describe('Filter qualifiers by group category'),
  qualifiersCount: z.number().min(1).max(20).default(3).describe('Number of top groups to qualify'),
  startTime: z.string().describe('ISO string or parseable date string for the first final passage'),
  intervalMinutes: z.number().min(1).max(30).default(8).describe('Gap between each final passage'),
  location: z.string().optional().describe('Location where finals take place'),
});

/**
 * Admin endpoint to generate final round passages based on qualifier results.
 * Logic:
 * 1. Fetch top X published passages for a given apparatus/category.
 * 2. Verify no finals already exist for these groups on this apparatus.
 * 3. Create new passages with round='FINAL'.
 */
export default defineEventHandler(async (event) => {
  // 1. Validation
  const result = await useSafeValidatedBody(event, schema);
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid parameters', data: result.error });
  }
  
  const { 
    apparatusId, 
    category, 
    qualifiersCount, 
    startTime, 
    intervalMinutes, 
    location 
  } = result.data;

  try {
    // 2. Fetch Apparatus
    const apparatus = await ApparatusModel.findById(apparatusId);
    if (!apparatus) {
      throw createError({ statusCode: 404, statusMessage: 'Apparatus not found' });
    }

    // 2.5 Prevent Duplicate Finals Generation
    // Check if finals are already generated for this apparatus and category
    // In our model, category is on the group. So we need to look up finals for this apparatus
    // and check their group's category.
    const existingFinalsPipeline: any[] = [
      {
        $match: {
          apparatus: apparatus._id,
          round: 'FINAL'
        }
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'group',
          foreignField: '_id',
          as: 'groupInfo'
        }
      },
      { $unwind: '$groupInfo' }
    ];

    if (category) {
      existingFinalsPipeline.push({ $match: { 'groupInfo.category': category } });
    }

    const existingFinals = await PassageModel.aggregate(existingFinalsPipeline);

    if (existingFinals.length > 0) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: `Les finales pour cet engin${category ? ' et cette catégorie' : ''} ont déjà été générées.` 
      });
    }

    // 3. Find Top Qualifiers
    // We use aggregation to filter by category (which is on the Group model)
    const pipeline: any[] = [
      { 
        $match: { 
          apparatus: apparatus._id,
          round: 'QUALIFIER',
          isPublished: true,
          score: { $ne: null }
        } 
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'group',
          foreignField: '_id',
          as: 'groupInfo'
        }
      },
      { $unwind: '$groupInfo' }
    ];

    if (category) {
      pipeline.push({ $match: { 'groupInfo.category': category } });
    }

    pipeline.push(
      { $sort: { score: -1 } },
      { $limit: qualifiersCount }
    );

    const qualifiers = await PassageModel.aggregate(pipeline);

    if (qualifiers.length === 0) {
      return {
        success: false,
        message: 'No published qualifier results found for this criteria.'
      };
    }

    // 4. Generate Final Passages
    const finalPassages = [];
    let currentStartTime = new Date(startTime);

    // Traditionally, the 1st qualifier starts LAST in the finals.
    // Let's reverse the order (3rd, 2nd, then 1st).
    const reversedQualifiers = [...qualifiers].reverse();

    for (const q of reversedQualifiers) {
      const endTime = new Date(currentStartTime.getTime() + intervalMinutes * 60000);
      
      finalPassages.push({
        group: q.group,
        apparatus: apparatus._id,
        startTime: new Date(currentStartTime),
        endTime: new Date(endTime),
        location: location || q.location,
        round: 'FINAL',
        status: 'SCHEDULED',
        score: null,
        isPublished: false
      });

      // Increment for next passage
      currentStartTime = new Date(endTime.getTime());
    }

    // 5. Save to Database
    const inserted = await PassageModel.insertMany(finalPassages);

    // 6. Invalidate Nitro server-side cache
    try {
      const cacheStorage = useStorage('cache')
      const allCacheKeys = await cacheStorage.getKeys()
      if (allCacheKeys.length > 0) {
        await Promise.all(allCacheKeys.map(key => cacheStorage.removeItem(key)))
        console.log(`[admin:finals] Cleared ${allCacheKeys.length} Nitro cache entries`)
      }
    } catch (cacheErr) {
      console.warn('[admin:finals] Could not clear Nitro cache:', cacheErr)
    }

    return {
      success: true,
      message: `${inserted.length} final passages generated.`,
      data: inserted
    };

  } catch (error: any) {
    console.error('[admin:finals] Generation failed:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    });
  }
});
