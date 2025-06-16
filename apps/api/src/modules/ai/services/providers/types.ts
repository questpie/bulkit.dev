import type {
  AIImageModelInputMapping,
  AIImageModelOutputMapping,
} from '@bulkit/shared/modules/admin/schemas/ai-image-providers.schemas'

export interface AIImageProviderAdapter {
  generateImage(opts: {
    prompt: string
    imageUrl?: string
    model: string
    inputMapping: AIImageModelInputMapping
    // outputMapping: AIImageModelOutputMapping
    defaultInput: Record<string, any> | null
  }): Promise<string>
}
