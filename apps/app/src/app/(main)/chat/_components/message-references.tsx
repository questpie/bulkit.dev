'use client'

import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { 
  FileText, 
  CheckSquare, 
  User, 
  Image, 
  Hash, 
  Radio,
  ExternalLink,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { SmartReference } from '@bulkit/shared/modules/chat/chat.schemas'
import { EntityPreview } from './entity-preview'

interface MessageReferencesProps {
  references: SmartReference[]
  className?: string
}

const referenceIcons = {
  post: FileText,
  task: CheckSquare,
  user: User,
  media: Image,
  label: Hash,
  channel: Radio,
}

const referenceColors = {
  post: 'bg-blue-500',
  task: 'bg-green-500', 
  user: 'bg-purple-500',
  media: 'bg-orange-500',
  label: 'bg-pink-500',
  channel: 'bg-indigo-500',
}

export function MessageReferences({ references, className }: MessageReferencesProps) {
  const handleReferenceClick = (reference: SmartReference) => {
    // Navigate to the referenced entity
    const routes = {
      post: `/posts/${reference.id}`,
      task: `/tasks/${reference.id}`,
      user: `/users/${reference.id}`,
      media: `/media/${reference.id}`,
      label: `/labels/${reference.id}`,
      channel: `/channels/${reference.id}`,
    }
    
    const route = routes[reference.type]
    if (route) {
      window.open(route, '_blank')
    }
  }

  if (references.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs font-medium text-muted-foreground">Referenced:</div>
      <div className="grid gap-2">
        {references.map((reference, index) => (
          <EntityPreview
            key={`${reference.id}-${index}`}
            reference={reference}
            variant="card"
            onNavigate={handleReferenceClick}
            className="text-xs"
          />
        ))}
      </div>
    </div>
  )
}