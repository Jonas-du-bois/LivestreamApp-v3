import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';
import PassageModel from '../models/Passage';
import StreamModel from '../models/Stream';
import SubscriptionModel from '../models/Subscription';
import { Types } from 'mongoose';

export default defineEventHandler(async (event) => {
  try {
    console.log('[seed] Starting DB seed — clearing collections...');

    await Promise.all([
      ApparatusModel.deleteMany({}),
      GroupModel.deleteMany({}),
      PassageModel.deleteMany({}),
      StreamModel.deleteMany({}),
      SubscriptionModel.deleteMany({}),
    ]);

    console.log('[seed] Collections cleared');

    // 1. APPARATUS
    const apparatusList = [
      { code: 'SS', name: 'Sol', icon: 'fluent:grid-dots-24-regular' },
      { code: 'BA', name: 'Barres Parallèles', icon: 'fluent:table-simple-24-regular' },
      { code: 'AB', name: 'Anneaux Balançants', icon: 'fluent:circle-24-regular' },
      { code: 'SA', name: 'Saut', icon: 'fluent:arrow-up-24-regular' },
      { code: 'RE', name: 'Reck', icon: 'fluent:arrow-rotate-clockwise-24-regular' },
    ];

    const insertedApparatus = await ApparatusModel.insertMany(apparatusList);
    // Helper to get ID safely
    const getAppId = (code: string) => {
      const app = insertedApparatus.find((a: any) => a.code === code);
      return (app as any)._id as Types.ObjectId;
    };

    console.log(`[seed] Created ${insertedApparatus.length} Apparatus`);

    // 2. GROUPS
    const groupNames = [
      'FSG Yverdon Amis-Gym', 'TV Wetzikon', 'FSG Aigle-Alliance', 'FSG Morges',
      'BTV Luzern', 'STV Wangen', 'TV Mels', 'FSG Lausanne-Ville',
      'FSG Genève', 'TV Schaffhausen', 'FSG Neuchâtel', 'FSG Fribourg',
      'TV Bern', 'FSG Sion', 'FSG Vevey Jeunes-Patriotes'
    ];

    const groupsData = groupNames.map(name => ({
      name,
      canton: 'CH',
      gymnastsCount: 20 + Math.floor(Math.random() * 30),
    }));

    const insertedGroups = await GroupModel.insertMany(groupsData);
    const getGroup = (index: number) => (insertedGroups[index % insertedGroups.length] as any);

    console.log(`[seed] Created ${insertedGroups.length} Groups`);

    // 3. TIMELINE & PASSAGES
    const passagesData: any[] = [];
    const now = new Date();

    // Helper dates
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(8, 0, 0, 0);

    const todayStart = new Date(now);
    todayStart.setHours(8, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const generateScore = () => {
      const p = 4.5 + Math.random() * 0.5; // 4.5 - 5.0
      const t = 4.5 + Math.random() * 0.5; // 4.5 - 5.0
      return {
        program: parseFloat(p.toFixed(2)),
        technical: parseFloat(t.toFixed(2)),
        total: parseFloat((p + t).toFixed(2)),
        isPublished: true
      };
    };

    const monitorNames = [
      'Jean Dupont', 'Marie Curie', 'Paul Scherrer', 'Albert Einstein',
      'Sarah Connor', 'Ellen Ripley', 'John Wick', 'James Bond',
      'Lara Croft', 'Indiana Jones', 'Han Solo', 'Leia Organa'
    ];

    const generateMonitors = () => {
      // Pick 1-3 random monitors
      const count = 1 + Math.floor(Math.random() * 3);
      const selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(monitorNames[Math.floor(Math.random() * monitorNames.length)]);
      }
      return [...new Set(selected)]; // Unique
    };

    let passageCounter = 0;
    const appCodes = ['SS', 'BA', 'AB', 'SA', 'RE'];

    // A. YESTERDAY (20 Finished)
    for (let i = 0; i < 20; i++) {
      const startTime = new Date(yesterday.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroup(passageCounter++)._id),
        apparatus: String(getAppId(appCodes[i % 5]!)), // Non-null assertion
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? 'Salle Omnisport 1' : 'Salle 2',
        status: 'FINISHED',
        scores: generateScore(),
        monitors: generateMonitors()
      });
    }

    // B. TODAY AM (10 Finished)
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(todayStart.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroup(passageCounter++)._id),
        apparatus: String(getAppId(appCodes[i % 5]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? 'Salle Omnisport 1' : 'Salle 2',
        status: 'FINISHED',
        scores: generateScore(),
        monitors: generateMonitors()
      });
    }

    // C. TODAY NOW (2 LIVE)
    const liveStartTime = new Date(now.getTime() - 5 * 60000);

    const live1 = {
      group: String(getGroup(passageCounter++)._id),
      apparatus: String(getAppId('SS')),
      startTime: liveStartTime,
      endTime: new Date(liveStartTime.getTime() + 15 * 60000),
      location: 'Salle Omnisport 1',
      status: 'LIVE',
      scores: {},
      monitors: generateMonitors()
    };
    passagesData.push(live1);

    const live2 = {
      group: String(getGroup(passageCounter++)._id),
      apparatus: String(getAppId('AB')),
      startTime: liveStartTime,
      endTime: new Date(liveStartTime.getTime() + 15 * 60000),
      location: 'Salle 2',
      status: 'LIVE',
      scores: {},
      monitors: generateMonitors()
    };
    passagesData.push(live2);


    // D. TODAY PM (10 Scheduled)
    const todayPMStart = new Date(now.getTime() + 30 * 60000);
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(todayPMStart.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroup(passageCounter++)._id),
        apparatus: String(getAppId(appCodes[i % 5]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? 'Salle Omnisport 1' : 'Salle 2',
        status: 'SCHEDULED',
        scores: {},
        monitors: generateMonitors()
      });
    }

    // E. TOMORROW (15 Scheduled)
    for (let i = 0; i < 15; i++) {
      const startTime = new Date(tomorrow.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroup(passageCounter++)._id),
        apparatus: String(getAppId(appCodes[i % 5]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? 'Salle Omnisport 1' : 'Salle 2',
        status: 'SCHEDULED',
        scores: {},
        monitors: generateMonitors()
      });
    }

    // F. DEMO FINISHED (5 Forced)
    for (let i = 0; i < 5; i++) {
        passagesData.push({
            group: String(getGroup(passageCounter++)._id),
            apparatus: String(getAppId(appCodes[i % 5]!)),
            startTime: new Date(now.getTime() - 60 * 60000), // 1 hour ago
            endTime: new Date(now.getTime() - 50 * 60000),
            location: 'Salle Omnisport 1',
            status: 'FINISHED',
            scores: generateScore(),
            monitors: generateMonitors()
        });
    }

    const insertedPassages = await PassageModel.insertMany(passagesData);
    console.log(`[seed] Created ${insertedPassages.length} Passages`);

    // 4. STREAMS
    // Safe fetching of live passages
    const livePassages = await PassageModel.find({ status: 'LIVE' });

    const streamsData = [];
    if (livePassages.length > 0 && livePassages[0]) {
        streamsData.push({
            name: 'Salle Omnisport 1 - Caméra Principale',
            type: 'EMBED',
            url: 'https://www.youtube.com/embed/jfKfPfyJRdk',
            location: 'Salle Omnisport 1',
            isLive: true,
            currentPassage: String(livePassages[0]._id)
        });
    }

    if (livePassages.length > 1 && livePassages[1]) {
        streamsData.push({
            name: 'Salle 2 - Vue Gymnastes',
            type: 'LINK',
            url: 'https://twitch.tv/swissgymnastics',
            location: 'Salle 2',
            isLive: true,
            currentPassage: String(livePassages[1]._id)
        });
    }

    const insertedStreams = await StreamModel.insertMany(streamsData);
    console.log(`[seed] Created ${insertedStreams.length} Streams`);

    return {
      success: true,
      summary: {
        apparatus: insertedApparatus.length,
        groups: insertedGroups.length,
        passages: insertedPassages.length,
        streams: insertedStreams.length
      }
    };

  } catch (err: any) {
    console.error('[seed] Error:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Seeding failed'
    });
  }
});
