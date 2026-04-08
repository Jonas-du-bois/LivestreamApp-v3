import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Extrait les initiales d'un nom (par exemple, pour un coach ou moniteur).
 */
export const getInitials = (name: string): string => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}

/**
 * Agrège l'historique par année pour le graphique, en effectuant une moyenne des scores par année.
 * Permet un filtre optionnel par agrès (gère `apparatus` et `apparatusCode`).
 */
export const aggregateHistoryByYear = (history?: HistoryEntry[], apparatusCode?: string): HistoryPoint[] => {
  if (!history || !Array.isArray(history) || history.length === 0) return []

  let rawHistory = history

  if (apparatusCode) {
    rawHistory = rawHistory.filter(h => h.apparatus === apparatusCode || h.apparatusCode === apparatusCode)
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
