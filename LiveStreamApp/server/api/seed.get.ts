import ApparatusModel from '../models/Apparatus';
import GroupModel from '../models/Group';
import PassageModel from '../models/Passage';
import StreamModel from '../models/Stream';
import { Types } from 'mongoose';

export default defineEventHandler(async (event) => {
  try {
    console.log('[seed] Starting DB seed — clearing collections...');

    await Promise.all([
      ApparatusModel.deleteMany({}),
      GroupModel.deleteMany({}),
      PassageModel.deleteMany({}),
      StreamModel.deleteMany({}),
    ]);

    console.log('[seed] Collections cleared');

    // 1. APPARATUS REFERENCE
    const apparatusData = [
      { code: 'AG', name: 'Agrès de Société', icon: 'fluent:box-24-regular', isActive: true },
      { code: 'BA', name: 'Barres Parallèles', icon: 'fluent:table-simple-24-regular', isActive: true },
      { code: 'SS', name: 'Sol', icon: 'fluent:grid-dots-24-regular', isActive: true },
      { code: 'AB', name: 'Anneaux Balançants', icon: 'fluent:circle-24-regular', isActive: true },
      { code: 'SA', name: 'Saut', icon: 'fluent:arrow-up-24-regular', isActive: true },
      { code: 'SSB', name: 'Barres Asymétriques Scolaires', icon: 'fluent:align-space-even-vertical-20-regular', isActive: true },
      { code: 'CE', name: 'Combinaison d\'Engins', icon: 'fluent:stack-24-regular', isActive: true },
      { code: 'GYM', name: 'Gymnastique', icon: 'fluent:people-community-24-regular', isActive: true },
    ];

    const apparatusInserted = await ApparatusModel.insertMany(apparatusData);
    console.log(`🌱 Seed: Created ${apparatusInserted.length} Apparatus`);

    const getAppId = (code: string) => {
      const app = apparatusInserted.find((a: any) => a.code === code);
      if (!app) throw new Error(`Apparatus ${code} not found`);
      return app._id;
    };

    // 2. SOCIETIES (Groups)
    const groupsData = [
      {
        name: 'TV Wetzikon',
        canton: 'ZH',
        gymnastsCount: 35,
        history: [{ year: 2024, competition: 'CSS', apparatusCode: 'BA', score: 9.85 }]
      },
      {
        name: 'FSG Aigle-Alliance',
        canton: 'VD',
        gymnastsCount: 28,
        history: [{ year: 2024, competition: 'CSS', apparatusCode: 'SS', score: 9.78 }]
      },
      {
        name: 'BTV Luzern',
        canton: 'LU',
        gymnastsCount: 42,
        history: [{ year: 2024, competition: 'CSS', apparatusCode: 'SA', score: 9.80 }]
      },
      {
        name: 'FSG Yverdon Amis-Gym',
        canton: 'VD',
        gymnastsCount: 30,
        history: [{ year: 2024, competition: 'Coupe des Bains', apparatusCode: 'SS', score: 9.55 }]
      },
      {
        name: 'STV Wangen',
        canton: 'SZ',
        gymnastsCount: 38,
        history: [{ year: 2024, competition: 'CSS', apparatusCode: 'BA', score: 9.90 }]
      },
      {
        name: 'FSG Morges',
        canton: 'VD',
        gymnastsCount: 25,
        history: [{ year: 2024, competition: 'Coupe des Bains', apparatusCode: 'AB', score: 9.45 }]
      },
      {
        name: 'TV Mels',
        canton: 'SG',
        gymnastsCount: 40,
        history: [{ year: 2024, competition: 'CSS', apparatusCode: 'SS', score: 9.92 }]
      },
    ];

    const groupsInserted = await GroupModel.insertMany(groupsData);
    console.log(`🌱 Seed: Created ${groupsInserted.length} Groups`);

    const getGroup = (namePart: string) => {
      const group = groupsInserted.find((g: any) => g.name.includes(namePart));
      if (!group) throw new Error(`Group matching ${namePart} not found`);
      return group;
    };

    // 3. SCHEDULE LOGIC
    const now = new Date();
    const passagesData: any[] = [];

    // --- Morning Block (Finished) ---
    // 08:00 - 12:00 (Assuming now is afternoon for simulation, or we just set specific times relative to now to ensure they are "past")
    // To ensure "Finished", we set end time in the past.
    // Let's assume the competition started at 08:00.
    // If "Today" is the context, we just put them earlier today.

    // We'll place them 4-5 hours ago to ensure they are finished.
    const morningBase = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // 1. TV Mels @ Sol (Winner)
    passagesData.push({
      group: getGroup('TV Mels')._id,
      apparatus: getAppId('SS'),
      startTime: new Date(morningBase.getTime()),
      endTime: new Date(morningBase.getTime() + 10 * 60000),
      location: 'Salle Omnisport 1',
      status: 'FINISHED',
      scores: { program: 5.0, technical: 4.93, total: 9.93, isPublished: true }
    });

    // 2. BTV Luzern @ Saut (Runner-up)
    passagesData.push({
      group: getGroup('BTV Luzern')._id,
      apparatus: getAppId('SA'),
      startTime: new Date(morningBase.getTime() + 15 * 60000),
      endTime: new Date(morningBase.getTime() + 25 * 60000),
      location: 'Salle Omnisport 1',
      status: 'FINISHED',
      scores: { program: 4.9, technical: 4.85, total: 9.75, isPublished: true }
    });

    // 3. FSG Morges @ Anneaux
    passagesData.push({
      group: getGroup('FSG Morges')._id,
      apparatus: getAppId('AB'),
      startTime: new Date(morningBase.getTime() + 30 * 60000),
      endTime: new Date(morningBase.getTime() + 40 * 60000),
      location: 'Salle 2',
      status: 'FINISHED',
      scores: { program: 4.7, technical: 4.75, total: 9.45, isPublished: true }
    });

    // 4. STV Wangen @ Barres
    passagesData.push({
      group: getGroup('STV Wangen')._id,
      apparatus: getAppId('BA'),
      startTime: new Date(morningBase.getTime() + 45 * 60000),
      endTime: new Date(morningBase.getTime() + 55 * 60000),
      location: 'Salle Omnisport 1',
      status: 'FINISHED',
      scores: { program: 4.9, technical: 4.9, total: 9.80, isPublished: true }
    });

    // 5. FSG Aigle-Alliance @ Sol
    passagesData.push({
      group: getGroup('Aigle')._id,
      apparatus: getAppId('SS'),
      startTime: new Date(morningBase.getTime() + 60 * 60000),
      endTime: new Date(morningBase.getTime() + 70 * 60000),
      location: 'Salle 2',
      status: 'FINISHED',
      scores: { program: 4.8, technical: 4.8, total: 9.60, isPublished: true }
    });


    // --- Current Block (Live) ---
    // NOW +/- 30 min. We want them to be currently overlapping 'now'.
    // Start 5 mins ago, end in 10 mins.

    // Passage A: FSG Yverdon @ Sol (Salle Omnisport 1)
    passagesData.push({
      group: getGroup('Yverdon')._id,
      apparatus: getAppId('SS'),
      startTime: new Date(now.getTime() - 5 * 60000),
      endTime: new Date(now.getTime() + 10 * 60000),
      location: 'Salle Omnisport 1',
      status: 'LIVE',
      scores: {}
    });

    // Passage B: TV Wetzikon @ Anneaux (Salle 2)
    passagesData.push({
      group: getGroup('Wetzikon')._id,
      apparatus: getAppId('AB'),
      startTime: new Date(now.getTime() - 2 * 60000),
      endTime: new Date(now.getTime() + 13 * 60000),
      location: 'Salle 2',
      status: 'LIVE',
      scores: {}
    });

    // Passage C (Filler): FSG Morges @ Gym (Salle 3) - Request asked for 3 live passages
    passagesData.push({
      group: getGroup('Morges')._id,
      apparatus: getAppId('GYM'),
      startTime: new Date(now.getTime() - 8 * 60000),
      endTime: new Date(now.getTime() + 7 * 60000),
      location: 'Salle 3',
      status: 'LIVE',
      scores: {}
    });


    // --- Afternoon Block (Scheduled) ---
    // Starts in 30 mins
    const futureBase = new Date(now.getTime() + 30 * 60000);

    // 1. BTV Luzern @ Anneaux
    passagesData.push({
      group: getGroup('Luzern')._id,
      apparatus: getAppId('AB'),
      startTime: new Date(futureBase.getTime()),
      endTime: new Date(futureBase.getTime() + 10 * 60000),
      location: 'Salle Omnisport 1',
      status: 'SCHEDULED'
    });

    // 2. TV Mels @ Barres
    passagesData.push({
      group: getGroup('Mels')._id,
      apparatus: getAppId('BA'),
      startTime: new Date(futureBase.getTime() + 15 * 60000),
      endTime: new Date(futureBase.getTime() + 25 * 60000),
      location: 'Salle 2',
      status: 'SCHEDULED'
    });

    // 3. FSG Yverdon @ Saut
    passagesData.push({
      group: getGroup('Yverdon')._id,
      apparatus: getAppId('SA'),
      startTime: new Date(futureBase.getTime() + 30 * 60000),
      endTime: new Date(futureBase.getTime() + 40 * 60000),
      location: 'Salle Omnisport 1',
      status: 'SCHEDULED'
    });

    // 4. TV Wetzikon @ Sol
    passagesData.push({
      group: getGroup('Wetzikon')._id,
      apparatus: getAppId('SS'),
      startTime: new Date(futureBase.getTime() + 45 * 60000),
      endTime: new Date(futureBase.getTime() + 55 * 60000),
      location: 'Salle 2',
      status: 'SCHEDULED'
    });

    // Finale Block (Evening) - FSG Aigle-Alliance & STV Wangen
    // 5. Finale: FSG Aigle-Alliance @ Combinaison
    passagesData.push({
      group: getGroup('Aigle')._id,
      apparatus: getAppId('CE'),
      startTime: new Date(futureBase.getTime() + 120 * 60000), // 2 hours later
      endTime: new Date(futureBase.getTime() + 130 * 60000),
      location: 'Salle Omnisport 1',
      status: 'SCHEDULED'
    });

    // 6. Finale: STV Wangen @ Barres
    passagesData.push({
      group: getGroup('Wangen')._id,
      apparatus: getAppId('BA'),
      startTime: new Date(futureBase.getTime() + 135 * 60000),
      endTime: new Date(futureBase.getTime() + 145 * 60000),
      location: 'Salle Omnisport 1',
      status: 'SCHEDULED'
    });


    const passagesInserted = await PassageModel.insertMany(passagesData);
    console.log(`🌱 Seed: Created ${passagesInserted.length} Passages`);


    // 4. STREAMS CONFIGURATION
    const yverdonLive = passagesInserted.find((p: any) => p.status === 'LIVE' && p.location === 'Salle Omnisport 1');
    const wetzikonLive = passagesInserted.find((p: any) => p.status === 'LIVE' && p.location === 'Salle 2');

    const streamsData = [
      {
        name: 'Main Hall',
        type: 'EMBED',
        platform: 'YouTube',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Generic live link
        location: 'Salle Omnisport 1',
        isLive: true,
        currentPassage: yverdonLive?._id
      },
      {
        name: 'Secondary Hall',
        type: 'LINK',
        url: 'https://twitch.tv/swissgymnastics',
        location: 'Salle 2',
        isLive: true,
        currentPassage: wetzikonLive?._id
      }
    ];

    const streamsInserted = await StreamModel.insertMany(streamsData);
    console.log(`🌱 Seed: Created ${streamsInserted.length} Streams`);

    console.log('[seed] Finished seeding database with realistic 2024/2025 data.');

    return {
      success: true,
      summary: {
        apparatus: apparatusInserted.length,
        groups: groupsInserted.length,
        passages: passagesInserted.length,
        streams: streamsInserted.length
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
