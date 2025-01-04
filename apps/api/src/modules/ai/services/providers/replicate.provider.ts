import { appLogger } from '@bulkit/shared/utils/logger'
import { HttpError } from 'elysia-http-error'
import Replicate from 'replicate'
import type { AIImageProviderAdapter } from './types'

export class ReplicateProvider implements AIImageProviderAdapter {
  private readonly client: Replicate

  constructor(apiKey: string) {
    this.client = new Replicate({
      auth: apiKey,
    })
  }

  async generateImage(
    opts: Parameters<AIImageProviderAdapter['generateImage']>[0]
  ): Promise<string> {
    try {
      const input: Record<string, string> = opts.defaultInput ?? {}

      // Map the prompt to the correct input field
      input[opts.inputMapping.prompt] = opts.prompt

      // Map the image URL if provided and supported
      if (opts.imageUrl && opts.inputMapping.image_url) {
        input[opts.inputMapping.image_url] = opts.imageUrl
      }

      const output = (await this.client.run(opts.model as `${string}/${string}`, {
        input,
      })) as any

      console.log(output)

      appLogger.info('Image generation output', output)

      if (!output) {
        throw new Error('No output from Replicate')
      }

      // The output can be either an array of strings (URLs) or an object with mapped fields
      //   const imageUrl = Array.isArray(output)
      //     ? output[0]
      //     // : (output as any)[opts.outputMapping.image_url]

      const imageUrl = output[0].url().toString()
      console.log(imageUrl.toString())

      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid output format from Replicate')
      }

      return imageUrl
    } catch (error) {
      appLogger.error('Failed to generate image with Replicate', error)
      throw HttpError.Internal('Failed to generate image')
    }
  }
}
