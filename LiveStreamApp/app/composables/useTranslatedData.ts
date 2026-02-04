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
   * Formate une date selon la locale courante
   * @param dateStr - La date en ISO string
   * @param options - Options de formatage (optionnel)
   */
  const formatLocalizedDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric'
    }
    
    const localeCode = locale.value === 'de' ? 'de-CH' : 'fr-CH'
    return new Date(dateStr).toLocaleDateString(localeCode, options || defaultOptions)
  }

  /**
   * Formate une heure selon la locale courante
   * @param dateStr - La date en ISO string
   */
  const formatLocalizedTime = (dateStr: string): string => {
    const localeCode = locale.value === 'de' ? 'de-CH' : 'fr-CH'
    return new Date(dateStr).toLocaleTimeString(localeCode, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return {
    translateApparatus,
    translateDay,
    translateCategory,
    formatLocalizedDate,
    formatLocalizedTime
  }
}
