import type { PostType } from '@bulkit/shared/constants/db.constants'
import type { IconType } from 'react-icons'
import { BsFileEarmarkRichtext } from 'react-icons/bs'
import { FaPhotoFilm, FaRegCommentDots } from 'react-icons/fa6'
import { PiFilmReel } from 'react-icons/pi'

export const POST_TYPE_ICON: Record<PostType, IconType> = {
  post: BsFileEarmarkRichtext,
  short: PiFilmReel,
  thread: FaRegCommentDots,
  story: FaPhotoFilm,
}
