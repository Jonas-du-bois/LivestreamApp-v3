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

  // Cache formatters to avoid memory allocation and CPU spikes
  const dateFormatter = computed(() => new Intl.DateTimeFormat(getLocaleCode(), {
    weekday: 'long',
    day: 'numeric',
    timeZone: 'Europe/Zurich'
  }))

  const timeFormatter = computed(() => new Intl.DateTimeFormat(getLocaleCode(), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich'
  }))

  const dateTimeFormatter = computed(() => new Intl.DateTimeFormat(getLocaleCode(), {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Zurich'
  }))

  /** Formate une date selon la locale Suisse courante */
  const formatLocalizedDate = (dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const timestamp = typeof dateInput === 'string' ? Date.parse(dateInput) : (dateInput as any).getTime ? (dateInput as any).getTime() : new Date(dateInput).getTime()
    if (options) {
      // Fallback for custom options
      return new Intl.DateTimeFormat(getLocaleCode(), {
        ...options,
        timeZone: 'Europe/Zurich'
      }).format(timestamp)
    }
    return dateFormatter.value.format(timestamp)
  }

  /** Formate une heure (HH:MM) selon la locale Suisse courante */
  const formatLocalizedTime = (dateInput: string | number | Date): string => {
    const timestamp = typeof dateInput === 'string' ? Date.parse(dateInput) : (dateInput as any).getTime ? (dateInput as any).getTime() : new Date(dateInput).getTime()
    return timeFormatter.value.format(timestamp)
  }

  /** Formate une date + heure complète selon la locale Suisse courante */
  const formatLocalizedDateTime = (dateInput: string | number | Date): string => {
    const timestamp = typeof dateInput === 'string' ? Date.parse(dateInput) : (dateInput as any).getTime ? (dateInput as any).getTime() : new Date(dateInput).getTime()
    return dateTimeFormatter.value.format(timestamp)
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
