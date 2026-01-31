import ApparatusModel from "../../models/Apparatus";
import GroupModel from "../../models/Group";
import PassageModel from "../../models/Passage";
import StreamModel from "../../models/Stream";
import SubscriptionModel from "../../models/Subscription";
import { Types } from "mongoose";

export default defineEventHandler(async (event) => {
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
      { code: "GY", name: "Gymnastique", icon: "fluent:music-note-2-24-regular" },
      { code: "TR", name: "Trampoline", icon: "fluent:arrow-bounce-24-regular" },
    ];

    const insertedApparatus = await ApparatusModel.insertMany(apparatusList);
    const getAppId = (code: string) => {
      const app = insertedApparatus.find((a: any) => a.code === code);
      return (app as any)._id as Types.ObjectId;
    };

    console.log(`[seed] Created ${insertedApparatus.length} Apparatus`);

    // 2. GROUPS
    const groupsData = [
      // ACTIFS (10)
      { name: "FSG Yverdon Amis-Gym Actifs", canton: "VD", gymnastsCount: 22, category: "ACTIVE" },
      { name: "TV Wetzikon Aktive", canton: "ZH", gymnastsCount: 25, category: "ACTIVE" },
      { name: "FSG Aigle-Alliance Actives", canton: "VD", gymnastsCount: 20, category: "ACTIVE" },
      { name: "FSG Morges Actives", canton: "VD", gymnastsCount: 23, category: "ACTIVE" },
      { name: "BTV Luzern Aktive", canton: "LU", gymnastsCount: 28, category: "ACTIVE" },
      { name: "STV Wangen Aktive", canton: "SO", gymnastsCount: 24, category: "ACTIVE" },
      { name: "TV Mels Aktive", canton: "SG", gymnastsCount: 21, category: "ACTIVE" },
      { name: "FSG Lausanne-Ville Actives", canton: "VD", gymnastsCount: 26, category: "ACTIVE" },
      { name: "FSG Genève Actives", canton: "GE", gymnastsCount: 22, category: "ACTIVE" },
      { name: "TV Schaffhausen Aktive", canton: "SH", gymnastsCount: 27, category: "ACTIVE" },
      // MIXTES (5)
      { name: "FSG Neuchâtel Mixte", canton: "NE", gymnastsCount: 30, category: "MIXTE" },
      { name: "FSG Fribourg Mixte", canton: "FR", gymnastsCount: 32, category: "MIXTE" },
      { name: "TV Bern Gemischt", canton: "BE", gymnastsCount: 28, category: "MIXTE" },
      { name: "FSG Sion Mixte", canton: "VS", gymnastsCount: 29, category: "MIXTE" },
      { name: "FSG Vevey Jeunes-Patriotes Mixte", canton: "VD", gymnastsCount: 31, category: "MIXTE" },
    ];

    const insertedGroups = await GroupModel.insertMany(groupsData);
    const activeGroups = insertedGroups.slice(0, 10);
    const mixedGroups = insertedGroups.slice(10, 15);
    
    const getGroupByCategory = (category: "ACTIVE" | "MIXTE", index: number) => {
      const groups = category === "ACTIVE" ? activeGroups : mixedGroups;
      return groups[index % groups.length] as any;
    };

    console.log(`[seed] Created ${insertedGroups.length} Groups`);

    // 3. PASSAGES GENERATION LOGIC
    const passagesData: any[] = [];
    const now = new Date();

    // Duration & Buffer Config
    const DURATION_MIN = 7; // minutes
    const DURATION_MAX = 8; // minutes
    const BUFFER = 2;       // minutes

    const getDuration = () => (Math.floor(Math.random() * (DURATION_MAX - DURATION_MIN + 1) + DURATION_MIN)) * 60000;
    const getBuffer = () => BUFFER * 60000;

    const generateScore = () => {
      const s = 8.0 + Math.random() * 2.0;
      return {
        score: parseFloat(s.toFixed(2)),
        isPublished: true,
      };
    };

    const monitorNames = [
      "Jean Dupont", "Marie Curie", "Paul Scherrer", "Albert Einstein",
      "Sarah Connor", "Ellen Ripley", "John Wick", "James Bond",
      "Lara Croft", "Indiana Jones", "Han Solo", "Leia Organa",
    ];
    const generateMonitors = () => {
      const count = 1 + Math.floor(Math.random() * 3);
      const selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(monitorNames[Math.floor(Math.random() * monitorNames.length)]);
      }
      return [...new Set(selected)];
    };

    const appCodes = ["SS", "BA", "AB", "SA", "RE", "BAS", "CE", "GY", "TR"];

    // Global counters to ensure rotation
    let activeCounter = 0;
    let mixteCounter = 0;
    let appCounter = 0;

    const getNextAppId = () => {
        const code = appCodes[appCounter % appCodes.length];
        appCounter++;
        return String(getAppId(code!));
    }

    /**
     * Schedules a batch of passages in parallel across two locations.
     */
    const scheduleBatch = (
        startTimeBase: Date,
        countActive: number,
        countMixte: number,
        status: string
    ) => {
        let timeIsles = startTimeBase.getTime();
        let timeLeon = startTimeBase.getTime();

        const jobs = [];
        for(let i=0; i<countActive; i++) jobs.push({ type: 'ACTIVE' });
        for(let i=0; i<countMixte; i++) jobs.push({ type: 'MIXTE' });

        let toggle = 0; // Alternator

        jobs.forEach((job) => {
            const isIsles = toggle % 2 === 0;
            toggle++;

            const location = isIsles ? "Isles 1" : "Léon Michaud 1";
            let start = isIsles ? timeIsles : timeLeon;

            // Add buffer if we are not at the very start of the block
            if (start > startTimeBase.getTime()) {
                start += getBuffer();
            }

            const duration = getDuration();
            const end = start + duration;

            // Advance time for location
            if (isIsles) timeIsles = end;
            else timeLeon = end;

            const group = job.type === 'ACTIVE'
                ? getGroupByCategory("ACTIVE", activeCounter++)
                : getGroupByCategory("MIXTE", mixteCounter++);

            const passage: any = {
                group: String(group._id),
                apparatus: getNextAppId(),
                startTime: new Date(start),
                endTime: new Date(end),
                location: location,
                status: status,
                monitors: generateMonitors(),
            };

            if (status === 'FINISHED') {
                const scoreData = generateScore();
                passage.score = scoreData.score;
                passage.isPublished = scoreData.isPublished;
            }

            passagesData.push(passage);
        });

        return Math.max(timeIsles, timeLeon);
    };

    // A. YESTERDAY (15 Active, 5 Mixte)
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(8, 0, 0, 0);
    scheduleBatch(yesterdayStart, 15, 5, "FINISHED");

    // B. TODAY AM (7 Active, 3 Mixte)
    const todayStart = new Date(now);
    todayStart.setHours(8, 0, 0, 0);
    scheduleBatch(todayStart, 7, 3, "FINISHED");

    // C. TODAY LIVE (1 Active, 1 Mixte)
    // Started 5 mins ago
    const liveStartTime = new Date(now.getTime() - 5 * 60000);

    // Live 1 -> Isles 1
    const dur1 = getDuration();
    const live1End = liveStartTime.getTime() + dur1;
    passagesData.push({
        group: String(getGroupByCategory("ACTIVE", activeCounter++)._id),
        apparatus: getNextAppId(), // SS ideally
        startTime: liveStartTime,
        endTime: new Date(live1End),
        location: "Isles 1",
        status: "LIVE",
        monitors: generateMonitors(),
    });

    // Live 2 -> Leon Michaud 1
    const dur2 = getDuration();
    const live2End = liveStartTime.getTime() + dur2;
    passagesData.push({
        group: String(getGroupByCategory("MIXTE", mixteCounter++)._id),
        apparatus: getNextAppId(), // BA ideally
        startTime: liveStartTime,
        endTime: new Date(live2End),
        location: "Léon Michaud 1",
        status: "LIVE",
        monitors: generateMonitors(),
    });

    // D. TODAY PM (7 Active, 3 Mixte) - Starts after Live
    const pmStartTimestamp = Math.max(live1End, live2End) + getBuffer();
    scheduleBatch(new Date(pmStartTimestamp), 7, 3, "SCHEDULED");

    // E. TOMORROW (10 Active, 5 Mixte)
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(8, 0, 0, 0);
    scheduleBatch(tomorrowStart, 10, 5, "SCHEDULED");

    // INSERT PASSAGES
    const insertedPassages = await PassageModel.insertMany(passagesData);
    console.log(`[seed] Created ${insertedPassages.length} Passages`);

    // 4. STREAMS
    const livePassages = await PassageModel.find({ status: "LIVE" });
    const streamsData = [];

    // Map live passages to streams by location
    const pIsles = livePassages.find(p => p.location === "Isles 1");
    const pLeon = livePassages.find(p => p.location === "Léon Michaud 1");

    if (pIsles) {
      streamsData.push({
        name: "Isles 1 - Caméra Principale",
        type: "EMBED",
        url: "https://www.youtube.com/embed/jfKfPfyJRdk",
        location: "Isles 1",
        isLive: true,
        currentPassage: String(pIsles._id),
      });
    }

    if (pLeon) {
      streamsData.push({
        name: "Léon Michaud 1 - Vue Gymnastes",
        type: "LINK",
        url: "https://twitch.tv/swissgymnastics",
        location: "Léon Michaud 1",
        isLive: true,
        currentPassage: String(pLeon._id),
      });
    }

    const insertedStreams = await StreamModel.insertMany(streamsData);
    console.log(`[seed] Created ${insertedStreams.length} Streams`);

    return {
      success: true,
      summary: {
        passages: insertedPassages.length,
        streams: insertedStreams.length,
      },
    };
  } catch (err: any) {
    console.error("[seed] Error:", err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || "Seeding failed",
    });
  }
});
