'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bulkit/ui/components/ui/dialog'
import { 
  Plus, 
  MessageCircle, 
  Sparkles,
  Bot,
  FileText,
  BarChart3,
  Calendar,
  Brush,
  CheckSquare,
  Search,
  Hash,
  MapPin,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import { useCreateConversation } from '../chat.queries'
import { useActiveConversation, useCurrentPageContext } from '../chat.atoms'
import type { ChatAgentType, PageContext } from '@bulkit/shared/modules/chat/chat.schemas'

interface NewChatDialogProps {
  children?: React.ReactNode
  defaultOpen?: boolean
}

const CHAT_TEMPLATES = [
  {
    id: 'general',
    title: 'General Chat',
    description: 'Start a conversation with the AI assistant',
    icon: MessageCircle,
    agentType: null,
    prompt: "Hi! I'd like to chat with the AI assistant.",
    color: 'bg-blue-500',
  },
  {
    id: 'post-creation',
    title: 'Create Post',
    description: 'Get help creating engaging social media posts',
    icon: FileText,
    agentType: 'post_management' as ChatAgentType,
    prompt: "I'd like help creating a social media post. Can you assist me with content ideas and optimization?",
    color: 'bg-green-500',
  },
  {
    id: 'analytics',
    title: 'Analytics Review',
    description: 'Analyze your social media performance',
    icon: BarChart3,
    agentType: 'analytics' as ChatAgentType,
    prompt: "I'd like to review my social media analytics and get insights on performance.",
    color: 'bg-purple-500',
  },
  {
    id: 'content-creation',
    title: 'Content Ideas',
    description: 'Brainstorm creative content concepts',
    icon: Brush,
    agentType: 'content_creation' as ChatAgentType,
    prompt: "I need help brainstorming creative content ideas for my social media channels.",
    color: 'bg-orange-500',
  },
  {
    id: 'task-management',
    title: 'Task Planning',
    description: 'Organize tasks and create workflows',
    icon: CheckSquare,
    agentType: 'task_management' as ChatAgentType,
    prompt: "I'd like help organizing my tasks and creating efficient workflows.",
    color: 'bg-teal-500',
  },
  {
    id: 'scheduling',
    title: 'Content Scheduling',
    description: 'Plan and schedule your content calendar',
    icon: Calendar,
    agentType: 'scheduling' as ChatAgentType,
    prompt: "I need help planning and scheduling my content calendar.",
    color: 'bg-indigo-500',
  },
] as const

export function NewChatDialog({ children, defaultOpen = false }: NewChatDialogProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  
  const [, setActiveConversationId] = useActiveConversation()
  const [currentPageContext] = useCurrentPageContext()
  const createConversationMutation = useCreateConversation()

  const handleCreateChat = async (template?: typeof CHAT_TEMPLATES[0]) => {
    try {
      const title = template ? template.title : (customTitle || 'New Chat')
      const initialPrompt = template ? template.prompt : customPrompt

      // Create the conversation
      const conversation = await createConversationMutation.mutateAsync({
        title,
        currentPageContext,
      })

      // Set as active conversation
      setActiveConversationId(conversation.id)

      // If there's an initial prompt, we could auto-send it here
      // For now, we'll just create the conversation and let the user type

      setOpen(false)
      setSelectedTemplate(null)
      setCustomTitle('')
      setCustomPrompt('')
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = CHAT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      handleCreateChat(template)
    }
  }

  const handleCustomCreate = () => {
    if (customTitle.trim()) {
      handleCreateChat()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Plus className="w-3 h-3 mr-1" />
            New Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Start New Conversation
          </DialogTitle>
          <DialogDescription>
            Choose a template to get started quickly, or create a custom conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Page Context */}
          {currentPageContext && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Current Context:</span>
                <Badge variant="outline" className="text-xs">
                  <Hash className="w-2 h-2 mr-1" />
                  {currentPageContext.path}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The AI will be aware of your current page and can provide contextual help.
              </p>
            </div>
          )}

          {/* Chat Templates */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Quick Start Templates</h4>
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 gap-3 pr-4">
                {CHAT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    disabled={createConversationMutation.isPending}
                    className={cn(
                      "p-4 rounded-lg border-2 border-transparent bg-card hover:bg-muted/50",
                      "transition-all duration-200 text-left group",
                      "hover:border-primary/20 hover:shadow-sm",
                      createConversationMutation.isPending && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        template.color
                      )}>
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                          {template.title}
                        </h5>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        
                        {template.agentType && (
                          <div className="flex items-center gap-1 mt-2">
                            <Bot className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground capitalize">
                              {template.agentType.replace('_', ' ')} agent
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Custom Chat Creation */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium">Custom Conversation</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="chat-title" className="text-sm">
                  Conversation Title
                </Label>
                <Input
                  id="chat-title"
                  placeholder="e.g., Marketing Strategy Discussion"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="initial-prompt" className="text-sm">
                  Initial Message (Optional)
                </Label>
                <Input
                  id="initial-prompt"
                  placeholder="Start the conversation with a specific question or topic..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Button
                onClick={handleCustomCreate}
                disabled={!customTitle.trim() || createConversationMutation.isPending}
                className="w-full"
              >
                {createConversationMutation.isPending ? (
                  <>Creating...</>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Create Custom Chat
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Floating Action Button version
export function NewChatFAB() {
  return (
    <NewChatDialog>
      <Button
        size="lg"
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </NewChatDialog>
  )
}

// Simple button version for toolbar
export function NewChatButton({ className }: { className?: string }) {
  return (
    <NewChatDialog>
      <Button variant="ghost" size="sm" className={className}>
        <Plus className="w-4 h-4 mr-2" />
        New Chat
      </Button>
    </NewChatDialog>
  )
}