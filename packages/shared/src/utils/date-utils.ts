type GetRelativeTimeStringOpts = {
  date: Date
  from?: Date
  unit?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'auto'
}

export function getRelativeTimeString({
  date,
  from = new Date(),
  unit = 'auto',
}: GetRelativeTimeStringOpts): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffInSeconds = (from.getTime() - date.getTime()) / 1000
  const absDiff = Math.abs(diffInSeconds)

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]

  if (unit === 'auto') {
    for (const [unitName, unitSeconds] of units) {
      if (absDiff >= unitSeconds || unitName === 'second') {
        const value = Math.round(absDiff / unitSeconds)
        return rtf.format(-value, unitName)
      }
    }
  } else {
    const unitSeconds = units.find(([unitName]) => unitName === unit)?.[1] ?? 1
    const value = Math.round(diffInSeconds / unitSeconds)
    return rtf.format(-value, unit)
  }

  return rtf.format(0, 'second')
}
