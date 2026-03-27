export function aggregateHistoryByYear(
  history: { year: number; score: number; apparatus?: string; apparatusCode?: string }[],
  apparatusFilter?: string
): { year: number; score: number }[] {
  if (!history || history.length === 0) return [];

  let rawHistory = history;

  if (apparatusFilter) {
    rawHistory = rawHistory.filter(
      (h) => h.apparatus === apparatusFilter || h.apparatusCode === apparatusFilter
    );
  }

  const yearMap = new Map<number, { total: number; count: number }>();
  rawHistory.forEach((h) => {
    if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 });
    const entry = yearMap.get(h.year)!;
    entry.total += h.score;
    entry.count++;
  });

  const aggregated = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count,
  }));

  return aggregated.sort((a, b) => a.year - b.year);
}

export function calculateAverageScore(items: { score: number }[]): string {
  if (!items || !items.length) return '0.00';
  const sum = items.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
  return (sum / items.length).toFixed(2);
}
