import { OgCardPreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/og-card-preview'
import type { Platform } from '@bulkit/shared/constants/db.constants'
import { cn } from '@bulkit/ui/lib'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'

interface TextPreviewProps {
  text: string
  platform?: Platform
  className?: {
    root?: string
    text?: string
    mention?: string
    link?: string
  }
  customRenderers?: PartRenderer[]
}

interface PartRenderer {
  name: string
  regex: RegExp
  render: (part: string, index: number) => React.ReactNode
}

const defaultClassName = {
  mention: 'text-blue-500',
  link: 'text-blue-500 underline',
}

const defaultRenderers: PartRenderer[] = [
  {
    name: 'url',
    regex: /(https?:\/\/[^\s]+)/g,
    render: (part, index) => (
      <a
        key={index}
        href={part}
        className={defaultClassName.link}
        target='_blank'
        rel='noopener noreferrer'
      >
        {part}
      </a>
    ),
  },
  {
    name: 'mention',
    regex: /(?<=^|[^@\w])@(\w{1,15})\b/g,
    render: (part, index) => (
      <span key={index} className={defaultClassName.mention}>
        {part}
      </span>
    ),
  },
]

export function TextPreview({
  platform,
  text,
  className = defaultClassName,
  customRenderers = [],
}: TextPreviewProps) {
  const renderers = useMemo(() => [...defaultRenderers, ...customRenderers], [customRenderers])
  const [firstUrl, setFirstUrl] = useState<string | null>(null)

  const extractedParts = useMemo(() => {
    const partsByName: Record<string, string[]> = {}
    for (const renderer of renderers) {
      const matches = text.match(renderer.regex)
      if (matches) {
        partsByName[renderer.name] = matches
      }
    }
    return partsByName
  }, [text, renderers])

  useEffect(() => {
    const urlParts = extractedParts.url
    if (urlParts && urlParts.length > 0) {
      setFirstUrl(urlParts[0] ?? null)
    }
  }, [extractedParts])

  const renderParts = () => {
    let lastIndex = 0
    const result = []

    for (const renderer of renderers) {
      const matches = [...text.matchAll(renderer.regex)]
      for (const match of matches) {
        if (match.index !== undefined && match.index > lastIndex) {
          result.push(text.slice(lastIndex, match.index))
        }
        result.push(renderer.render(match[0], result.length))
        lastIndex = match.index! + match[0].length
      }
    }

    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex))
    }

    return result
  }
  return (
    <div className={cn('flex flex-col gap-4 pb-5', className.root)}>
      <p className={cn('whitespace-pre-line', className.text)}>{renderParts()}</p>

      {firstUrl && <OgCardPreview url={firstUrl} platform={platform} />}
    </div>
  )
}
