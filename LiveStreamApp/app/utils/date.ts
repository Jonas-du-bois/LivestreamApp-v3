export const formatTime = (isoOrTimestamp: string | number | Date, locale: string = 'fr'): string => {
  const d = new Date(isoOrTimestamp)
  const loc = locale === 'de' ? 'de-CH' : locale === 'it' ? 'it-CH' : 'fr-CH'
  return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
}

export const formatDateTime = (isoOrTimestamp: string | number | Date, locale: string = 'fr'): string => {
  const d = new Date(isoOrTimestamp)
  const loc = locale === 'de' ? 'de-CH' : locale === 'it' ? 'it-CH' : 'fr-CH'
  return d.toLocaleString(loc, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
