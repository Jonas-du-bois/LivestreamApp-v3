import type { HistoryEntry, HistoryPoint } from '../types/api'

/**
 * Agrége l'historique par année et calcule la moyenne des scores pour chaque année.
 * Peut optionnellement filtrer par engin (apparatusCode).
 * Retourne un tableau trié par année de manière ascendante.
 *
 * @param history Tableau des entrées d'historique brutes
 * @param apparatusCode Optionnel: code de l'engin pour filtrer
 * @returns Tableau d'historique agrégé (moyenne des scores) par année
 */
export function aggregateHistoryByYear(history: HistoryEntry[], apparatusCode?: string): HistoryPoint[] {
  if (!history || history.length === 0) return []

  let rawHistory = history

  if (apparatusCode) {
    // Backward compatibility for `apparatus` property which was used instead of `apparatusCode`
    rawHistory = rawHistory.filter(h => h.apparatusCode === apparatusCode || (h as any).apparatus === apparatusCode)
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
