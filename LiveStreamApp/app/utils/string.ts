/**
 * string.ts
 * Utilitaires purs pour la manipulation de chaînes de caractères
 */

/**
 * Récupère les initiales d'un nom complet (ex: "Jean Dupont" -> "JD")
 *
 * @param name - Le nom complet
 * @returns Les initiales du nom
 */
export const getInitials = (name: string): string => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}
