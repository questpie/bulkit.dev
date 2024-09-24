import en from './i18n/en/translations.json'

export const allTranslations = {
  en,
}

export const SUPPORTED_LOCALES = Object.keys(allTranslations) as SupportedLocale[]
export type SupportedLocale = keyof typeof allTranslations
