import { useCallback, useRef } from 'react'

type LongPressOptions = {
  delay?: number
  onLongPress: () => void
  onClick?: () => void
}

export function useLongPress({ delay = 500, onLongPress, onClick }: LongPressOptions) {
  const timeoutRef = useRef<Timer>()
  const isLongPress = useRef(false)

  const start = useCallback(() => {
    isLongPress.current = false
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current)
    if (!isLongPress.current && onClick) {
      onClick()
    }
  }, [onClick])

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
  }
}
