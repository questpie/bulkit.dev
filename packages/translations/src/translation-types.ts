import type { LeafPaths } from '@bulkit/shared/types/data'
import type { allTranslations } from '@bulkit/translations/index'

export type TranslationsRaw = keyof (typeof allTranslations)['en']

export type TranslationKey = LeafPaths<TranslationsRaw>
