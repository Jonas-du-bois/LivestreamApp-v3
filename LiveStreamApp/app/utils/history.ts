import type { HistoryEntry } from '../types/api'

/**
 * Aggregates a list of history entries by year, calculating the average score per year.
 * The resulting array is sorted chronologically (ascending by year).
 *
 * @param rawHistory The raw list of history entries (e.g. from API or database)
 * @returns A sorted array of objects containing the year and the average score for that year.
 */
export function aggregateHistoryByYear(rawHistory: HistoryEntry[]): { year: number; score: number }[] {
  if (!rawHistory || !rawHistory.length) return []

  const yearMap = new Map<number, { total: number; count: number }>()

  rawHistory.forEach((h) => {
    if (!yearMap.has(h.year)) {
      yearMap.set(h.year, { total: 0, count: 0 })
    }
    const entry = yearMap.get(h.year)!
    entry.total += h.score
    entry.count++
  })

  const aggregated = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count,
  }))

  return aggregated.sort((a, b) => a.year - b.year)
}
