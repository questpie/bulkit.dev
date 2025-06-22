'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@bulkit/ui/components/ui/sheet'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { Separator } from '@bulkit/ui/components/ui/separator'
import {
  LuMessageCircle,
  LuBell,
  LuSettings,
  LuPlus,
  X,
  LuMinimize2,
  LuMaximize2,
  LuX,
  LuWand2,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import {
  useChatDrawer,
  useChatSidebarMode,
  useActiveConversation,
  useUnreadNotificationsCount,
} from '../chat.atoms'
import {
  conversationsQueryOptions,
  notificationsQueryOptions,
  agentsQueryOptions,
  useCreateConversation,
} from '../chat.queries'
import { useChatRealtime } from '../_hooks/use-chat-pusher'
import { useAuthData } from '@bulkit/app/app/(auth)/use-auth'
import { ConversationsList } from './conversations-list'
import { NotificationsList } from './notifications-list'
import { ChatSettings } from './chat-settings'
import { ChatConversation } from './chat-conversation'
import { ChatInput } from './chat-input'
import { NewChatDialog } from './new-chat-dialog'
import { ContentCreationTools } from './content-creation-tools'

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useChatDrawer()
  const [sidebarMode, setSidebarMode] = useChatSidebarMode()
  const [activeConversationId, setActiveConversationId] = useActiveConversation()
  const [unreadCount] = useUnreadNotificationsCount()

  const createConversationMutation = useCreateConversation()
  const authData = useAuthData()

  // Queries
  const conversationsQuery = useQuery(conversationsQueryOptions())
  const notificationsQuery = useQuery(notificationsQueryOptions())
  const agentsQuery = useQuery(agentsQueryOptions())

  // Real-time subscriptions
  const chatRealtime = useChatRealtime({
    conversationId: activeConversationId,
    userId: authData?.user?.id,
    organizationId: authData?.user?.organizationId,
  })

  // Close drawer on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, setIsOpen])

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (isOpen && !activeConversationId && conversationsQuery.data?.pages[0]?.data.length) {
      const firstConversation = conversationsQuery.data.pages[0].data[0]
      if (firstConversation) {
        setActiveConversationId(firstConversation.id)
      }
    }
  }, [isOpen, activeConversationId, conversationsQuery.data, setActiveConversationId])

  const handleCreateNewConversation = async () => {
    try {
      const newConversation = await createConversationMutation.mutateAsync({
        title: 'New Conversation',
      })
      setActiveConversationId(newConversation.id)
      setSidebarMode('conversations')
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const sidebarTabs = [
    {
      id: 'conversations' as const,
      label: 'Chats',
      icon: LuMessageCircle,
      count: conversationsQuery.data?.pages[0]?.pagination.total || 0,
    },
    {
      id: 'create' as const,
      label: 'Create',
      icon: LuWand2,
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: LuBell,
      count: unreadCount,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: LuSettings,
    },
  ]

  const renderSidebarContent = () => {
    switch (sidebarMode) {
      case 'conversations':
        return (
          <ConversationsList
            conversations={conversationsQuery.data}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            isLoading={conversationsQuery.isLoading}
            onLoadMore={conversationsQuery.fetchNextPage}
            hasMore={conversationsQuery.hasNextPage}
          />
        )
      case 'create':
        return (
          <ContentCreationTools
            conversationId={activeConversationId || 'temp'}
          />
        )
      case 'notifications':
        return (
          <NotificationsList
            notifications={notificationsQuery.data}
            isLoading={notificationsQuery.isLoading}
            onLoadMore={notificationsQuery.fetchNextPage}
            hasMore={notificationsQuery.hasNextPage}
          />
        )
      case 'settings':
        return <ChatSettings agents={agentsQuery.data || []} />
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side='right' className='p-0 w-full max-w-6xl bg-background border-l'>
        {/* Header */}
        <SheetHeader className='flex flex-row items-center justify-between px-6 py-4 border-b'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
              <LuMessageCircle className='w-4 h-4 text-white' />
            </div>
            <SheetTitle>AI Assistant</SheetTitle>
          </div>

          <div className='flex items-center gap-2'>
            <NewChatDialog>
              <Button
                variant='ghost'
                size='sm'
                disabled={createConversationMutation.isPending}
              >
                <LuPlus className='w-4 h-4' />
                New Chat
              </Button>
            </NewChatDialog>

            <Button variant='ghost' size='sm' onClick={() => setIsOpen(false)}>
              <LuX className='w-4 h-4' />
            </Button>
          </div>
        </SheetHeader>

        {/* Main Content */}
        <div className='flex h-[calc(100vh-73px)]'>
          {/* Sidebar */}
          <div className='w-80 border-r bg-muted/30 flex flex-col'>
            {/* Sidebar Tabs */}
            <div className='flex border-b bg-background'>
              {sidebarTabs.map((tab) => (
                <Button
                  type='button'
                  key={tab.id}
                  onClick={() => setSidebarMode(tab.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    sidebarMode === tab.id
                      ? 'text-primary border-b-2 border-primary bg-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <tab.icon className='w-4 h-4' />
                  <span className='hidden sm:inline'>{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge
                      variant={tab.id === 'notifications' ? 'destructive' : 'secondary'}
                      className='h-5 min-w-5 text-xs flex items-center justify-center'
                    >
                      {tab.count > 99 ? '99+' : tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Sidebar Content */}
            <ScrollArea className='flex-1'>{renderSidebarContent()}</ScrollArea>
          </div>

          {/* Chat Area */}
          <div className='flex-1 flex flex-col'>
            {activeConversationId ? (
              <>
                {/* Chat Messages */}
                <div className='flex-1 min-h-0'>
                  <ChatConversation conversationId={activeConversationId} />
                </div>

                {/* Chat Input */}
                <div className='border-t bg-background'>
                  <ChatInput conversationId={activeConversationId} />
                </div>
              </>
            ) : (
              /* Empty State */
              <div className='flex-1 flex items-center justify-center'>
                <div className='text-center space-y-4 max-w-md mx-auto px-6'>
                  <div className='w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto'>
                    <LuMessageCircle className='w-8 h-8 text-white' />
                  </div>

                  <div className='space-y-2'>
                    <h3 className='text-lg font-semibold'>Welcome to AI Assistant</h3>
                    <p className='text-muted-foreground'>
                      Start a conversation to get help with your social media management, content
                      creation, analytics, and more.
                    </p>
                  </div>

                  <NewChatDialog>
                    <Button
                      disabled={createConversationMutation.isPending}
                      className='w-full'
                    >
                      <LuPlus className='w-4 h-4 mr-2' />
                      Start New Conversation
                    </Button>
                  </NewChatDialog>

                  <div className='text-xs text-muted-foreground'>
                    <p>Available agents:</p>
                    <div className='flex flex-wrap gap-1 mt-1 justify-center'>
                      {agentsQuery.data?.slice(0, 4).map((agent) => (
                        <Badge key={agent.id} variant='outline' className='text-xs'>
                          {agent.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
