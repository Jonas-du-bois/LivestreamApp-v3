import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Gère le changement de langue (locale) dans l'application.
 */
export const useLocaleToggle = () => {
  const { locale, locales, setLocale } = useI18n()

  const availableLocaleCodes = computed(() =>
    locales.value
      .map((localeOption) => (typeof localeOption === 'string' ? localeOption : localeOption.code))
      .filter((code): code is string => Boolean(code))
  )

  const toggleLocale = () => {
    const codes = availableLocaleCodes.value
    if (!codes.length) return

    const currentIndex = codes.indexOf(locale.value)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % codes.length
    setLocale(codes[nextIndex]!)
  }

  return {
    availableLocaleCodes,
    toggleLocale
  }
}
