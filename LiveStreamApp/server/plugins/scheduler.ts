import webPush from 'web-push';
import PassageModel from '../models/Passage';
import StreamModel from '../models/Stream';
import SubscriptionModel from '../models/Subscription';

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  // Initialize WebPush (optional - notifications will be disabled if keys are missing)
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

  console.log('[Scheduler] Starting scheduler for status updates...');

  // Schedule Job: Check every 30 seconds
  setInterval(async () => {
    try {
      const now = new Date();

      // --- 1. STATUS UPDATE LOGIC (AUTO-PILOT) ---
      let scheduleChanged = false;
      const updatedStreams: any[] = [];

      // A. Promote SCHEDULED -> LIVE (if startTime is reached/passed)
      const passagesToGoLive = await PassageModel.find({
        status: 'SCHEDULED',
        startTime: { $lte: now }
      }).populate('group').populate('apparatus');

      if (passagesToGoLive.length > 0) {
        await PassageModel.updateMany(
          { _id: { $in: passagesToGoLive.map(p => p._id) } },
          { $set: { status: 'LIVE' } }
        );
        console.log(`[Scheduler] Promoted ${passagesToGoLive.length} passages to LIVE`);
        scheduleChanged = true;

        // Update corresponding streams' currentPassage
        for (const passage of passagesToGoLive) {
          if (passage.location) {
            const stream = await StreamModel.findOneAndUpdate(
              { location: passage.location },
              { currentPassage: passage._id },
              { new: true }
            ).populate({
              path: 'currentPassage',
              populate: [{ path: 'group' }, { path: 'apparatus' }]
            });
            
            if (stream) {
              updatedStreams.push(stream);
            }
            console.log(`[Scheduler] Updated stream for location ${passage.location} with passage ${passage._id}`);
          }
        }
      }

      // B. Promote LIVE -> FINISHED (if endTime is passed)
      const passagesToFinish = await PassageModel.find({
        status: 'LIVE',
        endTime: { $lte: now }
      });

      if (passagesToFinish.length > 0) {
        await PassageModel.updateMany(
          { _id: { $in: passagesToFinish.map(p => p._id) } },
          { $set: { status: 'FINISHED' } }
        );
        console.log(`[Scheduler] Promoted ${passagesToFinish.length} passages to FINISHED`);
        scheduleChanged = true;

        for (const passage of passagesToFinish) {
          if (passage.location) {
            const anotherLive = await PassageModel.findOne({
              location: passage.location,
              status: 'LIVE',
              _id: { $ne: passage._id }
            });
            
            if (!anotherLive) {
              const stream = await StreamModel.findOneAndUpdate(
                { location: passage.location },
                { currentPassage: null },
                { new: true }
              );
              if (stream) {
                updatedStreams.push(stream);
              }
              console.log(`[Scheduler] Cleared currentPassage for location ${passage.location}`);
            }
          }
        }
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

      // --- 2. NOTIFICATIONS LOGIC (only if webPush is enabled) ---
      if (!webPushEnabled) return;
      
      // === NOTIFICATION 15 MINUTES AVANT ===
      await sendReminderNotifications(now, 15, 'notifiedAt15');
      
      // === NOTIFICATION 3 MINUTES AVANT ===
      await sendReminderNotifications(now, 3, 'notifiedAt3');

    } catch (err) {
      console.error('[Scheduler] Error in job:', err);
    }
  }, 30000); // Check every 30s

  /**
   * Envoie des notifications de rappel pour les passages à X minutes
   * Utilise un champ de tracking pour éviter les doublons
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
      .populate('group')
      .populate('apparatus');

    if (passages.length === 0) return;

    console.log(`[Scheduler] Found ${passages.length} passages for ${minutesBefore}min reminder`);

    for (const passage of passages) {
      const group = passage.group as any;
      const apparatus = passage.apparatus as any;
      if (!group) continue;

      // Trouver les abonnés qui ont ce passage en favoris
      const subscriptions = await SubscriptionModel.find({
        favorites: passage._id.toString()
      });

      if (subscriptions.length === 0) {
        // Même sans abonnés, marquer comme notifié pour éviter de le retraiter
        await PassageModel.findByIdAndUpdate(passage._id, {
          $set: { [trackingField]: now }
        });
        continue;
      }

      const payload = JSON.stringify({
        title: minutesBefore === 3 ? '⏰ Passage imminent !' : '📣 Passage bientôt',
        body: `${group.name} passe au ${apparatus?.name || 'sol'} dans ${minutesBefore} minutes !`,
        icon: '/icons/logo_livestreamappv3-192.png',
        url: '/schedule'
      });

      const notifications = subscriptions.map(sub => {
        return webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          .catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log(`[Scheduler] Removing expired subscription ${sub._id}`);
              return SubscriptionModel.findByIdAndDelete(sub._id);
            }
            console.error('[Scheduler] Error sending push:', err);
          });
      });

      await Promise.all(notifications);
      
      // Marquer le passage comme notifié pour éviter les doublons
      await PassageModel.findByIdAndUpdate(passage._id, {
        $set: { [trackingField]: now }
      });
      
      console.log(`[Scheduler] Sent ${subscriptions.length} notifications (${minutesBefore}min) for ${group.name}`);
    }
  }
});
