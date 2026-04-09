/**
 * Extrait les initiales d'un nom complet.
 * @param name Le nom complet (ex: "Jean Dupont")
 * @returns Les initiales (ex: "JD")
 */
export function getInitials(name: string | undefined): string {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}
