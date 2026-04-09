import type { HistoryEntry } from '../types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrége l'historique par année pour le graphique, avec un filtre optionnel par agrès.
 */
export function aggregateHistoryByYear(
  history: HistoryEntry[] | undefined,
  apparatusCode?: string
): HistoryPoint[] {
  if (!history || history.length === 0) return []

  let rawHistory = history

  if (apparatusCode) {
    rawHistory = rawHistory.filter((h) => h.apparatusCode === apparatusCode || (h as any).apparatus === apparatusCode)
  }

  const yearMap = new Map<number, { total: number; count: number }>()
  rawHistory.forEach((h) => {
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

/**
 * Calcule la note moyenne depuis un tableau de points d'historique agrégés.
 */
export function calculateAverageScore(historyPoints: HistoryPoint[]): string {
  if (!historyPoints.length) return '0.00'
  const sum = historyPoints.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0)
  return (sum / historyPoints.length).toFixed(2)
}

/**
 * Calcule la note moyenne depuis le tableau de points d'historique bruts (entrées individuelles).
 */
export function calculateAverageHistoryScore(history: HistoryEntry[] | undefined): string {
  if (!history || history.length === 0) return '0.00'
  const sum = history.reduce((acc, curr) => acc + curr.score, 0)
  return (sum / history.length).toFixed(2)
}
