import type { HistoryEntry } from '~/types/api'

export interface HistoryPoint {
  year: number
  score: number
}

/**
 * Agrège un historique de notes par année, en calculant la moyenne des scores pour chaque année.
 * Permet un filtrage optionnel par engin.
 * Les années sont triées par ordre chronologique croissant.
 *
 * @param history - Tableau des entrées historiques
 * @param apparatusCode - (Optionnel) Code de l'engin pour filtrer les résultats
 * @returns Un tableau de points d'historique agrégés (année, score moyen)
 */
export function aggregateHistoryByYear(history: HistoryEntry[], apparatusCode?: string): HistoryPoint[] {
  if (!history || history.length === 0) return []

  let rawHistory = history

  if (apparatusCode) {
    // Dans le modèle, l'attribut est parfois 'apparatus' ou 'apparatusCode' (à vérifier selon l'usage, mais on accepte les deux si le type était incertain)
    rawHistory = rawHistory.filter((h: HistoryEntry & { apparatus?: string }) => h.apparatus === apparatusCode || h.apparatusCode === apparatusCode)
  }

  const yearMap = new Map<number, { total: number; count: number }>()

  rawHistory.forEach((h: HistoryEntry) => {
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
