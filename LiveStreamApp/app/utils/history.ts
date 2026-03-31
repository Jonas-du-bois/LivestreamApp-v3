export interface HistoryDataPoint {
  year: number;
  score: number;
  apparatus?: string;
  apparatusCode?: string;
  [key: string]: any;
}

export interface AggregatedHistoryPoint {
  year: number;
  score: number;
}

/**
 * Agrège un historique de notes par année, en calculant la moyenne des notes pour chaque année.
 * Peut optionnellement filtrer par agrès (apparatusCode).
 *
 * @param history Tableau des entrées d'historique (contenant year et score)
 * @param filterApparatusCode Code de l'agrès pour filtrer l'historique (optionnel)
 * @returns Tableau trié par année contenant l'année et la moyenne des scores
 */
export function aggregateHistoryByYear(
  history: HistoryDataPoint[],
  filterApparatusCode?: string
): AggregatedHistoryPoint[] {
  if (!history || history.length === 0) return [];

  let filteredHistory = history;
  if (filterApparatusCode) {
    filteredHistory = history.filter(
      (h) => h.apparatus === filterApparatusCode || h.apparatusCode === filterApparatusCode
    );
  }

  const yearMap = new Map<number, { total: number; count: number }>();

  filteredHistory.forEach((h) => {
    if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 });
    const entry = yearMap.get(h.year)!;
    entry.total += h.score;
    entry.count++;
  });

  const aggregated: AggregatedHistoryPoint[] = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count
  }));

  return aggregated.sort((a, b) => a.year - b.year);
}
