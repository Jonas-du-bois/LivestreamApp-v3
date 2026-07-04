/**
 * Traduction des données dynamiques (engins, jours, catégories)
 * et formatage des dates/heures selon la locale Suisse courante.
 */
// ⚡ Bolt: Cache Intl.DateTimeFormat instances outside the composable
// to avoid recreating them on every component mount and function call
const formatterCache = new Map<string, Intl.DateTimeFormat>()

const getCachedFormatter = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const key = `${locale}-${JSON.stringify(options)}`
  let formatter = formatterCache.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    formatterCache.set(key, formatter)
  }
  return formatter
}

// ⚡ Bolt: Helper to extract timestamp efficiently without Date object allocation
const getTimestamp = (val: string | number | Date): number => {
  return typeof val === 'string' ? Date.parse(val) : (val as any).getTime ? (val as any).getTime() : new Date(val).getTime()
}

export const useTranslatedData = () => {
  const { t, locale } = useI18n()

  /** Traduit un engin par son code (ex: "SO" → "Sol") */
  const translateApparatus = (code: string | undefined, fallbackName?: string): string => {
    if (!code) return fallbackName || ''

    const translationKey = `apparatus.${code}`
    const translated = t(translationKey)

    // Si i18n retourne la clé brute, la traduction n'existe pas
    return translated === translationKey ? (fallbackName || code) : translated
  }

  /** Traduit un nom de jour français (ex: "samedi") vers la locale courante */
  const translateDay = (dayName: string | undefined): string => {
    if (!dayName) return ''

    const normalizedDay = dayName.toLowerCase().trim()
    const translationKey = `days.${normalizedDay}`
    const translated = t(translationKey)

    return translated === translationKey
      ? dayName.charAt(0).toUpperCase() + dayName.slice(1)
      : translated
  }

  /** Traduit une catégorie (ex: "ACTIFS", "MIXTE") */
  const translateCategory = (category: string | undefined): string => {
    if (!category) return ''

    const translationKey = `categories.${category}`
    const translated = t(translationKey)

    return translated === translationKey ? category : translated
  }

  /** Mappe la locale Vue i18n vers la locale Suisse correspondante */
  const getLocaleCode = (): string => {
    if (locale.value === 'de') return 'de-CH'
    if (locale.value === 'it') return 'it-CH'
    return 'fr-CH'
  }

  /** Formate une date selon la locale Suisse courante */
  const formatLocalizedDate = (dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric'
    }
    
    const finalOptions: Intl.DateTimeFormatOptions = {
      ...(options || defaultOptions),
      timeZone: 'Europe/Zurich'
    }
    // ⚡ Bolt: Use cached Intl.DateTimeFormat for performance
    const timestamp = getTimestamp(dateInput)
    if (Number.isNaN(timestamp)) return 'Invalid Date'
    return getCachedFormatter(getLocaleCode(), finalOptions).format(timestamp)
  }

  /** Formate une heure (HH:MM) selon la locale Suisse courante */
  const formatLocalizedTime = (dateInput: string | number | Date): string => {
    const finalOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Zurich'
    }
    // ⚡ Bolt: Use cached Intl.DateTimeFormat for performance
    const timestamp = getTimestamp(dateInput)
    if (Number.isNaN(timestamp)) return 'Invalid Date'
    return getCachedFormatter(getLocaleCode(), finalOptions).format(timestamp)
  }

  /** Formate une date + heure complète selon la locale Suisse courante */
  const formatLocalizedDateTime = (dateInput: string | number | Date): string => {
    const finalOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Zurich'
    }
    // ⚡ Bolt: Use cached Intl.DateTimeFormat for performance
    const timestamp = getTimestamp(dateInput)
    if (Number.isNaN(timestamp)) return 'Invalid Date'
    return getCachedFormatter(getLocaleCode(), finalOptions).format(timestamp)
  }

  return {
    translateApparatus,
    translateDay,
    translateCategory,
    formatLocalizedDate,
    formatLocalizedTime,
    formatLocalizedDateTime
  }
}
