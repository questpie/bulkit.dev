import type { LeafPaths } from '@questpie/shared/types/data'

export type TranslationsRaw = typeof import('./static/en.json')

export type TranslationKey = LeafPaths<TranslationsRaw>
