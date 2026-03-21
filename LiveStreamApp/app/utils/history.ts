import type { HistoryEntry } from '~/types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrège un historique de notes par année pour le graphique.
 * Calcule la moyenne des scores pour chaque année et trie par année croissante.
 */
export const computeHistoryByYear = (history?: HistoryEntry[]): HistoryPoint[] => {
  if (!history || history.length === 0) return []

  const yearMap = new Map<number, { total: number; count: number }>()

  history.forEach(h => {
    if (!yearMap.has(h.year)) yearMap.set(h.year, { total: 0, count: 0 })
    const entry = yearMap.get(h.year)!
    entry.total += h.score
    entry.count++
  })

  return Array.from(yearMap.entries())
    .map(([year, data]) => ({
      year,
      score: data.total / data.count
    }))
    .sort((a, b) => a.year - b.year)
}
