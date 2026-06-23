// ⚡ Bolt: Global cache to avoid Intl.DateTimeFormat instantiation per call
const formatterCache = new Map<string, Intl.DateTimeFormat>()

/**
 * Traduction des données dynamiques (engins, jours, catégories)
 * et formatage des dates/heures selon la locale Suisse courante.
 */
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

  // ⚡ Bolt: helper to safely get and format timestamps
  const formatWithCache = (dateInput: string | number | Date, options: Intl.DateTimeFormatOptions): string => {
    const time = typeof dateInput === 'string'
      ? Date.parse(dateInput)
      : typeof dateInput === 'number'
        ? dateInput
        // @ts-ignore
        : dateInput.getTime ? dateInput.getTime()
        : new Date(dateInput).getTime()

    if (Number.isNaN(time)) return 'Invalid Date'

    const localeCode = getLocaleCode()
    const cacheKey = `${localeCode}-${JSON.stringify(options)}`

    let formatter = formatterCache.get(cacheKey)
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(localeCode, options)
      formatterCache.set(cacheKey, formatter)
    }

    return formatter.format(time)
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
    return formatWithCache(dateInput, finalOptions)
  }

  /** Formate une heure (HH:MM) selon la locale Suisse courante */
  const formatLocalizedTime = (dateInput: string | number | Date): string => {
    return formatWithCache(dateInput, {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Zurich'
    })
  }

  /** Formate une date + heure complète selon la locale Suisse courante */
  const formatLocalizedDateTime = (dateInput: string | number | Date): string => {
    return formatWithCache(dateInput, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Zurich'
    })
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
