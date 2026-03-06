/**
 * Composable pour traduire les données dynamiques de la base de données
 * Utilise les codes des engins et les noms de jours pour retourner les traductions
 */
export const useTranslatedData = () => {
  const { t, locale } = useI18n()

  /**
   * Traduit le nom d'un engin basé sur son code
   * @param code - Le code de l'engin (ex: "SO", "BP", "CE")
   * @param fallbackName - Le nom par défaut si la traduction n'existe pas
   */
  const translateApparatus = (code: string | undefined, fallbackName?: string): string => {
    if (!code) return fallbackName || ''
    
    const translationKey = `apparatus.${code}`
    const translated = t(translationKey)
    
    // Si la traduction retourne la clé elle-même, utiliser le fallback
    if (translated === translationKey) {
      return fallbackName || code
    }
    
    return translated
  }

  /**
   * Traduit un nom de jour (en français minuscule) vers la langue courante
   * @param dayName - Le nom du jour en français (ex: "samedi", "dimanche")
   */
  const translateDay = (dayName: string | undefined): string => {
    if (!dayName) return ''
    
    const normalizedDay = dayName.toLowerCase().trim()
    const translationKey = `days.${normalizedDay}`
    const translated = t(translationKey)
    
    // Si la traduction retourne la clé elle-même, retourner le jour capitalisé
    if (translated === translationKey) {
      return dayName.charAt(0).toUpperCase() + dayName.slice(1)
    }
    
    return translated
  }

  /**
   * Traduit une catégorie (ACTIFS, MIXTE)
   * @param category - La catégorie (ex: "ACTIFS", "MIXTE")
   */
  const translateCategory = (category: string | undefined): string => {
    if (!category) return ''
    
    const translationKey = `categories.${category}`
    const translated = t(translationKey)
    
    if (translated === translationKey) {
      return category
    }
    
    return translated
  }

  /**
   * Retourne le code locale Suisse approprié
   */
  const getLocaleCode = (): string => {
    if (locale.value === 'de') return 'de-CH'
    if (locale.value === 'it') return 'it-CH'
    return 'fr-CH'
  }

  /**
   * Formate une date selon la locale courante
   * @param dateInput - La date (ISO string, timestamp, ou objet Date)
   * @param options - Options de formatage (optionnel)
   */
  const formatLocalizedDate = (dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric'
    }
    
    const finalOptions: Intl.DateTimeFormatOptions = {
      ...(options || defaultOptions),
      timeZone: 'Europe/Zurich'
    }
    return new Date(dateInput).toLocaleDateString(getLocaleCode(), finalOptions)
  }

  /**
   * Formate une heure selon la locale courante
   * @param dateInput - La date (ISO string, timestamp, ou objet Date)
   */
  const formatLocalizedTime = (dateInput: string | number | Date): string => {
    return new Date(dateInput).toLocaleTimeString(getLocaleCode(), {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/Zurich'
    })
  }

  /**
   * Formate une date et heure selon la locale courante
   * @param dateInput - La date (ISO string, timestamp, ou objet Date)
   */
  const formatLocalizedDateTime = (dateInput: string | number | Date): string => {
    return new Date(dateInput).toLocaleString(getLocaleCode(), {
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
