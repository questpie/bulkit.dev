import { drive } from '@bulkit/api/drive/drive'

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
  return resource.isExternal
    ? resource.location
    : resource.isPrivate
      ? drive.use().getSignedUrl(resource.location, {
          expiresIn: resource.expiresInSeconds || 60 * 60 * 24,
        })
      : drive.use().getUrl(resource.location)
}
