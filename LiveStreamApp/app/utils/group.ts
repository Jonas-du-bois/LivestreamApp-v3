import type { HistoryEntry } from '~/types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Extracts the initials from a given name string.
 * e.g., "John Doe" -> "JD"
 */
export const getInitials = (name?: string): string => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}

/**
 * Aggregates a list of history entries by year, calculating the average score per year.
 * Optionally filters by apparatus code.
 */
export const aggregateHistoryByYear = (history?: HistoryEntry[], apparatusCode?: string): HistoryPoint[] => {
  if (!history || history.length === 0) return []

  let rawHistory = history

  if (apparatusCode) {
    // Note: the field on HistoryEntry is 'apparatusCode', but GroupDetailsModal was checking 'apparatus'.
    // We should allow filtering on either 'apparatus' or 'apparatusCode' if the data is inconsistent,
    // but the type definition says 'apparatusCode'. We'll check both just in case.
    rawHistory = rawHistory.filter(h => (h.apparatusCode || (h as any).apparatus) === apparatusCode)
  }

  const yearMap = new Map<number, { total: number; count: number }>()

  rawHistory.forEach(h => {
     if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 })
     const entry = yearMap.get(h.year)!
     entry.total += h.score
     entry.count++
  })

  const aggregated: HistoryPoint[] = Array.from(yearMap.entries()).map(([year, data]) => ({
    year,
    score: data.total / data.count
  }))

  return aggregated.sort((a, b) => a.year - b.year)
}
