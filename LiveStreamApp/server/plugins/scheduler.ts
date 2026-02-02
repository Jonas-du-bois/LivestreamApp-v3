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

      // A. Promote SCHEDULED -> LIVE (if startTime is reached/passed)
      // First get the passages that will be promoted so we can update streams
      const passagesToGoLive = await PassageModel.find({
        status: 'SCHEDULED',
        startTime: { $lte: now }
      });

      if (passagesToGoLive.length > 0) {
        // Update passages to LIVE
        await PassageModel.updateMany(
          { _id: { $in: passagesToGoLive.map(p => p._id) } },
          { $set: { status: 'LIVE' } }
        );
        console.log(`[Scheduler] Promoted ${passagesToGoLive.length} passages to LIVE`);
        scheduleChanged = true;

        // Update corresponding streams' currentPassage
        for (const passage of passagesToGoLive) {
          if (passage.location) {
            await StreamModel.findOneAndUpdate(
              { location: passage.location },
              { currentPassage: passage._id }
            );
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

        // Clear currentPassage on streams if no other LIVE passage exists for that location
        for (const passage of passagesToFinish) {
          if (passage.location) {
            // Check if there's another LIVE passage for this location
            const anotherLive = await PassageModel.findOne({
              location: passage.location,
              status: 'LIVE',
              _id: { $ne: passage._id }
            });
            
            if (!anotherLive) {
              // No other live passage, clear the currentPassage
              await StreamModel.findOneAndUpdate(
                { location: passage.location },
                { currentPassage: null }
              );
              console.log(`[Scheduler] Cleared currentPassage for location ${passage.location}`);
            }
          }
        }
      }

      // Emit event if schedule changed
      if (scheduleChanged) {
        const io = (globalThis as any).io;
        if (io) {
            io.to('schedule-updates').emit('schedule-update');
            io.to('streams').emit('stream-update');
            console.log('[Scheduler] Emitted schedule-update and stream-update to rooms');
        } else {
            console.warn('[Scheduler] Schedule changed but Socket.io not initialized yet');
        }
      }


      // --- 2. NOTIFICATIONS LOGIC (only if webPush is enabled) ---
      if (!webPushEnabled) return;
      
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

        // Find subscribers who favorited this SPECIFIC PASSAGE
        const subscriptions = await SubscriptionModel.find({
          favorites: passage._id.toString()
        });

        if (subscriptions.length === 0) continue;

        const payload = JSON.stringify({
          title: 'Passage imminent !',
          body: `${group.name} va passer au ${apparatus?.name || 'sol'} dans 15 minutes !`,
          icon: '/icons/logo_livestreamappv3-192.png',
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
