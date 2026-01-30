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
  score?: number;
  isPublished?: boolean;
  status?: PassageStatus;
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
  icon: string;
}

export interface PassageEnriched extends Omit<Passage, 'group' | 'apparatus'> {
  group: EnrichedGroup;
  apparatus: EnrichedApparatus;
}

export interface ScheduleResponse {
  meta: {
    availableApparatus: string[];
    availableDays: string[];
  };
  data: PassageEnriched[];
}

export interface SubscriptionKeys {
  p256dh?: string;
  auth?: string;
}

export interface Subscription {
  endpoint?: string;
  keys?: SubscriptionKeys;
}
