export interface HistoryPoint {
  year: number;
  score: number;
}

export interface RawHistoryEntry {
  year: number;
  score: number;
  [key: string]: any; // Allow other properties like apparatus, competition, etc.
}

/**
 * Aggregates a list of history entries by year, calculating the average score for each year.
 * The resulting list is sorted chronologically by year.
 *
 * @param history List of history entries with at least a `year` and `score` property
 * @returns An array of `{ year, score }` objects, sorted by year ascending
 */
export function aggregateHistoryByYear(history: RawHistoryEntry[]): HistoryPoint[] {
  if (!history || history.length === 0) return [];

  const yearMap = new Map<number, { total: number; count: number }>();

  history.forEach((h) => {
    if (!yearMap.has(h.year)) {
      yearMap.set(h.year, { total: 0, count: 0 });
    }
    const entry = yearMap.get(h.year)!;
    entry.total += h.score;
    entry.count++;
  });

  const aggregated: HistoryPoint[] = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count,
  }));

  return aggregated.sort((a, b) => a.year - b.year);
}
