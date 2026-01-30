import ApparatusModel from "../models/Apparatus";
import GroupModel from "../models/Group";
import PassageModel from "../models/Passage";
import StreamModel from "../models/Stream";
import SubscriptionModel from "../models/Subscription";
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
      // --- Engins existants ---
      { code: "SS", 
        name: "Sol", 
        icon: "fluent:grid-dots-24-regular" 
      },
      {
        code: "BA",
        name: "Barres Parallèles",
        icon: "fluent:table-simple-24-regular",
      },
      {
        code: "AB",
        name: "Anneaux Balançants",
        icon: "fluent:circle-24-regular",
      }, 
      { code: "SA", 
        name: "Saut", 
        icon: "fluent:arrow-up-24-regular" 
      },
      {
        code: "RE",
        name: "Reck",
        icon: "fluent:arrow-rotate-clockwise-24-regular",
      },
      {
        code: "BAS",
        name: "Barres Asymétriques",
        icon: "fluent:align-space-evenly-vertical-20-regular", 
      },
      {
        code: "CE",
        name: "Combinaison d'engins",
        icon: "fluent:puzzle-piece-24-regular",
      },
      {
        code: "GY",
        name: "Gymnastique",
        icon: "fluent:music-note-2-24-regular", 
      },
      {
        code: "TR",
        name: "Trampoline",
        icon: "fluent:arrow-bounce-24-regular", 
      },
    ];

    const insertedApparatus = await ApparatusModel.insertMany(apparatusList);
    // Helper to get ID safely
    const getAppId = (code: string) => {
      const app = insertedApparatus.find((a: any) => a.code === code);
      return (app as any)._id as Types.ObjectId;
    };

    console.log(`[seed] Created ${insertedApparatus.length} Apparatus`);

    // 2. GROUPS - AVEC CATÉGORIES ACTIF/MIXTE
    const groupsData = [
      // GROUPES ACTIFS (10 groupes)
      {
        name: "FSG Yverdon Amis-Gym Actifs",
        canton: "VD",
        gymnastsCount: 22,
        category: "ACTIVE",
      },
      {
        name: "TV Wetzikon Aktive",
        canton: "ZH",
        gymnastsCount: 25,
        category: "ACTIVE",
      },
      {
        name: "FSG Aigle-Alliance Actives",
        canton: "VD",
        gymnastsCount: 20,
        category: "ACTIVE",
      },
      {
        name: "FSG Morges Actives",
        canton: "VD",
        gymnastsCount: 23,
        category: "ACTIVE",
      },
      {
        name: "BTV Luzern Aktive",
        canton: "LU",
        gymnastsCount: 28,
        category: "ACTIVE",
      },
      {
        name: "STV Wangen Aktive",
        canton: "SO",
        gymnastsCount: 24,
        category: "ACTIVE",
      },
      {
        name: "TV Mels Aktive",
        canton: "SG",
        gymnastsCount: 21,
        category: "ACTIVE",
      },
      {
        name: "FSG Lausanne-Ville Actives",
        canton: "VD",
        gymnastsCount: 26,
        category: "ACTIVE",
      },
      {
        name: "FSG Genève Actives",
        canton: "GE",
        gymnastsCount: 22,
        category: "ACTIVE",
      },
      {
        name: "TV Schaffhausen Aktive",
        canton: "SH",
        gymnastsCount: 27,
        category: "ACTIVE",
      },

      // GROUPES MIXTES (5 groupes)
      {
        name: "FSG Neuchâtel Mixte",
        canton: "NE",
        gymnastsCount: 30,
        category: "MIXTE",
      },
      {
        name: "FSG Fribourg Mixte",
        canton: "FR",
        gymnastsCount: 32,
        category: "MIXTE",
      },
      {
        name: "TV Bern Gemischt",
        canton: "BE",
        gymnastsCount: 28,
        category: "MIXTE",
      },
      {
        name: "FSG Sion Mixte",
        canton: "VS",
        gymnastsCount: 29,
        category: "MIXTE",
      },
      {
        name: "FSG Vevey Jeunes-Patriotes Mixte",
        canton: "VD",
        gymnastsCount: 31,
        category: "MIXTE",
      },
    ];

    const insertedGroups = await GroupModel.insertMany(groupsData);
    
    // Les 10 premiers groupes sont actifs, les 5 suivants sont mixtes
    const activeGroups = insertedGroups.slice(0, 10);
    const mixedGroups = insertedGroups.slice(10, 15);
    
    // Helper pour récupérer des groupes par catégorie
    const getGroupByCategory = (category: "ACTIVE" | "MIXTE", index: number) => {
      const groups = category === "ACTIVE" ? activeGroups : mixedGroups;
      if (groups.length === 0) {
        throw new Error(`No groups found for category ${category}`);
      }
      return groups[index % groups.length] as any;
    };
    
    const getGroup = (index: number) =>
      insertedGroups[index % insertedGroups.length] as any;

    console.log(`[seed] Created ${insertedGroups.length} Groups (${activeGroups.length} actifs, ${mixedGroups.length} mixtes)`);

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
      const s = 8.0 + Math.random() * 2.0; // 8.00 - 10.00
      return {
        score: parseFloat(s.toFixed(2)),
        isPublished: true,
      };
    };

    const monitorNames = [
      "Jean Dupont",
      "Marie Curie",
      "Paul Scherrer",
      "Albert Einstein",
      "Sarah Connor",
      "Ellen Ripley",
      "John Wick",
      "James Bond",
      "Lara Croft",
      "Indiana Jones",
      "Han Solo",
      "Leia Organa",
    ];

    const generateMonitors = () => {
      // Pick 1-3 random monitors
      const count = 1 + Math.floor(Math.random() * 3);
      const selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(
          monitorNames[Math.floor(Math.random() * monitorNames.length)],
        );
      }
      return [...new Set(selected)]; // Unique
    };

    let passageCounter = 0;
    let activeCounter = 0;
    let mixteCounter = 0;
    
    // Tous les engins disponibles pour tous les groupes
    const appCodes = ["SS", "BA", "AB", "SA", "RE", "BAS", "CE", "GY", "TR"];

    // A. YESTERDAY (15 Actifs Finished + 5 Mixtes Finished)
    for (let i = 0; i < 15; i++) {
      const startTime = new Date(yesterday.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("ACTIVE", activeCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "FINISHED",
        ...generateScore(),
        monitors: generateMonitors(),
      });
    }
    
    for (let i = 0; i < 5; i++) {
      const startTime = new Date(yesterday.getTime() + (15 + i) * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("MIXTE", mixteCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "FINISHED",
        ...generateScore(),
        monitors: generateMonitors(),
      });
    }

    // B. TODAY AM (7 Actifs Finished + 3 Mixtes Finished)
    for (let i = 0; i < 7; i++) {
      const startTime = new Date(todayStart.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("ACTIVE", activeCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "FINISHED",
        ...generateScore(),
        monitors: generateMonitors(),
      });
    }
    
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(todayStart.getTime() + (7 + i) * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("MIXTE", mixteCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "FINISHED",
        ...generateScore(),
        monitors: generateMonitors(),
      });
    }

    // C. TODAY NOW (1 ACTIF LIVE + 1 MIXTE LIVE)
    const liveStartTime = new Date(now.getTime() - 5 * 60000);

    const live1 = {
      group: String(getGroupByCategory("ACTIVE", activeCounter++)._id),
      apparatus: String(getAppId("SS")),
      startTime: liveStartTime,
      endTime: new Date(liveStartTime.getTime() + 15 * 60000),
      location: "Isles 1",
      status: "LIVE",
      monitors: generateMonitors(),
    };
    passagesData.push(live1);

    const live2 = {
      group: String(getGroupByCategory("MIXTE", mixteCounter++)._id),
      apparatus: String(getAppId("BA")),
      startTime: liveStartTime,
      endTime: new Date(liveStartTime.getTime() + 15 * 60000),
      location: "Léon Michaud 1",
      status: "LIVE",
      monitors: generateMonitors(),
    };
    passagesData.push(live2);

    // D. TODAY PM (7 Actifs Scheduled + 3 Mixtes Scheduled)
    const todayPMStart = new Date(now.getTime() + 30 * 60000);
    for (let i = 0; i < 7; i++) {
      const startTime = new Date(todayPMStart.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("ACTIVE", activeCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "SCHEDULED",
        monitors: generateMonitors(),
      });
    }
    
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(todayPMStart.getTime() + (7 + i) * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("MIXTE", mixteCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "SCHEDULED",
        monitors: generateMonitors(),
      });
    }

    // E. TOMORROW (10 Actifs Scheduled + 5 Mixtes Scheduled)
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(tomorrow.getTime() + i * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("ACTIVE", activeCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "SCHEDULED",
        monitors: generateMonitors(),
      });
    }
    
    for (let i = 0; i < 5; i++) {
      const startTime = new Date(tomorrow.getTime() + (10 + i) * 15 * 60000);
      passagesData.push({
        group: String(getGroupByCategory("MIXTE", mixteCounter++)._id),
        apparatus: String(getAppId(appCodes[i % appCodes.length]!)),
        startTime: startTime,
        endTime: new Date(startTime.getTime() + 10 * 60000),
        location: i % 2 === 0 ? "Isles 1" : "Léon Michaud 1",
        status: "SCHEDULED",
        monitors: generateMonitors(),
      });
    }

    const insertedPassages = await PassageModel.insertMany(passagesData);
    console.log(`[seed] Created ${insertedPassages.length} Passages`);

    // 4. STREAMS
    // Safe fetching of live passages
    const livePassages = await PassageModel.find({ status: "LIVE" });

    const streamsData = [];
    if (livePassages.length > 0 && livePassages[0]) {
      streamsData.push({
        name: "Isles 1 - Caméra Principale",
        type: "EMBED",
        url: "https://www.youtube.com/embed/jfKfPfyJRdk",
        location: "Isles 1",
        isLive: true,
        currentPassage: String(livePassages[0]._id),
      });
    }

    if (livePassages.length > 1 && livePassages[1]) {
      streamsData.push({
        name: "Léon Michaud 1 - Vue Gymnastes",
        type: "LINK",
        url: "https://twitch.tv/swissgymnastics",
        location: "Léon Michaud 1",
        isLive: true,
        currentPassage: String(livePassages[1]._id),
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
        streams: insertedStreams.length,
        breakdown: {
          activeGroups: activeGroups.length,
          mixedGroups: mixedGroups.length,
        }
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
