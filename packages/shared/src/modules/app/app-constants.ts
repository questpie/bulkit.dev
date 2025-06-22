export const DEPLOYMENT_TYPES = ['cloud', 'self-hosted'] as const
export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number]

export const STOCK_IMAGE_PROVIDER_TYPES = ['pixabay', 'unsplash'] as const
export type StockImageProviderType = (typeof STOCK_IMAGE_PROVIDER_TYPES)[number]

export const AI_TEXT_CAPABILITIES = [
  'fast-completion', // For very quick responses and inferences, like classification, sentiment analysis, etc. eg (llama 3.1), used for quick insights, scheduling, etc.
  'general-purpose', // For conversational AI, should be the most human-like (Claude Sonnet, GPT-4o), used for text improvements, post creation, tool usage, etc.
  'embedding', // For vector embeddings eg (text-embedding-3-small), used for semantic search, clustering, etc.
] as const

export const AI_TEXT_PROVIDER_TYPES = ['anthropic', 'openai'] as const
export type AITextProviderType = (typeof AI_TEXT_PROVIDER_TYPES)[number]

export const AI_IMAGE_PROVIDER_TYPES = ['openai', 'google-vertex'] as const
export type AIImageProviderType = (typeof AI_IMAGE_PROVIDER_TYPES)[number]

// Enhanced AI image capabilities
export const AI_IMAGE_CAPABILITIES = [
  'text-to-image',
  'image-to-image', // General image-to-image generation (using input image + prompt)
  'image-editing', // Image editing with masks (inpainting/outpainting)
  'image-variations', // Generate variations of an existing image
  // 'style-transfer', // For applying artistic styles to images
  // 'image-upscaling', // For improving image resolution and quality
  // 'background-removal', // For isolating subjects from backgrounds
] as const
export type AIImageCapability = (typeof AI_IMAGE_CAPABILITIES)[number]

// // Video generation support
// export const AI_VIDEO_PROVIDER_TYPES = ['google-veo'] as const
// export type AIVideoProviderType = (typeof AI_VIDEO_PROVIDER_TYPES)[number]

// export const AI_VIDEO_CAPABILITIES = ['text-to-video', 'image-to-video'] as const

// TODO: think about this more
// export const SUPPORTED_AI_IMAGE_MODELS: Record<AIImageProviderType, ImageModelConfig[]> = {
//   replicate: [
//     {
//       // https://replicate.com/black-forest-labs/flux-schnell
//       name: 'black-forest-labs/flux-schnell',
//       capabilities: ['text-to-image'],
//       inputMapping: {
//         image_url: 'image_prompt',
//         prompt: 'prompt',
//       },
//       outputMapping: {
//         image_url: 'image',
//       },
//     },
//     {
//       // https://replicate.com/black-forest-labs/flux-1.1-pro-ultra
//       name: 'black-forest-labs/flux-1.1-pro-ultra',
//       capabilities: ['text-to-image', 'image-to-image'],
//       inputMapping: {
//         image_url: 'image_prompt',
//         prompt: 'prompt',
//       },
//       outputMapping: {
//         image_url: 'image',
//       },
//     },
//   ],
// }
