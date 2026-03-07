import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrège un historique de notes par année et calcule la moyenne.
 * Peut optionnellement filtrer par agrès.
 *
 * @param history - Liste des entrées de l'historique.
 * @param apparatusCode - Code de l'agrès optionnel pour filtrer les notes.
 * @returns Un tableau de points d'historique (année, score moyen) trié par année croissante.
 */
export function aggregateHistoryByYear(
  history: (HistoryEntry | { year: number; score: number; apparatus?: string })[] | undefined,
  apparatusCode?: string
): HistoryPoint[] {
  if (!history || !history.length) return []

  let filteredHistory = history

  if (apparatusCode) {
    filteredHistory = filteredHistory.filter(h => {
      // Gère à la fois HistoryEntry (qui a apparatusCode) et l'historique du GroupDetailsResponse (qui a apparatus)
      const code = 'apparatusCode' in h ? h.apparatusCode : h.apparatus
      return code === apparatusCode
    })
  }

  const yearMap = new Map<number, { total: number; count: number }>()

  filteredHistory.forEach(h => {
    if (!yearMap.has(h.year)) {
      yearMap.set(h.year, { total: 0, count: 0 })
    }
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

/**
 * Calcule la note moyenne pour une liste d'objets possédant une propriété 'score'.
 *
 * @param list - Liste d'éléments contenant au moins une propriété 'score'.
 * @returns La note moyenne calculée (un nombre).
 */
export function calculateAverageScore(list: { score: number }[] | undefined): number {
  if (!list || !list.length) return 0

  const sum = list.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0)
  return sum / list.length
}
