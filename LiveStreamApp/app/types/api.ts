export interface Apparatus {
  _id?: string;
  code: string;
  name: string;
  icon?: string;
  isActive?: boolean;
}

export interface HistoryEntry {
  year: number;
  competition: string;
  apparatusCode: string;
  score: number;
}

export interface Group {
  _id?: string;
  name: string;
  canton?: string;
  logo?: string;
  description?: string;
  category?: string;
  gymnastsCount?: number;
  monitors?: string[];
  history?: HistoryEntry[];
}

export type PassageStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Passage {
  _id?: string;
  group: string | Group;
  apparatus: string | Apparatus;
  startTime: string;
  endTime: string;
  location?: string;
  score: number | null;
  isPublished?: boolean;
  status?: PassageStatus;
  monitors?: string[];
}

export interface Stream {
  _id?: string;
  name?: string;
  url?: string;
  location?: string;
  isLive?: boolean;
  currentPassage?: string | Passage;
}

export interface EnrichedGroup {
  _id: string;
  name: string;
  category?: string;
}

export interface EnrichedApparatus {
  _id: string;
  name: string;
  code: string;
  icon?: string;
}

export interface PassageEnriched extends Omit<Passage, 'group' | 'apparatus'> {
  group: EnrichedGroup;
  apparatus: EnrichedApparatus;
}

export interface PopulatedPassage extends Omit<Passage, 'group' | 'apparatus'> {
  group: Group;
  apparatus: Apparatus;
}

export interface PopulatedStream extends Omit<Stream, 'currentPassage'> {
  currentPassage?: PopulatedPassage | null;
}

export interface ScheduleApparatusMeta {
  code: string;
  name: string;
}

export interface ScheduleResponse {
  meta: {
    availableApparatus: ScheduleApparatusMeta[];
    availableDays: string[];
    availableCategories?: string[];
    availableLocations?: string[];
  };
  data: PassageEnriched[];
}

export type PassageResult = PassageEnriched & { rank: number };

// --- Subscriptions (Web Push / FCM natif) ---

export interface WebSubscription {
  type: 'web';
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface FcmSubscription {
  type: 'fcm';
  /** FCM Registration Token (device token) */
  endpoint: string;
}

/** Union de tous les types de subscriptions push */
export type Subscription = WebSubscription | FcmSubscription;

/** @deprecated Utiliser WebSubscription / FcmSubscription */
export interface SubscriptionKeys {
  p256dh?: string;
  auth?: string;
}

// --- Group Details ---

export interface TimelineEntry {
  _id: string;
  apparatus: {
    name: string;
    icon?: string;
    code: string;
  };
  startTime: string;
  endTime: string;
  status: PassageStatus;
  score?: number;
  monitors: string[];
  location?: string;
}

export interface GroupDetailsResponse {
  info: {
    _id: string;
    name: string;
    canton?: string;
    category?: string;
    logo?: string;
    description?: string;
    gymnastsCount: number;
  };
  stats: {
    completedPassages: number;
    totalPassages: number;
    currentTotalScore: number; // The API returns number here, although formatted as string in some places, let's double check.
  };
  monitors: string[];
  history: {
    year: number;
    score: number;
    apparatus: string;
  }[];
  timeline: TimelineEntry[];
}
