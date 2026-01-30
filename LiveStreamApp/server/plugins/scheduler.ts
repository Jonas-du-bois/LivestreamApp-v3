import webPush from 'web-push';
import PassageModel from '../models/Passage';
import SubscriptionModel from '../models/Subscription';

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();

  // Initialize WebPush
  if (config.vapidPrivateKey && config.public.vapidPublicKey) {
    try {
      webPush.setVapidDetails(
        'mailto:admin@example.com',
        config.public.vapidPublicKey,
        config.vapidPrivateKey
      );
      console.log('[Scheduler] WebPush initialized');
    } catch (e) {
      console.warn('[Scheduler] WebPush init failed (invalid keys) - Notifications disabled', e);
      return;
    }
  } else {
    console.warn('[Scheduler] WebPush keys missing - Notifications disabled');
    return;
  }

  // Schedule Job: Check every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date();

      // --- 1. STATUS UPDATE LOGIC (AUTO-PILOT) ---
      let scheduleChanged = false;

      // A. Promote SCHEDULED -> LIVE (if startTime is reached/passed)
      const toLive = await PassageModel.find({
        status: 'SCHEDULED',
        startTime: { $lte: now }
      });

      if (toLive.length > 0) {
        await PassageModel.updateMany(
          { _id: { $in: toLive.map(p => p._id) } },
          { $set: { status: 'LIVE' } }
        );
        console.log(`[Scheduler] Promoted ${toLive.length} passages to LIVE`);
        scheduleChanged = true;
      }

      // B. Promote LIVE -> FINISHED (if endTime is passed)
      const toFinished = await PassageModel.find({
        status: 'LIVE',
        endTime: { $lte: now }
      });

      if (toFinished.length > 0) {
        await PassageModel.updateMany(
          { _id: { $in: toFinished.map(p => p._id) } },
          { $set: { status: 'FINISHED' } }
        );
        console.log(`[Scheduler] Promoted ${toFinished.length} passages to FINISHED`);
        scheduleChanged = true;
      }

      // Emit event if schedule changed
      if (scheduleChanged) {
        const io = (globalThis as any).io;
        if (io) {
            io.emit('schedule-update');
            console.log('[Scheduler] Emitted schedule-update');
        }
      }


      // --- 2. NOTIFICATIONS LOGIC ---
      // Look for passages starting in ~15 minutes (between 14.5 and 15.5 mins from now)
      const startWindow = new Date(now.getTime() + 14.5 * 60000);
      const endWindow = new Date(now.getTime() + 15.5 * 60000);

      const passages = await PassageModel.find({
        startTime: { $gte: startWindow, $lte: endWindow }
      }).populate('group').populate('apparatus');

      if (passages.length === 0) return;

      console.log(`[Scheduler] Found ${passages.length} passages starting soon.`);

      for (const passage of passages) {
        const group = passage.group as any;
        const apparatus = passage.apparatus as any;
        if (!group) continue;

        // Find subscribers who favorited this group
        const subscriptions = await SubscriptionModel.find({
          favorites: group._id.toString()
        });

        if (subscriptions.length === 0) continue;

        const payload = JSON.stringify({
          title: 'Passage imminent !',
          body: `${group.name} va passer au ${apparatus?.name || 'sol'} dans 15 minutes !`,
          icon: '/icons/icon-192x192.png',
          url: '/schedule'
        });

        const notifications = subscriptions.map(sub => {
          // webPush.sendNotification expects { endpoint, keys: { p256dh, auth } }
          // sub.keys in DB matches this structure
          return webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
            .catch(err => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription expired
                console.log(`[Scheduler] Removing expired subscription ${sub._id}`);
                return SubscriptionModel.findByIdAndDelete(sub._id);
              }
              console.error('[Scheduler] Error sending push:', err);
            });
        });

        await Promise.all(notifications);
        console.log(`[Scheduler] Sent ${subscriptions.length} notifications for ${group.name}`);
      }

    } catch (err) {
      console.error('[Scheduler] Error in job:', err);
    }
  }, 30000); // Check every 30s for better precision
});
