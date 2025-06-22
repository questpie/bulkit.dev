'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bulkit/ui/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { 
  Plus,
  FileText,
  CheckSquare,
  Image,
  Video,
  Calendar,
  Hash,
  Sparkles,
  Zap,
  Camera,
  Music,
  PenTool,
  Palette,
  Target,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import { QuickPostCreator } from './quick-post-creator'
import { QuickTaskCreator } from './quick-task-creator'
import { ContentIdeaGenerator } from './content-idea-generator'
import { HashtagGenerator } from './hashtag-generator'
import { MediaUploader } from './media-uploader'
import { AIImageGenerator } from './ai-image-generator'
import { AIVideoGenerator } from './ai-video-generator'
import { AIImageEditor } from './ai-image-editor'
import { AIBatchGenerator } from './ai-batch-generator'
import { AIAnalytics } from './ai-analytics'
import { AIPromptOptimizer } from './ai-prompt-optimizer'

interface ContentCreationToolsProps {
  conversationId: string
  className?: string
}

type ToolCategory = 'create' | 'generate' | 'optimize' | 'schedule'

const contentTools = [
  // Create category
  {
    id: 'quick-post',
    category: 'create' as const,
    title: 'Quick Post',
    description: 'Create a social media post',
    icon: FileText,
    color: 'bg-blue-500',
    shortcut: 'P',
  },
  {
    id: 'new-task',
    category: 'create' as const,
    title: 'New Task',
    description: 'Create a task or reminder',
    icon: CheckSquare,
    color: 'bg-green-500',
    shortcut: 'T',
  },
  {
    id: 'upload-media',
    category: 'create' as const,
    title: 'Upload Media',
    description: 'Upload images, videos, or files',
    icon: Image,
    color: 'bg-orange-500',
    shortcut: 'U',
  },
  {
    id: 'record-video',
    category: 'create' as const,
    title: 'Record Video',
    description: 'Record a quick video or reel',
    icon: Video,
    color: 'bg-red-500',
    shortcut: 'V',
  },
  
  // Generate category
  {
    id: 'content-ideas',
    category: 'generate' as const,
    title: 'Content Ideas',
    description: 'AI-powered content suggestions',
    icon: Sparkles,
    color: 'bg-purple-500',
    shortcut: 'I',
  },
  {
    id: 'ai-image-generate',
    category: 'generate' as const,
    title: 'AI Image Generator',
    description: 'Create images with advanced AI models',
    icon: Camera,
    color: 'bg-pink-500',
    shortcut: 'G',
  },
  {
    id: 'ai-video-generate',
    category: 'generate' as const,
    title: 'AI Video Generator',
    description: 'Generate videos from text or images',
    icon: Video,
    color: 'bg-indigo-500',
    shortcut: 'M',
  },
  {
    id: 'ai-image-edit',
    category: 'generate' as const,
    title: 'AI Image Editor',
    description: 'Edit images with AI tools',
    icon: PenTool,
    color: 'bg-cyan-500',
    shortcut: 'E',
  },
  {
    id: 'batch-generator',
    category: 'generate' as const,
    title: 'Batch Generator',
    description: 'Generate multiple images/videos at once',
    icon: Zap,
    color: 'bg-amber-500',
    shortcut: 'B',
  },
  {
    id: 'hashtags',
    category: 'generate' as const,
    title: 'Generate Hashtags',
    description: 'Create relevant hashtags',
    icon: Hash,
    color: 'bg-pink-500',
    shortcut: 'H',
  },
  {
    id: 'copy-improve',
    category: 'generate' as const,
    title: 'Improve Copy',
    description: 'Enhance existing content',
    icon: PenTool,
    color: 'bg-teal-500',
    shortcut: 'E',
  },
  
  // Optimize category
  {
    id: 'analytics',
    category: 'optimize' as const,
    title: 'Performance Analytics',
    description: 'View content performance',
    icon: TrendingUp,
    color: 'bg-emerald-500',
    shortcut: 'A',
  },
  {
    id: 'ai-analytics',
    category: 'optimize' as const,
    title: 'AI Usage Analytics',
    description: 'Track AI generation costs and usage',
    icon: BarChart3,
    color: 'bg-blue-500',
    shortcut: 'U',
  },
  {
    id: 'prompt-optimizer',
    category: 'optimize' as const,
    title: 'Prompt Optimizer',
    description: 'Improve your AI prompts',
    icon: Target,
    color: 'bg-violet-500',
    shortcut: 'O',
  },
  {
    id: 'audience-insights',
    category: 'optimize' as const,
    title: 'Audience Insights',
    description: 'Understand your audience',
    icon: Target,
    color: 'bg-cyan-500',
    shortcut: 'O',
  },
  
  // Schedule category
  {
    id: 'schedule-post',
    category: 'schedule' as const,
    title: 'Schedule Content',
    description: 'Plan future posts',
    icon: Calendar,
    color: 'bg-violet-500',
    shortcut: 'S',
  },
  {
    id: 'optimal-timing',
    category: 'schedule' as const,
    title: 'Best Times',
    description: 'Find optimal posting times',
    icon: Clock,
    color: 'bg-amber-500',
    shortcut: 'B',
  },
]

