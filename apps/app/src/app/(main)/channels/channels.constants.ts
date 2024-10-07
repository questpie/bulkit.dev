import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { IconType } from 'react-icons'
import {
  PiFacebookLogo,
  PiInstagramLogo,
  PiLinkedinLogo,
  PiTiktokLogo,
  PiXLogo,
  PiYoutubeLogo,
} from 'react-icons/pi'

export const PLATFORM_ICON: Record<Platform, IconType> = {
  x: PiXLogo,
  facebook: PiFacebookLogo,
  instagram: PiInstagramLogo,
  linkedin: PiLinkedinLogo,
  tiktok: PiTiktokLogo,
  youtube: PiYoutubeLogo,
}
