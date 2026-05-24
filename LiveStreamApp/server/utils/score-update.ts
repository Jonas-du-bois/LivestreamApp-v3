import { Server as IOServer } from 'socket.io';
import PassageModel from '../models/Passage';
import SubscriptionModel from '../models/Subscription';
import webPush from 'web-push';

type PopulatedPassage = any;

interface UpdateScoreOptions {
  passageId: string;
  score: number;
  io?: IOServer;
  invalidateCache?: boolean;
  source?: string;
}

export interface UpdateScoreResult {
  changed: boolean;
  payload: Record<string, any> | null;
}

const buildRankPipeline = (updated: PopulatedPassage, groupCategory: string) => ([
  {
    $match: {
      isPublished: true,
      apparatus: updated.apparatus._id,
      round: updated.round
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
  { $unwind: '$groupInfo' },
  {
    $addFields: {
      effectiveCategory: { $ifNull: ['$groupInfo.subCategory', '$groupInfo.category'] }
    }
  },
  {
    $match: {
      effectiveCategory: groupCategory
    }
  },
  { $sort: { score: -1 } },
  { $project: { _id: 1 } }
]);

const buildScorePayload = (updated: PopulatedPassage, rank: number) => ({
  passageId: updated._id.toString(),
  score: updated.score,
  rank,
  status: updated.status,
  round: updated.round,
  group: updated.group,
  apparatus: updated.apparatus,
  startTime: updated.startTime,
  endTime: updated.endTime,
  location: updated.location,
  groupName: (updated.group as any)?.name,
  apparatusCode: (updated.apparatus as any)?.code,
  apparatusName: (updated.apparatus as any)?.name
});

const getIoInstance = (io?: IOServer) => io || ((globalThis as any).io as IOServer | undefined);

const sendFavoriteScorePushNotifications = async (updated: PopulatedPassage, rank: number) => {
  const config = useRuntimeConfig();
  if (!config.vapidPrivateKey || !config.public.vapidPublicKey) return;

  const subscriptions = await SubscriptionModel.find({
    favorites: updated._id.toString()
  });
  if (subscriptions.length === 0) return;

  const groupName = (updated.group as any)?.name || 'Groupe';
  const apparatusName = (updated.apparatus as any)?.name || '';

  const pushPayload = JSON.stringify({
    title: '🎯 Résultat disponible !',
    body: `${groupName} - ${apparatusName}: ${updated.score?.toFixed(2)} pts (${rank}${rank === 1 ? 'er' : 'ème'})`,
    icon: '/icons/logo_livestreamappv3-192.png',
    url: '/results'
  });

  const notifications = subscriptions.map((sub) =>
    webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, pushPayload).catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        return SubscriptionModel.findByIdAndDelete(sub._id);
      }
      console.error('[score] Error sending push:', err);
      return null;
    })
  );

  Promise.all(notifications).catch((err) => {
    console.error('[score] Push background error:', err);
  });
};

export const invalidateServerCache = async (scope = 'score-update') => {
  try {
    const cacheStorage = useStorage('cache');
    const allCacheKeys = await cacheStorage.getKeys();
    if (allCacheKeys.length > 0) {
      await Promise.all(allCacheKeys.map((key) => cacheStorage.removeItem(key)));
      console.log(`[${scope}] Cleared ${allCacheKeys.length} Nitro cache entries`);
    }
  } catch (cacheErr) {
    console.warn(`[${scope}] Could not clear Nitro cache:`, cacheErr);
  }
};

export const updatePassageScore = async ({
  passageId,
  score,
  io,
  invalidateCache = true,
  source = 'score'
}: UpdateScoreOptions): Promise<UpdateScoreResult> => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 10) {
    throw createError({ statusCode: 400, statusMessage: 'Score must be between 0 and 10' });
  }

  const existing = await PassageModel.findById(passageId)
    .select('score isPublished')
    .lean();
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Passage not found' });
  }

  const hasSameScore = typeof existing.score === 'number' && existing.score === numericScore;
  if (hasSameScore && existing.isPublished) {
    return { changed: false, payload: null };
  }

  const updated = await PassageModel.findByIdAndUpdate(
    passageId,
    {
      $set: {
        score: numericScore,
        isPublished: true
      }
    },
    { new: true }
  )
    // BOLT: Optimize Mongoose populate projections to prevent fetching large unused arrays like 'history'
    .populate('group', 'name category subCategory canton logo')
    .populate('apparatus', 'name code icon')
    .exec();

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Passage not found' });
  }

  const groupData = updated.group as any;
  const groupCategory = groupData?.subCategory || groupData?.category || 'Sans catégorie';
  const finished = await PassageModel.aggregate(buildRankPipeline(updated, groupCategory));
  const rank = finished.findIndex((f: any) => f._id.toString() === updated._id.toString()) + 1;

  const payload = buildScorePayload(updated, rank);
  const ioInstance = getIoInstance(io);
  if (ioInstance) {
    ioInstance.to('live-scores').emit('score-update', payload);
  } else {
    console.warn(`[${source}] io instance not found, skipping score-update emit`);
  }

  try {
    await sendFavoriteScorePushNotifications(updated, rank);
  } catch (pushErr) {
    console.error(`[${source}] Push notification error (non-blocking):`, pushErr);
  }

  if (invalidateCache) {
    await invalidateServerCache(source);
  }

  return { changed: true, payload };
};
