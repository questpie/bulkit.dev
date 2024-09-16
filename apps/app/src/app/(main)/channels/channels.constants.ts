import type { Platform } from '@bulkit/shared/constants/db.constants'
import type { ReactElement } from 'react'
import type { IconType } from 'react-icons'
import { FaTiktok, FaXTwitter } from 'react-icons/fa6'
import { FiFacebook, FiInstagram, FiLinkedin, FiTwitter, FiX, FiYoutube } from 'react-icons/fi'

export const CHANNEL_ICON: Record<Platform, IconType> = {
  x: FaXTwitter,
  facebook: FiFacebook,
  instagram: FiInstagram,
  linkedin: FiLinkedin,
  tiktok: FaTiktok,
  youtube: FiYoutube,
}

export const getChannelProfileUrl = (platform: Platform, username: string) => {
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${username}`
    case 'facebook':
      return `https://facebook.com/${username}`
    case 'tiktok':
      return `https://tiktok.com/@${username}`
    case 'youtube':
      return `https://youtube.com/channel/${username}`
    case 'x':
      return `https://x.com/${username}`
    case 'linkedin':
      return `https://linkedin.com/in/${username}`
  }
}
