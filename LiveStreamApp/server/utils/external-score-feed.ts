const ENCODING_FIXES: Record<string, string> = {
  Fmina: 'Fémina',
  'La Tour-de-Trme': 'La Tour-de-Trême',
  'Chzard-St-Martin': 'Chézard-St-Martin',
  'Chzard-st-Martin': 'Chézard-st-Martin',
  'La Grnarde': 'La Grônarde',
  Ddingen: 'Düdingen',
  Agrs: 'Agrès',
  comptition: 'compétition',
  Socit: 'Société',
  Valle: 'Vallée',
  Serrires: 'Serrières',
  asymtrique: 'asymétrique',
  parallles: 'parallèles'
};

const CATEGORY_MAP: Record<string, 'ACTIFS' | 'JEUNESSE_A' | 'JEUNESSE_B'> = {
  'Actifs-Actives': 'ACTIFS',
  'Actifs- Actives': 'ACTIFS',
  'Jeunesse A -16 ans': 'JEUNESSE_A',
  'Jeunesse A-16 ans': 'JEUNESSE_A',
  'JeunesseA -16 ans': 'JEUNESSE_A',
  'Jeunesse B -12 ans': 'JEUNESSE_B',
  'Jeunesse B-12 ans': 'JEUNESSE_B',
  'Jeunesse B -12ans': 'JEUNESSE_B'
};

interface ExternalInscriptionRaw {
  Societe?: string;
  Groupe?: string;
  Categorie?: string;
  Discipline?: string;
  Lieu1?: string;
  Lieu2?: string;
  Horaire?: string;
  Note?: string;
}

interface ExternalFeedPayload {
  inscriptions?: ExternalInscriptionRaw[];
}

export interface ExternalScoreEntry {
  groupName: string;
  location: string;
  timeSlot: string;
  score: number;
  category: 'ACTIFS' | 'JEUNESSE_A' | 'JEUNESSE_B' | 'UNKNOWN';
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const canonicalize = (value: string) =>
  normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9: ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const fixEncoding = (value: string) => {
  let fixed = value;
  for (const [broken, correct] of Object.entries(ENCODING_FIXES)) {
    fixed = fixed.replace(new RegExp(broken, 'g'), correct);
  }
  return fixed;
};

const normalizeGroupName = (societe?: string, groupe?: string) => {
  const societeFixed = normalizeWhitespace(fixEncoding(societe || ''));
  const groupeFixed = normalizeWhitespace(fixEncoding(groupe || ''));
  return normalizeWhitespace(`${societeFixed} : ${groupeFixed}`);
};

const normalizeLocation = (lieu1?: string, lieu2?: string) => {
  const first = normalizeWhitespace(fixEncoding(lieu1 || ''));
  const second = normalizeWhitespace(fixEncoding(lieu2 || ''));
  return normalizeWhitespace(`${first} ${second}`);
};

const normalizeTimeSlot = (value?: string) => normalizeWhitespace(value || '').replace(/\s/g, '');

const parseScore = (value?: string) => {
  const raw = normalizeWhitespace(value || '');
  if (!raw) return null;
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 10) return null;
  return parsed;
};

const normalizeCategory = (value?: string): ExternalScoreEntry['category'] => {
  const normalized = normalizeWhitespace(fixEncoding(value || ''));
  return CATEGORY_MAP[normalized] || 'UNKNOWN';
};

export const normalizeLookupValue = (value: string) => canonicalize(value);

export const timeSlotToMinutes = (timeSlot: string) => {
  const match = timeSlot.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, hourRaw, minuteRaw] = match;
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
};

export const getZurichTimeSlot = (value: Date | string) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const formatter = new Intl.DateTimeFormat('fr-CH', {
    timeZone: 'Europe/Zurich',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  return formatter.format(date);
};

export const buildExternalLookupKey = (groupName: string, location: string, timeSlot: string) =>
  `${normalizeLookupValue(groupName)}|${normalizeLookupValue(location)}|${normalizeLookupValue(timeSlot)}`;

export const parseExternalScoreFeed = (payload: unknown): ExternalScoreEntry[] => {
  const data = payload as ExternalFeedPayload;
  const inscriptions = Array.isArray(data?.inscriptions) ? data.inscriptions : [];

  return inscriptions
    .map((row) => {
      const score = parseScore(row.Note);
      if (score === null) return null;

      const groupName = normalizeGroupName(row.Societe, row.Groupe);
      const location = normalizeLocation(row.Lieu1, row.Lieu2);
      const timeSlot = normalizeTimeSlot(row.Horaire);
      if (!groupName || !location || !timeSlot) return null;

      return {
        groupName,
        location,
        timeSlot,
        score,
        category: normalizeCategory(row.Categorie)
      } as ExternalScoreEntry;
    })
    .filter((item): item is ExternalScoreEntry => Boolean(item));
};

export const fetchExternalScoreFeed = async (url: string): Promise<ExternalScoreEntry[]> => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`External score feed returned HTTP ${response.status}`);
  }

  const text = await response.text();
  const parsed = JSON.parse(text);
  return parseExternalScoreFeed(parsed);
};
