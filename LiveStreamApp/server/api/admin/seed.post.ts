import ApparatusModel from '../../models/Apparatus';
import GroupModel from '../../models/Group';
import PassageModel from '../../models/Passage';
import StreamModel from '../../models/Stream';
import SubscriptionModel from '../../models/Subscription';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SCHEDULE_TIME_ZONE = 'Europe/Zurich';

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  const zonedTimestamp = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second
  );

  return zonedTimestamp - date.getTime();
};

const zonedTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
) => {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const firstPass = new Date(utcGuess.getTime() - offset);
  const correctedOffset = getTimeZoneOffsetMs(firstPass, timeZone);

  return new Date(utcGuess.getTime() - correctedOffset);
};

// cleanedResultats stores Swiss wall-clock times with a trailing "Z".
// Treat the date/time fields as Europe/Zurich local time instead of true UTC.
const parseScheduleImportStartTime = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return new Date(value);

  const [, year, month, day, hour, minute, second = '0'] = match;

  return zonedTimeToUtc(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    SCHEDULE_TIME_ZONE
  );
};

export default defineEventHandler(async (event) => {
  // Security: Rate Limit (1 req/10min) to prevent DoS via DB exhaustion
  const ip = getRequestIP(event) || 'unknown';
  if (await isRateLimited(`${ip}:seed`, 1, 600000)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests: Seed is rate limited.',
    });
  }

  try {
    console.log("[seed] Starting DB seed — clearing collections...");

    await Promise.all([
      ApparatusModel.deleteMany({}),
      GroupModel.deleteMany({}),
      PassageModel.deleteMany({}),
      StreamModel.deleteMany({}),
      SubscriptionModel.deleteMany({}),
    ]);

    console.log("[seed] Collections cleared");

    // 1. APPARATUS
    const apparatusList = [
      { code: "SS", name: "Sol", icon: "fluent:grid-dots-24-regular" },
      { code: "BA", name: "Barres Parallèles", icon: "fluent:table-simple-24-regular" },
      { code: "AB", name: "Anneaux Balançants", icon: "fluent:circle-24-regular" },
      { code: "SA", name: "Saut", icon: "fluent:arrow-up-24-regular" },
      { code: "RE", name: "Reck", icon: "fluent:arrow-rotate-clockwise-24-regular" },
      { code: "BAS", name: "Barres Asymétriques", icon: "fluent:align-space-evenly-vertical-20-regular" },
      { code: "CE", name: "Combinaison d'engins", icon: "fluent:puzzle-piece-24-regular" },
      { code: "SO", name: "Sol", icon: "fluent:grid-dots-24-regular" },
      { code: "BP", name: "Barres Parallèles", icon: "fluent:table-simple-24-regular" },
      { code: "BF", name: "Barre Fixe", icon: "fluent:arrow-rotate-clockwise-24-regular" },
      { code: "GYAE", name: "Gymnastique avec engins", icon: "fluent:ribbon-24-regular" },
      { code: "GYSE", name: "Gymnastique sans engins", icon: "fluent:people-24-regular" },
      { code: "ST", name: "Saut", icon: "fluent:arrow-up-24-regular" },
      { code: "sans-engin-12x12", name: "Sans engin 12x12 m", icon: "fluent:people-24-regular" },
      { code: "sans-engin-12x14", name: "Sans engin 12x14 m", icon: "fluent:people-24-regular" },
      { code: "sans-engin-12x18", name: "Sans engin 12x18 m", icon: "fluent:people-24-regular" },
      { code: "avec-engin-12x12", name: "Avec engin 12x12 m", icon: "fluent:ribbon-24-regular" },
      { code: "avec-engin-12x14", name: "Avec engin 12x14 m", icon: "fluent:ribbon-24-regular" },
      { code: "avec-engin-12x18", name: "Avec engin 12x18 m", icon: "fluent:ribbon-24-regular" }
    ];

    const insertedApparatus = await ApparatusModel.insertMany(apparatusList);
    const appMap = new Map<string, unknown>();
    for (const a of insertedApparatus) {
      appMap.set(a.code, a._id);
    }

    // Fonction pour générer un score réaliste (entre 7.5 et 9.8)
    const generateScore = () => {
      return Math.round((7.5 + Math.random() * 2.3) * 100) / 100;
    };

    // Load Cleaned Data
    const cleanedFilePath = path.join(process.cwd(), 'server', 'schedule_import', 'cleanedResultats.json');
    let rawData = '{}';
    if (fs.existsSync(cleanedFilePath)) {
      rawData = await fs.promises.readFile(cleanedFilePath, 'utf-8');
    } else {
      console.warn(`[seed] WARNING: ${cleanedFilePath} not found. Fallback to empty data.`);
    }
    const scheduleData = JSON.parse(rawData).passages || [];

    // 2. GROUPS
    const groupDocsMap = new Map<string, any>();
    scheduleData.forEach((p: any) => {
        if (!groupDocsMap.has(p.groupName)) {
            groupDocsMap.set(p.groupName, {
                name: p.groupName,
                category: p.category,
                subCategory: p.subCategory,
                canton: p.canton
            });
        }
    });

    const insertedGroups = await GroupModel.insertMany(Array.from(groupDocsMap.values()));
    const groupMap = new Map<string, unknown>();
    for (const g of insertedGroups) {
      groupMap.set(g.name, g._id);
    }

    // 3. PROCESS PASSAGES (Calculation Logic)
    // GROUP BY BIG HALL ("Iles" vs "Léon") and Date to calculate interleaved duration
    const bigHalls = new Map<string, any[]>();
    
    scheduleData.forEach((p: any) => {
        const startTime = parseScheduleImportStartTime(p.startTime);
        
        let key = "Autre";
        if (p.location.startsWith("Iles")) key = "Iles";
        else if (p.location.startsWith("Léon") || p.location.startsWith("LM")) key = "Léon";

        // Separate by local schedule day as well. The imported string encodes a Swiss wall-clock time.
        const dayKey = `${key}_${String(p.startTime).slice(0, 10)}`;
        
        if (!bigHalls.has(dayKey)) bigHalls.set(dayKey, []);
        bigHalls.get(dayKey)?.push({ ...p, startTime });
    });

    const finalPassages: any[] = [];
    const now = new Date();

    // Iterate over each "Big Hall Schedule"
    bigHalls.forEach((passages) => {
        // Sort purely by time
        passages.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        // Calculate End Times
        for (let i = 0; i < passages.length; i++) {
            const current = passages[i];
            let endTime;

            if (i < passages.length - 1) {
                // End time is Start time of NEXT passage in the big hall
                endTime = new Date(passages[i+1].startTime);
                
                // Safety logic: if next passage is more than 30 mins away, assume a standard 10m gap
                const diffMins = (endTime.getTime() - current.startTime.getTime()) / 60000;
                if (diffMins > 30) {
                   endTime = new Date(current.startTime.getTime() + 10 * 60000);
                }
            } else {
                // Last passage gets fixed 7 minutes
                endTime = new Date(current.startTime.getTime() + 7 * 60000);
            }

            // Determine Status
            let status = 'SCHEDULED';
            if (now >= endTime) {
                status = 'FINISHED';
            } else if (now >= current.startTime && now < endTime) {
                status = 'LIVE';
            }

            const grpId = groupMap.get(current.groupName);
            const appId = appMap.get(current.apparatusCode);

            if (grpId && appId) {
                finalPassages.push({
                    group: grpId,
                    apparatus: appId,
                    startTime: current.startTime,
                    endTime: endTime,
                    location: current.location,
                    status: status,
                    // Les passages terminés ont une note et mets isPublished à true, les autres non
                    score: status === 'FINISHED' ? generateScore() : null,
                    isPublished: status === 'FINISHED'
                });
            }
        }
    });

    const insertedPassages = await PassageModel.insertMany(finalPassages);
    console.log(`[seed] Created ${insertedPassages.length} Passages`);

    // 4. STREAMS
    const definedCameras = [
        { loc: "Iles 1", name: "Iles 1", url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
        { loc: "Iles 2", name: "Iles 2", url: "https://www.youtube.com/embed/36YnV9STBqc?si=ns2_QOjchVwyyqUL" },
        { loc: "LM 1", name: "Léon-Michaud 1", url: "https://www.youtube.com/embed/mKCieTImjvU?si=mCOGyTE4VSpU8WVV" }
    ];

    const streamsData = [];

    for (const cam of definedCameras) {
        // On cherche s'il y a un passage EN DIRECT dans cette salle pour l'associer
        const liveP = insertedPassages.find((p: { location?: string; status?: string }) => p.location === cam.loc && p.status === 'LIVE');
        
        streamsData.push({
            name: cam.name,
            url: cam.url, 
            location: cam.loc,
            isLive: true,
            currentPassage: liveP ? liveP._id : null
        });
    }

    const insertedStreams = await StreamModel.insertMany(streamsData);
    console.log(`[seed] Created ${insertedStreams.length} Streams (Caméras)`);

    // Invalidate Nitro server-side cache
    try {
      const cacheStorage = useStorage('cache')
      const allCacheKeys = await cacheStorage.getKeys()
      if (allCacheKeys.length > 0) {
        await Promise.all(allCacheKeys.map(key => cacheStorage.removeItem(key)))
        console.log(`[seed] Cleared ${allCacheKeys.length} Nitro cache entries`)
      }
    } catch (cacheErr) {
      console.warn('[seed] Could not clear Nitro cache:', cacheErr)
    }

    return { 
      success: true, 
      summary: { 
        passages: insertedPassages.length, 
        streams: insertedStreams.length 
      } 
    };
  } catch (err) {
    console.error("[seed] Error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
});
