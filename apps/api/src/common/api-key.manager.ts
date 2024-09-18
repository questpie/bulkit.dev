import { envApi } from '@bulkit/api/envApi'
import crypto from 'node:crypto'

class ApiKeyManager {
  // If error handling is ever needed
  static INVALID_KEY_ERROR_CODE = 'INVALID_KEY'
  static ENCRYPTION_ERROR_CODE = 'ENCRYPTION_FAILED'
  static DECRYPTION_ERROR_CODE = 'DECRYPTION_FAILED'

  // the IV_LENGTH is fixed at 16 bytes because it is the block size for AES-256-CBC
  readonly #IV_LENGTH = 16
  // This must be 32 bytes, we are ensuring this with validation inside envApi
  readonly #ENCRYPTION_KEY: Buffer

  constructor() {
    this.#ENCRYPTION_KEY = Buffer.from(envApi.API_KEY_ENCRYPTION_SECRET, 'hex')
  }

  encrypt(apiKey: string): string {
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      throw new Error('Invalid API key format', { cause: ApiKeyManager.INVALID_KEY_ERROR_CODE })
    }

    try {
      const iv = crypto.randomBytes(this.#IV_LENGTH)
      const cipher = crypto.createCipheriv('aes-256-cbc', this.#ENCRYPTION_KEY, iv)
      let encrypted = cipher.update(apiKey, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      return `${iv.toString('hex')}:${encrypted}`
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          cause: ApiKeyManager.ENCRYPTION_ERROR_CODE,
        }
      )
    }
  }

  decrypt(encryptedApiKey: string): string {
    if (typeof encryptedApiKey !== 'string' || !encryptedApiKey.includes(':')) {
      throw new Error('Invalid encrypted API key format', {
        cause: ApiKeyManager.INVALID_KEY_ERROR_CODE,
      })
    }

    try {
      const [ivHex, encryptedHex] = encryptedApiKey.split(':')
      const iv = Buffer.from(ivHex!, 'hex')
      const encryptedText = Buffer.from(encryptedHex!, 'hex')
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.#ENCRYPTION_KEY, iv)
      let decrypted = decipher.update(encryptedText)
      decrypted = Buffer.concat([decrypted, decipher.final()])
      return decrypted.toString('utf8')
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
        {
          cause: ApiKeyManager.DECRYPTION_ERROR_CODE,
        }
      )
    }
  }
}

export const apiKeyManager = new ApiKeyManager()
