import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrège un tableau d'historique (HistoryEntry[]) en faisant la moyenne des scores par année.
 * Peut être filtré optionnellement par code d'agrès (apparatusCode).
 *
 * @param history Tableau des entrées d'historique brutes
 * @param apparatusCode (Optionnel) Code de l'agrès pour filtrer les données
 * @returns Un tableau de points ({ year, score }) trié par année croissante
 */
export function aggregateHistoryByYear(history: HistoryEntry[] | undefined, apparatusCode?: string): HistoryPoint[] {
  if (!history || !history.length) return []

  let rawHistory = history

  if (apparatusCode) {
    // Si l'entrée historique a un champ 'apparatus' ou 'apparatusCode', on filtre dessus.
    rawHistory = rawHistory.filter(h =>
      // Some parts of the codebase use 'apparatus', others 'apparatusCode'. Handle both just in case.
      (h as any).apparatus === apparatusCode || h.apparatusCode === apparatusCode
    )
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
