import type { HistoryEntry } from '~/types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrége l'historique par année et calcule la moyenne des scores,
 * avec un filtre optionnel par agrès.
 *
 * @param history - L'historique des passages (tableau d'HistoryEntry)
 * @param apparatusCode - (Optionnel) Le code de l'agrès pour filtrer
 * @returns Un tableau de points d'historique (année, score moyen), trié par année croissante
 */
export const aggregateHistoryByYear = (
  history: HistoryEntry[],
  apparatusCode?: string
): HistoryPoint[] => {
  if (!history || history.length === 0) return []

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
