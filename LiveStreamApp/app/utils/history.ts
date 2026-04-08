import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

export const aggregateHistoryByYear = (history: HistoryEntry[] | undefined, apparatusCode?: string): HistoryPoint[] => {
  if (!history) return []

  let rawHistory = history

  if (apparatusCode) {
    rawHistory = rawHistory.filter(h => h.apparatus === apparatusCode)
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
