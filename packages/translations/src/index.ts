import de from './i18n/de/translations.json'
import en from './i18n/en/translations.json'

export const allTranslations = {
  en,
  de,
}

export const SUPPORTED_LOCALES = Object.keys(allTranslations) as SupportedLocale[]
export type SupportedLocale = keyof typeof allTranslations
