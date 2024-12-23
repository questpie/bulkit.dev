import { createHash } from 'node:crypto'
import { UAParser } from 'ua-parser-js'

const UNKNOWN = 'unknown' as const

export type DeviceInfo = {
  browser: string
  os: string
  device: string
}

export function getDeviceInfo(request: Request): {
  deviceFingerprint: string
  deviceInfo: DeviceInfo
} {
  const country = extractCountry(request)
  const userAgent = request.headers.get('user-agent') ?? ''
  const language = request.headers.get('accept-language') ?? ''
  const uaParser = new UAParser(userAgent)

  const deviceFingerprint = createHash('sha256')
    .update(
      `${userAgent}${language}${country}${request.headers.get('sec-ch-ua') ?? ''}${request.headers.get('sec-ch-ua-platform') ?? ''}`
    )
    .digest('hex')

  const deviceInfo: DeviceInfo = {
    browser: uaParser.getBrowser().name ?? UNKNOWN,
    os: uaParser.getOS().name ?? UNKNOWN,
    device: uaParser.getDevice().type ?? 'desktop',
  }

  return { deviceFingerprint, deviceInfo }
}

function extractCountry(request: Request): string {
  // Try Cloudflare header first
  const cfCountry = request.headers.get('cf-ipcountry')
  if (cfCountry) return cfCountry

  // Try other common headers
  const xGeoCountry = request.headers.get('x-geo-country')
  if (xGeoCountry) return xGeoCountry

  const xCountryCode = request.headers.get('x-country-code')
  if (xCountryCode) return xCountryCode

  // Extract country from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const country = acceptLanguage.split(',')[0]?.split('-')[1]
    if (country && country.length === 2) return country.toUpperCase()
  }

  return UNKNOWN
}
