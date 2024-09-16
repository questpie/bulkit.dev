import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { ReactElement } from 'react'
import type { IconType } from 'react-icons'
import { FaTiktok } from 'react-icons/fa6'
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter, FiX, FiYoutube } from 'react-icons/fi'

export const CHANNEL_ICON: Record<Platform, IconType> = {
  x: FiTwitter,
  facebook: FiFacebook,
  instagram: FiInstagram,
  linkedin: FiLinkedin,
  tiktok: FaTiktok,
  youtube: FiYoutube,
}