export function ContentCreationTools({ conversationId, className }: ContentCreationToolsProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('create')

  const filteredTools = contentTools.filter(tool => tool.category === selectedCategory)

  const handleToolClick = (toolId: string) => {
    setActiveDialog(toolId)
  }

  const renderTool = (tool: typeof contentTools[0]) => {
    const Icon = tool.icon
    
    return (
      <Button
        key={tool.id}
        variant="ghost"
        onClick={() => handleToolClick(tool.id)}
        className={cn(
          "h-auto p-4 flex flex-col items-center gap-2 text-center",
          "hover:bg-muted/50 border-2 border-transparent",
          "hover:border-primary/20 transition-all duration-200"
        )}
      >
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", tool.color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{tool.title}</span>
            <Badge variant="outline" className="text-xs h-5">
              {tool.shortcut}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {tool.description}
          </div>
        </div>
      </Button>
    )
  }

  const renderQuickActions = () => (
    <div className="flex gap-2 p-2">
      <Button
        size="sm"
        onClick={() => handleToolClick('quick-post')}
        className="flex items-center gap-2"
      >
        <FileText className="w-4 h-4" />
        Quick Post
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleToolClick('new-task')}
        className="flex items-center gap-2"
      >
        <CheckSquare className="w-4 h-4" />
        New Task
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleToolClick('content-ideas')}
        className="flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Ideas
      </Button>
    </div>
  )

  return (
    <div className={cn("w-full", className)}>
      {/* Quick Actions Bar */}
      <div className="border-b bg-muted/30">
        {renderQuickActions()}
      </div>

      {/* Main Tools Interface */}
      <div className="p-4">
        {/* Category Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg">
          {[
            { id: 'create', label: 'Create', icon: Plus },
            { id: 'generate', label: 'Generate', icon: Zap },
            { id: 'optimize', label: 'Optimize', icon: TrendingUp },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={selectedCategory === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(id as ToolCategory)}
              className="flex-1 flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredTools.map(renderTool)}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <div className="text-xs text-muted-foreground text-center">
            💡 Use keyboard shortcuts or ask the AI assistant to help with content creation
          </div>
        </div>
      </div>

      {/* Dialogs for Each Tool */}
      <Dialog open={activeDialog === 'quick-post'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Post Creator
            </DialogTitle>
            <DialogDescription>
              Create a social media post with AI assistance
            </DialogDescription>
          </DialogHeader>
          <QuickPostCreator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'new-task'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Quick Task Creator
            </DialogTitle>
            <DialogDescription>
              Create a task or reminder
            </DialogDescription>
          </DialogHeader>
          <QuickTaskCreator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'content-ideas'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Content Idea Generator
            </DialogTitle>
            <DialogDescription>
              Get AI-powered content suggestions
            </DialogDescription>
          </DialogHeader>
          <ContentIdeaGenerator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'hashtags'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Hashtag Generator
            </DialogTitle>
            <DialogDescription>
              Generate relevant hashtags for your content
            </DialogDescription>
          </DialogHeader>
          <HashtagGenerator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'upload-media'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Media Uploader
            </DialogTitle>
            <DialogDescription>
              Upload images, videos, or other media files
            </DialogDescription>
          </DialogHeader>
          <MediaUploader 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      {/* AI Generation Tool Dialogs */}
      <Dialog open={activeDialog === 'ai-image-generate'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              AI Image Generator
            </DialogTitle>
            <DialogDescription>
              Generate high-quality images using advanced AI models
            </DialogDescription>
          </DialogHeader>
          <AIImageGenerator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'ai-video-generate'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              AI Video Generator
            </DialogTitle>
            <DialogDescription>
              Generate videos from text prompts or images using Google Veo
            </DialogDescription>
          </DialogHeader>
          <AIVideoGenerator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'ai-image-edit'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              AI Image Editor
            </DialogTitle>
            <DialogDescription>
              Edit images with AI: inpainting, outpainting, style transfer, and more
            </DialogDescription>
          </DialogHeader>
          <AIImageEditor 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'batch-generator'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Batch Generator
            </DialogTitle>
            <DialogDescription>
              Generate multiple images or videos at once with different prompts
            </DialogDescription>
          </DialogHeader>
          <AIBatchGenerator 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'ai-analytics'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              AI Usage Analytics
            </DialogTitle>
            <DialogDescription>
              Track AI generation costs, usage patterns, and performance metrics
            </DialogDescription>
          </DialogHeader>
          <AIAnalytics 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === 'prompt-optimizer'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Prompt Optimizer
            </DialogTitle>
            <DialogDescription>
              Improve your AI prompts for better generation results
            </DialogDescription>
          </DialogHeader>
          <AIPromptOptimizer 
            conversationId={conversationId}
            onComplete={() => setActiveDialog(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}