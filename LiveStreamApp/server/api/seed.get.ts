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

    const apparatusData = [
      { code: 'BA', name: 'Barres Parallèles', icon: 'fluent:table-simple-24-regular', isActive: true },
      { code: 'SS', name: 'Sol', icon: 'fluent:grid-dots-24-regular', isActive: true },
      { code: 'AB', name: 'Anneaux Balançants', icon: 'fluent:circle-24-regular', isActive: true },
      { code: 'SA', name: 'Saut', icon: 'fluent:arrow-up-24-regular', isActive: true },
      { code: 'RE', name: 'Barre Fixe', icon: 'fluent:line-horizontal-1-24-regular', isActive: true },
      { code: 'SSB', name: 'Barres Asymétriques Scolaires', icon: 'fluent:align-space-even-vertical-20-regular', isActive: true },
      { code: 'CE', name: 'Combinaison d\'Engins', icon: 'fluent:stack-24-regular', isActive: true },
      { code: 'TR', name: 'Trampoline', icon: 'fluent:arrow-bounce-24-regular', isActive: true },
      { code: 'GYM', name: 'Gymnastique (sans engins)', icon: 'fluent:people-community-24-regular', isActive: true },
    ];

    const apparatusInserted = await ApparatusModel.insertMany(apparatusData);
    console.log(`[seed] Inserted ${apparatusInserted.length} apparatus`);

    const apparatusByCode = new Map<string, any>();
    apparatusInserted.forEach((a) => apparatusByCode.set(a.code, a));

    const groupsData = [
      {
        name: 'FSG Yverdon Amis-Gym',
        canton: 'VD',
        logo: '',
        gymnastsCount: 24,
        monitors: ['Marie Dupont', 'Lucie Martin'],
        history: [
          { year: 2023, competition: 'Regional Yverdon', apparatusCode: 'SS', score: 9.25 },
          { year: 2022, competition: 'Intercantonal', apparatusCode: 'BA', score: 9.12 },
        ],
      },
      {
        name: 'FSG Wetzikon',
        canton: 'ZH',
        logo: '',
        gymnastsCount: 32,
        monitors: ['Hans Keller'],
        history: [
          { year: 2023, competition: 'Zürich Cup', apparatusCode: 'AB', score: 9.85 },
          { year: 2022, competition: 'Regional Ost', apparatusCode: 'SA', score: 9.40 },
        ],
      },
      {
        name: 'FSG Aigle-Alliance',
        canton: 'VD',
        logo: '',
        gymnastsCount: 18,
        monitors: ['Jean-Pierre Morel'],
        history: [
          { year: 2023, competition: 'Alpes Trophy', apparatusCode: 'RE', score: 9.02 },
          { year: 2021, competition: 'District', apparatusCode: 'CE', score: 8.90 },
        ],
      },
      {
        name: 'FSG Luzern',
        canton: 'LU',
        logo: '',
        gymnastsCount: 40,
        monitors: ['Claudia Frei'],
        history: [
          { year: 2023, competition: 'Luzern Open', apparatusCode: 'TR', score: 9.60 },
          { year: 2022, competition: 'Central', apparatusCode: 'SSB', score: 9.10 },
        ],
      },
      {
        name: 'FSG Montreux',
        canton: 'VD',
        logo: '',
        gymnastsCount: 20,
        monitors: ['Pierre Lang'],
        history: [
          { year: 2023, competition: 'Montreux Classic', apparatusCode: 'GYM', score: 9.33 },
          { year: 2022, competition: 'Riviera Cup', apparatusCode: 'SA', score: 9.00 },
        ],
      },
    ];

    const groupsInserted = await GroupModel.insertMany(groupsData as any);
    console.log(`[seed] Inserted ${groupsInserted.length} groups`);

    // Create schedule: past (2 finished), present (2 live), future (5 scheduled within next 2 hours)
    const now = new Date();

    const getAppId = (code: string) => {
      const r = apparatusByCode.get(code);
      if (!r) throw new Error(`Apparatus with code ${code} not found`);
      return r._id as Types.ObjectId;
    };

    // Choose groups for passages
    const FSGYverdon = groupsInserted.find((g: any) => g.name.includes('Yverdon'))!;
    const FSGWetzikon = groupsInserted.find((g: any) => g.name.includes('Wetzikon'))!;
    const FSGAigle = groupsInserted.find((g: any) => g.name.includes('Aigle'))!;
    const FSGLuzern = groupsInserted.find((g: any) => g.name.includes('Luzern'))!;
    const FSGMontreux = groupsInserted.find((g: any) => g.name.includes('Montreux'))!;

    const passagesData: any[] = [];

    // Past finished 1
    passagesData.push({
      group: FSGWetzikon._id,
      apparatus: getAppId('AB'),
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 3),
      endTime: new Date(now.getTime() - 1000 * 60 * 60 * 3 + 1000 * 60 * 10),
      location: 'Salle Omnisport A',
      scores: { program: 9.50, technical: 9.70, total: 9.60, isPublished: true },
      status: 'FINISHED',
    });

    // Past finished 2
    passagesData.push({
      group: FSGAigle._id,
      apparatus: getAppId('RE'),
      startTime: new Date(now.getTime() - 1000 * 60 * 60 * 2.5),
      endTime: new Date(now.getTime() - 1000 * 60 * 60 * 2.5 + 1000 * 60 * 12),
      location: 'Salle Omnisport B',
      scores: { program: 9.30, technical: 9.55, total: 9.425, isPublished: true },
      status: 'FINISHED',
    });

    // Present live 1
    passagesData.push({
      group: FSGYverdon._id,
      apparatus: getAppId('SS'),
      startTime: new Date(now.getTime() - 1000 * 60 * 3),
      endTime: new Date(now.getTime() + 1000 * 60 * 7),
      location: 'Salle 1',
      scores: {},
      status: 'LIVE',
    });

    // Present live 2
    passagesData.push({
      group: FSGLuzern._id,
      apparatus: getAppId('TR'),
      startTime: new Date(now.getTime() - 1000 * 60 * 2),
      endTime: new Date(now.getTime() + 1000 * 60 * 8),
      location: 'Salle 2',
      scores: {},
      status: 'LIVE',
    });

    // Future scheduled 5 within next 2 hours
    const scheduledGroups = [FSGMontreux, FSGYverdon, FSGWetzikon, FSGAigle, FSGLuzern];
    if (scheduledGroups.some((g) => !g)) {
      throw new Error('Missing scheduled group(s) in seed data');
    }
    const scheduledApparatus = [getAppId('BA'), getAppId('SA'), getAppId('CE'), getAppId('SSB'), getAppId('GYM')];

    for (let i = 1; i <= 5; i++) {
      const start = new Date(now.getTime() + i * 1000 * 60 * 20); // every 20 minutes
      passagesData.push({
        group: scheduledGroups[i - 1]!._id,
        apparatus: scheduledApparatus[i - 1],
        startTime: start,
        endTime: new Date(start.getTime() + 1000 * 60 * 12),
        location: `Salle ${i + 2}`,
        scores: {},
        status: 'SCHEDULED',
      });
    }

    const passagesInserted = await PassageModel.insertMany(passagesData);
    console.log(`[seed] Inserted ${passagesInserted.length} passages`);

    // Create streams: one EMBED linked to first LIVE passage (Salle 1), one LINK for Salle 2
    const firstLive = passagesInserted.find((p: any) => p.status === 'LIVE' && p.location === 'Salle 1');
    const secondLive = passagesInserted.find((p: any) => p.status === 'LIVE' && p.location === 'Salle 2');

    const streamsData = [
      {
        name: 'Main EMBED - YouTube',
        url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk&pp=ygUEbGl2ZQ%3D%3D',
        location: 'Salle 1',
        isLive: true,
        currentPassage: firstLive ? firstLive._id : undefined,
      },
      {
        name: 'Secondary LINK - Salle 2',
        url: 'https://www.youtube.com/watch?v=mKCieTImjvU&pp=ygUEbGl2ZQ%3D%3D',
        location: 'Salle 2',
        isLive: true,
        currentPassage: secondLive ? secondLive._id : undefined,
      },
    ];

    const streamsInserted = await StreamModel.insertMany(streamsData as any);
    console.log(`[seed] Inserted ${streamsInserted.length} streams`);

    const summary = {
      apparatus: apparatusInserted.map((a) => ({ id: a._id, code: a.code, name: a.name })),
      groups: groupsInserted.map((g) => ({ id: g._id, name: g.name, canton: g.canton })),
      passagesCount: passagesInserted.length,
      streams: streamsInserted.map((s) => ({ id: s._id, name: s.name, location: s.location })),
    };

    console.log('[seed] Finished seeding database');

    return {
      ok: true,
      summary,
    };
  } catch (err) {
    console.error('[seed] error', err);
    throw createError({ statusCode: 500, statusMessage: 'Seeding failed' });
  }
});