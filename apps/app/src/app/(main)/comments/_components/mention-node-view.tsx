'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { Badge } from '@bulkit/ui/components/ui/badge'

interface MentionNodeViewProps {
  node: {
    attrs: {
      id: string
      label: string
      mentionType: 'user' | 'agent' | 'post' | 'media'
    }
  }
}

export function MentionNodeView({ node }: MentionNodeViewProps) {
  const { mentionType, label } = node.attrs

  const getMentionIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤'
      case 'agent':
        return '🤖'
      case 'post':
        return '📝'
      case 'media':
        return '📎'
      default:
        return '@'
    }
  }

  const getMentionColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'agent':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'post':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
      case 'media':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <NodeViewWrapper className='inline'>
      <Badge
        variant='secondary'
        className={`${getMentionColor(mentionType)} cursor-pointer transition-colors duration-200`}
      >
        {getMentionIcon(mentionType)}@{label}
      </Badge>
    </NodeViewWrapper>
  )
}
