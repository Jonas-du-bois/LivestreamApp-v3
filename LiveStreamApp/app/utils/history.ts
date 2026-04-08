import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrège un tableau d'historique en moyennant les scores par année,
 * et retourne un tableau trié chronologiquement.
 */
export const aggregateHistoryByYear = (history: HistoryEntry[] | undefined): HistoryPoint[] => {
  if (!history || history.length === 0) return []

  const yearMap = new Map<number, { total: number; count: number }>()

  history.forEach(h => {
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
 * Calcule la moyenne globale d'un tableau d'historique brut.
 * Retourne la moyenne sous forme de chaîne formatée à 2 décimales.
 */
export const calculateAverageScore = (history: HistoryEntry[] | undefined): string => {
  if (!history || history.length === 0) return '0.00'
  const sum = history.reduce((acc: number, curr: HistoryEntry) => acc + curr.score, 0)
  return (sum / history.length).toFixed(2)
}

/**
 * Calcule la moyenne d'un tableau de points d'historique agrégés.
 * Retourne la moyenne sous forme de chaîne formatée à 2 décimales.
 */
export const calculateAggregatedAverageScore = (points: HistoryPoint[] | undefined): string => {
  if (!points || points.length === 0) return '0.00'
  const sum = points.reduce((acc: number, curr: HistoryPoint) => acc + (Number(curr.score) || 0), 0)
  return (sum / points.length).toFixed(2)
}
