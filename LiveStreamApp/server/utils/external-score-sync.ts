import { Server as IOServer } from 'socket.io';
import PassageModel from '../models/Passage';
import {
  buildExternalLookupKey,
  fetchExternalScoreFeed,
  normalizeLookupValue,
  timeSlotToMinutes,
  type ExternalScoreEntry
} from './external-score-feed';
import { invalidateServerCache, updatePassageScore } from './score-update';

type IndexedPassage = any & { slotMinutes: number | null };

interface SyncExternalScoresOptions {
  feedUrl: string;
  io?: IOServer;
  applyUpdates?: boolean;
  source?: string;
  sampleLimit?: number;
}

interface MismatchSample {
  groupName: string;
  location: string;
  timeSlot: string;
  score: number;
  candidates?: number;
  reason: string;
}

export interface ExternalScoresSyncResult {
  feedRows: number;
  rowsWithScore: number;
  updated: number;
  unchanged: number;
  unmatched: number;
  ambiguous: number;
  unmatchedSamples: MismatchSample[];
  ambiguousSamples: MismatchSample[];
}

const isCategoryCompatible = (externalCategory: ExternalScoreEntry['category'], passage: IndexedPassage) => {
  if (externalCategory === 'UNKNOWN') return true;
  const group = passage.group as any;
  const category = String(group?.category || '').toUpperCase();
  const subCategory = String(group?.subCategory || '').toUpperCase();

  if (externalCategory === 'ACTIFS') {
    return category === 'ACTIFS' || subCategory === 'ACTIFS';
  }

  return subCategory === externalCategory;
};

const isApparatusCompatible = (row: ExternalScoreEntry, passage: IndexedPassage) => {
  if (!row.apparatusHints || row.apparatusHints.length === 0) return true;
  const apparatusCode = String((passage.apparatus as any)?.code || '').trim();
  if (!apparatusCode) return true;
  return row.apparatusHints.includes(apparatusCode);
};

