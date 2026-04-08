export const getInitials = (name: string) => {
  if (!name) return ''
  return name.split(' ').map((n: string) => n[0]).join('')
}
