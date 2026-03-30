import type { HistoryEntry } from '../types/api'

/**
 * Aggregates history scores by year and calculates the average score for each year.
 * Sorts the output in chronological order (ascending year).
 * @param history Array of HistoryEntry objects containing score and year
 * @param filterApparatus Optional apparatus code to filter history points before aggregating
 * @returns Array of averaged scores per year
 */
export function aggregateHistoryByYear(history: HistoryEntry[], filterApparatus?: string): { year: number, score: number }[] {
  if (!history || history.length === 0) return []

  let rawHistory = history

  if (filterApparatus) {
    rawHistory = rawHistory.filter(h => h.apparatus === filterApparatus)
  }

  const yearMap = new Map<number, { total: number; count: number }>()
  rawHistory.forEach(h => {
     if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 })
     const entry = yearMap.get(h.year)!
     entry.total += h.score
     entry.count++
  })

  const aggregated = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count
  }))

  return aggregated.sort((a, b) => a.year - b.year)
}
