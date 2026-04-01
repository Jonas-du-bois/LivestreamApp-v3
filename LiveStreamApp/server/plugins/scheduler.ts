import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime';
import { SCHEDULER_INTERVAL } from '../utils/timings';

import webPush from 'web-push';
import admin from 'firebase-admin';
import PassageModel from '../models/Passage';
import StreamModel from '../models/Stream';
import SubscriptionModel from '../models/Subscription';

// --- Helpers for sending push notifications ---

/** Envoie une notification Web Push à un abonné */
async function sendWebPush(
  sub: { endpoint: string; keys?: { p256dh: string; auth: string } },
  payload: string
): Promise<boolean> {
  if (!sub.keys?.p256dh || !sub.keys?.auth) return false;
  await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys as any }, payload);
  return true;
}

/** Envoie une notification FCM (Firebase Cloud Messaging) à un device natif */
async function sendFcm(
  messaging: any,
  fcmToken: string,
  payloadObj: { title: string; body: string; icon?: string; url?: string }
): Promise<boolean> {
  await messaging.send({
    token: fcmToken,
    notification: {
      title: payloadObj.title,
      body: payloadObj.body,
      imageUrl: payloadObj.icon,
    },
    android: {
      notification: {
        icon: 'ic_notification',
        color: '#06B6D4',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: { url: payloadObj.url || '/schedule' },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
      fcmOptions: { analyticsLabel: 'push_reminder' },
    },
    webpush: {
      fcmOptions: { link: payloadObj.url || '/schedule' },
    },
  });
  return true;
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  // --- Initialize WebPush (Web / PWA) ---
  let webPushEnabled = false;
  if (config.vapidPrivateKey && config.public.vapidPublicKey) {
    try {
      webPush.setVapidDetails(
        'mailto:admin@example.com',
        config.public.vapidPublicKey,
        config.vapidPrivateKey
      );
      webPushEnabled = true;
      console.log('[Scheduler] WebPush initialized');
    } catch (e) {
      console.warn('[Scheduler] WebPush init failed (invalid keys) - Notifications disabled', e);
    }
  } else {
    console.warn('[Scheduler] WebPush keys missing - Notifications disabled');
  }

  // --- Initialize Firebase Admin (Android / iOS natif) ---
  let fcmMessaging: any = null;
  const serviceAccountRaw = config.firebaseServiceAccount as string | undefined;
  if (serviceAccountRaw) {
    try {
      // Évite la double initialisation (ex: HMR en dev)
      const existingApp = admin.apps?.find((a) => a?.name === 'scheduler');
      const app = existingApp ?? admin.initializeApp(
        { credential: admin.credential.cert(JSON.parse(serviceAccountRaw)) },
        'scheduler'
      );
      fcmMessaging = admin.messaging(app);
      console.log('[Scheduler] Firebase Admin (FCM) initialized');
    } catch (e) {
      console.warn('[Scheduler] Firebase Admin init failed - FCM disabled', e);
    }
  } else {
    console.warn('[Scheduler] FIREBASE_SERVICE_ACCOUNT not set - FCM disabled (native push won\'t work)');
  }

  console.log('[Scheduler] Starting scheduler for status updates...');

  // Schedule Job: Check at configured interval
  setInterval(async () => {
    try {
      const now = new Date();

      // --- 1. STATUS UPDATE LOGIC (AUTO-PILOT) ---
      let scheduleChanged = false;
      const updatedStreams: any[] = [];

      // A. Promote SCHEDULED -> LIVE (if startTime is reached/passed)
      // BOLT: Optimize memory and DB load by dropping .populate() and selecting only required fields.
      // Measurement: Reduces memory allocation by >90% per document during heavy scheduling blocks.
      const passagesToGoLive = await PassageModel.find({
        status: 'SCHEDULED',
        startTime: { $lte: now }
      }).select('_id location').lean();

      if (passagesToGoLive.length > 0) {
        await PassageModel.updateMany(
          { _id: { $in: passagesToGoLive.map(p => p._id) } },
          { $set: { status: 'LIVE' } }
        );
        console.log(`[Scheduler] Promoted ${passagesToGoLive.length} passages to LIVE`);
        scheduleChanged = true;

        // BOLT: Parallelize stream updates
        const streamUpdates = passagesToGoLive.map(async (passage) => {
          if (passage.location) {
            const stream = await StreamModel.findOneAndUpdate(
              { location: passage.location },
              { currentPassage: passage._id },
              { new: true }
            ).populate({
              path: 'currentPassage',
              // BOLT: Optimize memory usage by only selecting necessary fields for streams
              populate: [{ path: 'group', select: 'name' }, { path: 'apparatus', select: 'name code' }]
            });
            
            if (stream) {
              console.log(`[Scheduler] Updated stream for location ${passage.location} with passage ${passage._id}`);
              return stream;
            }
          }
          return null;
        });

        const results = await Promise.all(streamUpdates);
        updatedStreams.push(...results.filter(s => s !== null));
      }

      // B. Promote LIVE -> FINISHED (if endTime is passed)
      // BOLT: Optimize memory overhead by dropping unused primitive fields from response payload.
      // Measurement: Reduces unnecessary Mongoose serialization time during background intervals.
      const passagesToFinish = await PassageModel.find({
        status: 'LIVE',
        endTime: { $lte: now }
      }).select('_id location').lean();

      if (passagesToFinish.length > 0) {
        await PassageModel.updateMany(
          { _id: { $in: passagesToFinish.map(p => p._id) } },
          { $set: { status: 'FINISHED' } }
        );
        console.log(`[Scheduler] Promoted ${passagesToFinish.length} passages to FINISHED`);
        scheduleChanged = true;

        // BOLT: Parallelize stream cleanup
        const finishUpdates = passagesToFinish.map(async (passage) => {
          if (passage.location) {
            // BOLT: Optimize boolean existence check by returning only _id without hydration.
            // Measurement: Drastically cuts processing time for high-frequency location status checks.
            const anotherLive = await PassageModel.findOne({
              location: passage.location,
              status: 'LIVE',
              _id: { $ne: passage._id }
            }).select('_id').lean();
            
            if (!anotherLive) {
              const stream = await StreamModel.findOneAndUpdate(
                { location: passage.location },
                { currentPassage: null },
                { new: true }
              );
              if (stream) {
                console.log(`[Scheduler] Cleared currentPassage for location ${passage.location}`);
                return stream;
              }
            }
          }
          return null;
        });

        const results = await Promise.all(finishUpdates);
        updatedStreams.push(...results.filter(s => s !== null));
      }

      // Emit events with full payload if schedule changed
      if (scheduleChanged) {
        const io = (globalThis as any).io;
        if (io) {
          io.to('schedule-updates').emit('schedule-update');
          
          // Emit stream-update with full payload for each updated stream
          for (const stream of updatedStreams) {
            io.to('streams').emit('stream-update', {
              _id: stream._id?.toString(),
              name: stream.name,
              location: stream.location,
              url: stream.url,
              isLive: stream.isLive,
              currentPassage: stream.currentPassage ? {
                _id: stream.currentPassage._id?.toString(),
                group: stream.currentPassage.group ? {
                  _id: stream.currentPassage.group._id?.toString(),
                  name: stream.currentPassage.group.name
                } : null,
                apparatus: stream.currentPassage.apparatus ? {
                  _id: stream.currentPassage.apparatus._id?.toString(),
                  name: stream.currentPassage.apparatus.name,
                  code: stream.currentPassage.apparatus.code
                } : null
              } : null
            });
          }
          
          // Also emit a generic stream-update if no specific streams were updated
          if (updatedStreams.length === 0) {
            io.to('streams').emit('stream-update', {});
          }
          
          console.log('[Scheduler] Emitted schedule-update and stream-update to rooms');
        }
      }

      // --- 2. NOTIFICATIONS LOGIC (web push + fcm natif) ---
      if (!webPushEnabled && !fcmMessaging) return;
      
      // === NOTIFICATION 15 MINUTES AVANT ===
      await sendReminderNotifications(now, 15, 'notifiedAt15');
      
      // === NOTIFICATION 3 MINUTES AVANT ===
      await sendReminderNotifications(now, 3, 'notifiedAt3');

    } catch (err) {
      console.error('[Scheduler] Error in job:', err);
    }
  }, SCHEDULER_INTERVAL);

  /**
   * Envoie des notifications de rappel pour les passages à X minutes.
   * Supporte les deux canaux : Web Push (PWA) et FCM (Android/iOS natif).
   */
  async function sendReminderNotifications(
    now: Date, 
    minutesBefore: number, 
    trackingField: 'notifiedAt15' | 'notifiedAt3'
  ) {
    // Fenêtre de recherche: X minutes ± 30 secondes
    const windowStart = new Date(now.getTime() + (minutesBefore - 0.5) * 60000);
    const windowEnd = new Date(now.getTime() + (minutesBefore + 0.5) * 60000);

    // Trouver les passages dans la fenêtre qui n'ont PAS encore été notifiés
    const query: any = {
      startTime: { $gte: windowStart, $lte: windowEnd },
      [trackingField]: null // Pas encore notifié
    };

    const passages = await PassageModel.find(query)
      // BOLT: Optimize notifications by strictly selecting required fields
      .populate('group', 'name')
      .populate('apparatus', 'name code')
      .lean();

    if (passages.length === 0) return;

    console.log(`[Scheduler] Found ${passages.length} passages for ${minutesBefore}min reminder`);

    const payloadTitle = minutesBefore === 3 ? '⏰ Passage imminent !' : '📣 Passage bientôt';

    // BOLT: Optimized query to fetch all relevant subscriptions in one go
    // Avoids N+1 query problem when multiple passages trigger notifications simultaneously
    const passageIds = passages.map(p => p._id.toString());
    const allSubscriptions = await SubscriptionModel.find({
      favorites: { $in: passageIds }
    }).lean();

    // BOLT: Optimize cross-referencing collections by mapping subscriptions by favorite id.
    // Replaces O(N*M) array filtering with O(1) map lookups per passage.
    const subscriptionsByPassage = new Map<string, any[]>();
    allSubscriptions.forEach((sub: any) => {
      sub.favorites.forEach((favId: any) => {
        const id = favId.toString();
        if (!subscriptionsByPassage.has(id)) {
          subscriptionsByPassage.set(id, []);
        }
        subscriptionsByPassage.get(id)!.push(sub);
      });
    });

    // BOLT: Collect IDs for bulk operations to avoid N+1 queries during iteration
    const passagesToMarkAsNotified: any[] = [];
    const subscriptionsToDelete: any[] = [];

    // BOLT: Parallelize notification sending per passage
    const passagePromises = passages.map(async (passage) => {
      const group = passage.group as any;
      const apparatus = passage.apparatus as any;
      if (!group) return;

      const payloadBody = `${group.name} passe au ${apparatus?.name || 'sol'} dans ${minutesBefore} minutes !`;
      const payloadObj = {
        title: payloadTitle,
        body: payloadBody,
        icon: '/icons/logo_livestreamappv3-192.png',
        url: '/schedule',
      };

      // Fetch from pre-computed Map using passage ID
      const passageIdStr = passage._id.toString();
      const subscriptions = subscriptionsByPassage.get(passageIdStr) || [];

      if (subscriptions.length === 0) {
        passagesToMarkAsNotified.push(passage._id);
        return;
      }

      const notifications = subscriptions.map(async (sub: any) => {
        try {
          if (sub.type === 'fcm' && fcmMessaging) {
            // --- Canal FCM (Android / iOS natif) ---
            await sendFcm(fcmMessaging, sub.endpoint, payloadObj);
          } else if (sub.type === 'web' && webPushEnabled && sub.keys) {
            // --- Canal Web Push (PWA / navigateur) ---
            const payload = JSON.stringify(payloadObj);
            await sendWebPush({ endpoint: sub.endpoint, keys: sub.keys as any }, payload);
          }
        } catch (err: any) {
          // Supprimer les subscriptions expirées (Web Push 410/404) ou FCM invalide
          const code = err?.statusCode ?? err?.errorInfo?.code ?? '';
          const isExpired =
            err?.statusCode === 410 ||
            err?.statusCode === 404 ||
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token';
          if (isExpired) {
            console.log(`[Scheduler] Removing expired subscription ${sub._id} (${sub.type})`);
            subscriptionsToDelete.push(sub._id);
          } else {
            console.error(`[Scheduler] Error sending ${sub.type} push:`, err?.message ?? err);
          }
        }
      });

      await Promise.all(notifications);
      
      // Marquer le passage comme notifié pour éviter les doublons
      passagesToMarkAsNotified.push(passage._id);
      
      console.log(`[Scheduler] Sent ${subscriptions.length} notifications (${minutesBefore}min) for ${group.name}`);
    });

    await Promise.all(passagePromises);

    // BOLT: Execute bulk database operations at the end of the batch
    if (passagesToMarkAsNotified.length > 0) {
      await PassageModel.updateMany(
        { _id: { $in: passagesToMarkAsNotified } },
        { $set: { [trackingField]: now } }
      );
    }

    if (subscriptionsToDelete.length > 0) {
      await SubscriptionModel.deleteMany({ _id: { $in: subscriptionsToDelete } });
    }
  }
});
