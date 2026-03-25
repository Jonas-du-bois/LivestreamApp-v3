import type { HistoryEntry } from '~/types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Aggregates a list of history entries by year, optionally filtering by an apparatus code.
 * Calculates the average score for each year if there are multiple entries.
 * Returns the data sorted chronologically (ascending year).
 */
export const aggregateHistoryByYear = (
  history: HistoryEntry[] | undefined,
  apparatusCode?: string
): HistoryPoint[] => {
  if (!history || !history.length) return []

  let rawHistory = history
  if (apparatusCode) {
    rawHistory = rawHistory.filter((h) => h.apparatusCode === apparatusCode || (h as any).apparatus === apparatusCode)
  }

  const yearMap = new Map<number, { total: number; count: number }>()

  rawHistory.forEach((h) => {
    if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 })
    const entry = yearMap.get(h.year)!
    entry.total += h.score
    entry.count++
  })

  const aggregated: HistoryPoint[] = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count,
  }))

  return aggregated.sort((a, b) => a.year - b.year)
}

/**
 * Calculates the overall average score from a list of aggregated history points.
 * Returns a string formatted to 2 decimal places.
 */
export const calculateAverageHistoryScore = (aggregated: HistoryPoint[]): string => {
  if (!aggregated || !aggregated.length) return '0.00'
  const sum = aggregated.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0)
  return (sum / aggregated.length).toFixed(2)
}

/**
 * Calculates the true overall average from the raw list of history entries.
 * Returns a string formatted to 2 decimal places.
 */
export const calculateOverallAverage = (
  history: HistoryEntry[] | undefined,
  apparatusCode?: string
): string => {
  if (!history || !history.length) return '0.00'

  let rawHistory = history
  if (apparatusCode) {
    rawHistory = rawHistory.filter((h) => h.apparatusCode === apparatusCode || (h as any).apparatus === apparatusCode)
  }

  if (!rawHistory.length) return '0.00'

  const sum = rawHistory.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0)
  return (sum / rawHistory.length).toFixed(2)
}
