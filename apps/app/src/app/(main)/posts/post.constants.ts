import type { PostType } from '@bulkit/shared/constants/db.constants'
import type { IconType } from 'react-icons'
import { FaPhotoFilm } from 'react-icons/fa6'
import { PiCamera, PiFilmReel, PiNeedle, PiNote } from 'react-icons/pi'

export const POST_TYPE_ICON: Record<PostType, IconType> = {
  post: PiNote,
  short: PiFilmReel,
  thread: PiNeedle,
  story: PiCamera,
}
