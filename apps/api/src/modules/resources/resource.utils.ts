import { injectDrive } from '@bulkit/api/drive/drive'
import { ioc, iocResolve } from '@bulkit/api/ioc'

/**
 * Automatically handles the URL generation based on the path prefix
 * @param forceSignedUrl If true, always returns a signed URL
 */
export async function getResourceUrl(props: {
  isExternal: boolean
  location: string
  expiresInSeconds?: number
  forceSignedUrl?: boolean
}) {
  const { drive } = iocResolve(ioc.use(injectDrive))

  if (props.isExternal) {
    return props.location
  }

  const isPrivate = props.forceSignedUrl ?? props.location.startsWith('private/')

  // Let the driver handle the URL generation based on the path prefix
  return isPrivate
    ? drive.getSignedUrl(props.location, { expiresIn: props.expiresInSeconds })
    : drive.getUrl(props.location)
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
