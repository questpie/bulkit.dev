'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bulkit/ui/components/ui/card'
import { 
  FileText, 
  CheckSquare, 
  User, 
  Image as ImageIcon, 
  Hash, 
  Radio,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  ExternalLink,
  Tag,
  MapPin,
  Users,
  Zap,
  PlayCircle,
  Download,
  Star,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { SmartReference } from '@bulkit/shared/modules/chat/chat.schemas'
import { formatDistanceToNow } from 'date-fns'

interface EntityPreviewProps {
  reference: SmartReference
  variant?: 'inline' | 'card' | 'detailed'
  className?: string
  onNavigate?: (reference: SmartReference) => void
}

export function EntityPreview({ 
  reference, 
  variant = 'inline', 
  className, 
  onNavigate 
}: EntityPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(reference)
    } else {
      // Default navigation logic
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
  }

  const renderPostPreview = () => {
    const metadata = reference.metadata || {}
    
    return (
      <div className="space-y-3">
        {/* Post header */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{reference.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{metadata.type || 'Post'}</span>
              <span>•</span>
              <Badge variant={metadata.status === 'published' ? 'default' : 'secondary'} className="h-4 text-xs">
                {metadata.status || 'Draft'}
              </Badge>
              {metadata.createdAt && (
                <>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(metadata.createdAt), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post preview */}
        {reference.preview && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {reference.preview}
          </div>
        )}

        {/* Post media preview */}
        {metadata.mediaUrl && !imageError && (
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            <img
              src={metadata.mediaUrl}
              alt={reference.title}
              className={cn(
                "w-full h-full object-cover transition-opacity",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Post stats */}
        {metadata.stats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {metadata.stats.views && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{metadata.stats.views}</span>
              </div>
            )}
            {metadata.stats.likes && (
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                <span>{metadata.stats.likes}</span>
              </div>
            )}
            {metadata.stats.comments && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{metadata.stats.comments}</span>
              </div>
            )}
            {metadata.stats.shares && (
              <div className="flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                <span>{metadata.stats.shares}</span>
              </div>
            )}
          </div>
        )}

        {/* Post tags */}
        {metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {metadata.tags.slice(0, 3).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="h-4 text-xs">
                #{tag}
              </Badge>
            ))}
            {metadata.tags.length > 3 && (
              <Badge variant="outline" className="h-4 text-xs">
                +{metadata.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTaskPreview = () => {
    const metadata = reference.metadata || {}
    
    return (
      <div className="space-y-3">
        {/* Task header */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded flex items-center justify-center shrink-0",
            metadata.status === 'completed' ? 'bg-green-500' : 
            metadata.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
          )}>
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{reference.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge 
                variant={metadata.priority === 'high' ? 'destructive' : 'secondary'} 
                className="h-4 text-xs"
              >
                {metadata.priority || 'Normal'}
              </Badge>
              <Badge 
                variant={metadata.status === 'completed' ? 'default' : 'outline'} 
                className="h-4 text-xs"
              >
                {metadata.status || 'Pending'}
              </Badge>
              {metadata.createdAt && (
                <>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(metadata.createdAt), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Task description */}
        {reference.preview && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {reference.preview}
          </div>
        )}

        {/* Task assignee and due date */}
        {(metadata.assignee || metadata.dueDate) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {metadata.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{metadata.assignee}</span>
              </div>
            )}
            {metadata.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(metadata.dueDate), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderUserPreview = () => {
    const metadata = reference.metadata || {}
    
    return (
      <div className="space-y-3">
        {/* User header */}
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={metadata.avatar} alt={reference.title} />
            <AvatarFallback>
              {reference.title.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{reference.title}</h4>
            {metadata.email && (
              <div className="text-xs text-muted-foreground">{metadata.email}</div>
            )}
            {metadata.role && (
              <Badge variant="outline" className="h-4 text-xs mt-1">
                {metadata.role}
              </Badge>
            )}
          </div>
        </div>

        {/* User bio */}
        {reference.preview && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {reference.preview}
          </div>
        )}

        {/* User stats */}
        {metadata.stats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {metadata.stats.posts && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{metadata.stats.posts} posts</span>
              </div>
            )}
            {metadata.stats.followers && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{metadata.stats.followers} followers</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderMediaPreview = () => {
    const metadata = reference.metadata || {}
    
    return (
      <div className="space-y-3">
        {/* Media header */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center shrink-0">
            {metadata.type === 'video' ? (
              <PlayCircle className="w-4 h-4 text-white" />
            ) : (
              <ImageIcon className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{reference.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{metadata.type || 'Image'}</span>
              {metadata.size && (
                <>
                  <span>•</span>
                  <span>{metadata.size}</span>
                </>
              )}
              {metadata.dimensions && (
                <>
                  <span>•</span>
                  <span>{metadata.dimensions}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Media preview */}
        {metadata.url && !imageError && (
          <div className="relative rounded-lg overflow-hidden bg-muted">
            {metadata.type === 'video' ? (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={metadata.url}
                alt={reference.title}
                className={cn(
                  "w-full max-h-32 object-cover transition-opacity",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </div>
        )}

        {/* Media actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-6 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="h-6 text-xs">
            <Star className="w-3 h-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
    )
  }

  const renderLabelPreview = () => {
    const metadata = reference.metadata || {}
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: metadata.color || '#6b7280' }}
          >
            <Hash className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{reference.title}</h4>
            {metadata.description && (
              <div className="text-xs text-muted-foreground">{metadata.description}</div>
            )}
          </div>
        </div>
        
        {metadata.usage && (
          <div className="text-xs text-muted-foreground">
            Used in {metadata.usage} items
          </div>
        )}
      </div>
    )
  }

  const renderChannelPreview = () => {
    const metadata = reference.metadata || {}
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center shrink-0">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{reference.title}</h4>
            {metadata.platform && (
              <div className="text-xs text-muted-foreground">{metadata.platform}</div>
            )}
          </div>
        </div>
        
        {metadata.followers && (
          <div className="text-xs text-muted-foreground">
            {metadata.followers} followers
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (reference.type) {
      case 'post':
        return renderPostPreview()
      case 'task':
        return renderTaskPreview()
      case 'user':
        return renderUserPreview()
      case 'media':
        return renderMediaPreview()
      case 'label':
        return renderLabelPreview()
      case 'channel':
        return renderChannelPreview()
      default:
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{reference.title}</span>
          </div>
        )
    }
  }

  if (variant === 'inline') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNavigate}
        className={cn("h-auto p-2 justify-start hover:bg-muted/50", className)}
      >
        <div className="flex items-center gap-2 w-full">
          {renderContent()}
          <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
        </div>
      </Button>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)} onClick={handleNavigate}>
        <CardContent className="p-4">
          {renderContent()}
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)} onClick={handleNavigate}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {renderContent()}
        </CardTitle>
      </CardHeader>
      {reference.preview && (
        <CardContent className="pt-0">
          <CardDescription className="text-xs">{reference.preview}</CardDescription>
        </CardContent>
      )}
    </Card>
  )
}