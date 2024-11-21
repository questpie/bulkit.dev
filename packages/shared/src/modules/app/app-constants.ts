export const DEPLOYMENT_TYPES = ['cloud', 'self-hosted'] as const
export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number]

export const STOCK_IMAGE_PROVIDER_TYPES = ['pixabay', 'unsplash'] as const
export type StockImageProviderType = (typeof STOCK_IMAGE_PROVIDER_TYPES)[number]

export const AI_TEXT_PROVIDER_TYPES = ['anthropic', 'openai', 'mistral'] as const
export type AITextProviderType = (typeof AI_TEXT_PROVIDER_TYPES)[number]