const buildPassageIndexes = (passages: IndexedPassage[]) => {
  const byExact = new Map<string, IndexedPassage[]>();
  const byGroup = new Map<string, IndexedPassage[]>();
  const byGroupLocation = new Map<string, IndexedPassage[]>();
  const byLocationSlot = new Map<string, IndexedPassage[]>();
  const byLocation = new Map<string, IndexedPassage[]>();

  passages.forEach((passage) => {
    const groupName = (passage.group as any)?.name;
    const location = passage.location;
    const startTime = passage.startTime;
    if (!groupName || !location || !startTime) return;

    const slot = new Date(startTime).toLocaleTimeString('fr-CH', {
      timeZone: 'Europe/Zurich',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    const slotMinutes = timeSlotToMinutes(slot);
    passage.slotMinutes = slotMinutes;

    const exactKey = buildExternalLookupKey(groupName, location, slot);
    if (!byExact.has(exactKey)) byExact.set(exactKey, []);
    byExact.get(exactKey)!.push(passage);

    const groupKey = normalizeLookupValue(groupName);
    if (!byGroup.has(groupKey)) byGroup.set(groupKey, []);
    byGroup.get(groupKey)!.push(passage);

    const locationKey = normalizeLookupValue(location);
    const groupLocationKey = `${groupKey}|${locationKey}`;
    if (!byGroupLocation.has(groupLocationKey)) byGroupLocation.set(groupLocationKey, []);
    byGroupLocation.get(groupLocationKey)!.push(passage);

    const locationSlotKey = `${locationKey}|${normalizeLookupValue(slot)}`;
    if (!byLocationSlot.has(locationSlotKey)) byLocationSlot.set(locationSlotKey, []);
    byLocationSlot.get(locationSlotKey)!.push(passage);

    if (!byLocation.has(locationKey)) byLocation.set(locationKey, []);
    byLocation.get(locationKey)!.push(passage);
  });

  return { byExact, byGroup, byGroupLocation, byLocationSlot, byLocation };
};

const filterCompatible = (row: ExternalScoreEntry, candidates: IndexedPassage[]) =>
  candidates.filter((candidate) => isCategoryCompatible(row.category, candidate) && isApparatusCompatible(row, candidate));

const pickCandidate = (
  row: ExternalScoreEntry,
  indexes: ReturnType<typeof buildPassageIndexes>
): { candidate: IndexedPassage | null; ambiguousCount: number } => {
  const exactKey = buildExternalLookupKey(row.groupName, row.location, row.timeSlot);
  const groupKey = normalizeLookupValue(row.groupName);
  const locationKey = normalizeLookupValue(row.location);
  const groupLocationKey = `${groupKey}|${locationKey}`;
  const locationSlotKey = `${locationKey}|${normalizeLookupValue(row.timeSlot)}`;
  const rowMinutes = timeSlotToMinutes(row.timeSlot);

  const candidateSets: IndexedPassage[][] = [];
  candidateSets.push(filterCompatible(row, indexes.byExact.get(exactKey) || []));

  if (rowMinutes !== null) {
    candidateSets.push(
      filterCompatible(row, indexes.byGroupLocation.get(groupLocationKey) || []).filter(
        (candidate) => typeof candidate.slotMinutes === 'number' && Math.abs(candidate.slotMinutes - rowMinutes) <= 10
      )
    );
    candidateSets.push(
      filterCompatible(row, indexes.byGroup.get(groupKey) || []).filter(
        (candidate) => typeof candidate.slotMinutes === 'number' && Math.abs(candidate.slotMinutes - rowMinutes) <= 5
      )
    );
  }

  candidateSets.push(filterCompatible(row, indexes.byGroupLocation.get(groupLocationKey) || []));
  candidateSets.push(filterCompatible(row, indexes.byGroup.get(groupKey) || []));
  candidateSets.push(filterCompatible(row, indexes.byLocationSlot.get(locationSlotKey) || []));

  if (rowMinutes !== null) {
    candidateSets.push(
      filterCompatible(row, indexes.byLocation.get(locationKey) || []).filter(
        (candidate) => typeof candidate.slotMinutes === 'number' && Math.abs(candidate.slotMinutes - rowMinutes) <= 5
      )
    );
  }

  for (const set of candidateSets) {
    if (set.length === 1) return { candidate: set[0], ambiguousCount: 0 };
    if (set.length > 1) return { candidate: null, ambiguousCount: set.length };
  }

  return { candidate: null, ambiguousCount: 0 };
};

export const syncExternalScores = async ({
  feedUrl,
  io,
  applyUpdates = true,
  source = 'external-scores-sync',
  sampleLimit = 10
}: SyncExternalScoresOptions): Promise<ExternalScoresSyncResult> => {
  const scoredRows = await fetchExternalScoreFeed(feedUrl);
  const passagesRaw = await PassageModel.find({})
    .select('group apparatus startTime location score isPublished')
    .populate('group', 'name category subCategory')
    .populate('apparatus', 'code')
    .lean();

  const passages = passagesRaw.map((passage: any) => ({ ...passage, slotMinutes: null })) as IndexedPassage[];
  const indexes = buildPassageIndexes(passages);

  let updated = 0;
  let unchanged = 0;
  let unmatched = 0;
  let ambiguous = 0;
  const unmatchedSamples: MismatchSample[] = [];
  const ambiguousSamples: MismatchSample[] = [];

  for (const row of scoredRows) {
    const { candidate, ambiguousCount } = pickCandidate(row, indexes);
    if (!candidate && ambiguousCount > 0) {
      ambiguous++;
      if (ambiguousSamples.length < sampleLimit) {
        ambiguousSamples.push({
          groupName: row.groupName,
          location: row.location,
          timeSlot: row.timeSlot,
          score: row.score,
          candidates: ambiguousCount,
          reason: 'multiple-candidates'
        });
      }
      continue;
    }

    if (!candidate) {
      unmatched++;
      if (unmatchedSamples.length < sampleLimit) {
        unmatchedSamples.push({
          groupName: row.groupName,
          location: row.location,
          timeSlot: row.timeSlot,
          score: row.score,
          reason: 'no-candidate'
        });
      }
      continue;
    }

    const alreadySameScore = typeof candidate.score === 'number' && candidate.score === row.score && candidate.isPublished;
    if (!applyUpdates) {
      if (alreadySameScore) unchanged++;
      else updated++;
      continue;
    }

    try {
      const updateResult = await updatePassageScore({
        passageId: candidate._id.toString(),
        score: row.score,
        io,
        invalidateCache: false,
        source
      });

      if (updateResult.changed) {
        updated++;
        candidate.score = row.score;
        candidate.isPublished = true;
      } else {
        unchanged++;
      }
    } catch (err: any) {
      console.error(
        `[${source}] Failed updating "${row.groupName}" at ${row.location} ${row.timeSlot}:`,
        err?.message || err
      );
      unmatched++;
      if (unmatchedSamples.length < sampleLimit) {
        unmatchedSamples.push({
          groupName: row.groupName,
          location: row.location,
          timeSlot: row.timeSlot,
          score: row.score,
          reason: `update-error:${err?.statusCode || 'unknown'}`
        });
      }
    }
  }

  if (applyUpdates && updated > 0) {
    await invalidateServerCache(source);
  }

  return {
    feedRows: scoredRows.length,
    rowsWithScore: scoredRows.length,
    updated,
    unchanged,
    unmatched,
    ambiguous,
    unmatchedSamples,
    ambiguousSamples
  };
};
