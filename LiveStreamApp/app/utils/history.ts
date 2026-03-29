import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrege l'historique par annee pour le graphique, avec un filtre optionnel par agres.
 * Calcule la moyenne des scores pour chaque annee.
 * @param history Liste des entrees d'historique (HistoryEntry[])
 * @param apparatusCode Code d'agres optionnel pour filtrer les entrees
 * @returns Liste de points d'historique (HistoryPoint[]) tries par annee croissante
 */
export function aggregateHistoryByYear(history: HistoryEntry[] | undefined, apparatusCode?: string): HistoryPoint[] {
  if (!history || !history.length) return []

  let rawHistory = history

  if (apparatusCode) {
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
