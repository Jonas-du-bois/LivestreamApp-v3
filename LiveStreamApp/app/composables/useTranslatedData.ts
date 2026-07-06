/**
 * Traduction des données dynamiques (engins, jours, catégories)
 * et formatage des dates/heures selon la locale Suisse courante.
 */

// ⚡ Bolt: Module-scoped cache for Intl.DateTimeFormat instances to prevent expensive re-allocations during list rendering
const dateTimeFormatCache = new Map<string, Intl.DateTimeFormat>()

function getCachedFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}-${JSON.stringify(options)}`
  let formatter = dateTimeFormatCache.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    dateTimeFormatCache.set(key, formatter)
  }
  return formatter
}

// ⚡ Bolt: Extracts timestamps efficiently without needlessly allocating new Date objects
function getSafeTimestamp(dateInput: string | number | Date): number {
  if (typeof dateInput === 'string') {
    return Date.parse(dateInput)
  }
  if (typeof dateInput === 'number') {
    return dateInput
  }
  // @ts-ignore
  if (dateInput?.getTime) {
    // @ts-ignore
    return dateInput.getTime()
  }
  return new Date(dateInput).getTime()
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
  // ⚡ Bolt Optimization: Uses cached Intl.DateTimeFormat and avoids Date object allocation
  const formatLocalizedDate = (dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric'
    }
    
    const finalOptions: Intl.DateTimeFormatOptions = {
      ...(options || defaultOptions),
      timeZone: 'Europe/Zurich'
    }
    const ts = getSafeTimestamp(dateInput)
    if (Number.isNaN(ts)) return 'Invalid Date'
    return getCachedFormatter(getLocaleCode(), finalOptions).format(ts)
  }

  /** Formate une heure (HH:MM) selon la locale Suisse courante */
  // ⚡ Bolt Optimization: Uses cached Intl.DateTimeFormat and avoids Date object allocation
  const formatLocalizedTime = (dateInput: string | number | Date): string => {
    const ts = getSafeTimestamp(dateInput)
    if (Number.isNaN(ts)) return 'Invalid Date'
    return getCachedFormatter(getLocaleCode(), {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Zurich'
    }).format(ts)
  }

  /** Formate une date + heure complète selon la locale Suisse courante */
  // ⚡ Bolt Optimization: Uses cached Intl.DateTimeFormat and avoids Date object allocation
  const formatLocalizedDateTime = (dateInput: string | number | Date): string => {
    const ts = getSafeTimestamp(dateInput)
    if (Number.isNaN(ts)) return 'Invalid Date'
    return getCachedFormatter(getLocaleCode(), {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Zurich'
    }).format(ts)
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
