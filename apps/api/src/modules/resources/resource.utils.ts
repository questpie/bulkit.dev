import { injectDrive } from '@bulkit/api/drive/drive'
import { ioc, iocResolve } from '@bulkit/api/ioc'

// TODO: think about when is fine to use this and when to use signed urls and implements the signed urls
export async function getResourcePublicUrl(resource: {
  isExternal: boolean
  location: string
  isPrivate?: boolean
  /**
   * Default is 1 day
   */
  expiresInSeconds?: number
}) {
  const { drive } = iocResolve(ioc.use(injectDrive))

  return resource.isExternal
    ? resource.location
    : resource.isPrivate
      ? drive.getSignedUrl(resource.location, {
          expiresIn: resource.expiresInSeconds || 60 * 60 * 24,
        })
      : drive.getUrl(resource.location)
}

export function isMediaTypeAllowed(allowedMediaTypes: string[], mediaType: string): boolean {
  // Handle cases where mediaType might be null or undefined
  if (!mediaType) return false

  return allowedMediaTypes.some((allowedType) => {
    // Convert to lowercase for case-insensitive comparison
    const normalizedAllowedType = allowedType.toLowerCase()
    const normalizedMediaType = mediaType.toLowerCase()

    // Handle wildcards, e.g. "image/*" matches "image/png"
    if (normalizedAllowedType.endsWith('/*')) {
      const allowedPrefix = normalizedAllowedType.slice(0, -2)
      return normalizedMediaType.startsWith(allowedPrefix)
    }

    // Exact match
    return normalizedAllowedType === normalizedMediaType
  })
}
