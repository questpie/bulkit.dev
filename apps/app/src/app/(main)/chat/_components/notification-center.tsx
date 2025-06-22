'use client'

import { useEffect, useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bulkit/ui/components/ui/popover'
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bulkit/ui/components/ui/tabs'
import { 
  Bell,
  Settings,
  CheckCheck,
  Filter,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import { useUnreadNotificationsCount } from '../chat.atoms'
import { NotificationsList } from './notifications-list'
import { NotificationSettings } from './notification-settings'
import { 
  NotificationToastContainer, 
  useNotificationToasts,
  type NotificationToast,
} from './notification-toast'
import { useChatNotificationHandler } from '../_hooks/use-browser-notifications'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('notifications')
  const [unreadCount] = useUnreadNotificationsCount()
  
  // Toast notifications
  const { toasts, addToast, removeToast } = useNotificationToasts()
  const chatNotificationHandler = useChatNotificationHandler()

  // Mock real-time notification handler
  useEffect(() => {
    // Simulate receiving various types of notifications
    const simulateNotifications = () => {
      const notifications = [
        {
          title: 'New Message',
          message: 'AI Assistant: I\'ve completed your content analysis. The post is ready for review.',
          type: 'info' as const,
          isActionable: true,
          actionUrl: '/posts/123',
          actionLabel: 'Review Post',
          soundEnabled: true,
        },
        {
          title: 'Task Reminder',
          message: 'Social media post deadline is in 2 hours',
          type: 'warning' as const,
          isActionable: true,
          actionUrl: '/tasks/456',
          actionLabel: 'View Task',
          soundEnabled: true,
        },
        {
          title: 'Content Published',
          message: 'Your Instagram post has been published successfully',
          type: 'success' as const,
          duration: 4000,
          soundEnabled: false,
        },
      ]

      // Randomly show a notification every 30-60 seconds for demo
      const randomDelay = Math.random() * 30000 + 30000 // 30-60 seconds
      setTimeout(() => {
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
        addToast(randomNotification)
        simulateNotifications() // Schedule next notification
      }, randomDelay)
    }

    // Start the simulation after 5 seconds
    const initialTimer = setTimeout(simulateNotifications, 5000)
    
    return () => clearTimeout(initialTimer)
  }, [addToast])

  // Handle browser notification integration
  useEffect(() => {
    // Listen for real chat events (would come from WebSocket/Pusher in real app)
    const handleChatMessage = (event: CustomEvent) => {
      const { conversationId, agentName, content, urgent } = event.detail
      
      // Show browser notification
      chatNotificationHandler.handleNewMessage({
        conversationId,
        agentName,
        content,
        urgent,
      })
      
      // Show toast notification
      addToast({
        title: `${agentName}`,
        message: content.length > 80 ? content.substring(0, 80) + '...' : content,
        type: urgent ? 'warning' : 'info',
        isActionable: true,
        actionUrl: `/chat?conversation=${conversationId}`,
        actionLabel: 'Reply',
        soundEnabled: true,
        duration: urgent ? 0 : 6000, // Urgent messages don't auto-dismiss
      })
    }

    // Listen for task reminders
    const handleTaskReminder = (event: CustomEvent) => {
      const { taskId, title, dueDate, priority } = event.detail
      
      chatNotificationHandler.handleTaskReminder({
        taskId,
        title,
        dueDate: new Date(dueDate),
        priority,
      })
      
      addToast({
        title: 'Task Reminder',
        message: title,
        type: priority === 'critical' || priority === 'high' ? 'warning' : 'info',
        isActionable: true,
        actionUrl: `/tasks/${taskId}`,
        actionLabel: 'View Task',
        soundEnabled: true,
        duration: priority === 'critical' ? 0 : 8000,
      })
    }

    // Listen for content updates
    const handleContentReady = (event: CustomEvent) => {
      const { postId, title, status } = event.detail
      
      chatNotificationHandler.handleContentReady({
        postId,
        title,
        status,
      })
      
      const typeMap = {
        ready_for_review: 'warning' as const,
        published: 'success' as const,
        failed: 'error' as const,
      }
      
      const messageMap = {
        ready_for_review: 'Your content is ready for review',
        published: 'Your content has been published successfully',
        failed: 'There was an issue publishing your content',
      }
      
      addToast({
        title: title,
        message: messageMap[status],
        type: typeMap[status],
        isActionable: status !== 'published',
        actionUrl: `/posts/${postId}`,
        actionLabel: status === 'ready_for_review' ? 'Review' : 'View Details',
        soundEnabled: true,
        duration: status === 'published' ? 5000 : 0,
      })
    }

    // Add event listeners
    window.addEventListener('chat:new-message', handleChatMessage as EventListener)
    window.addEventListener('task:reminder', handleTaskReminder as EventListener)
    window.addEventListener('content:ready', handleContentReady as EventListener)

    return () => {
      window.removeEventListener('chat:new-message', handleChatMessage as EventListener)
      window.removeEventListener('task:reminder', handleTaskReminder as EventListener)
      window.removeEventListener('content:ready', handleContentReady as EventListener)
    }
  }, [addToast, chatNotificationHandler])

  const handleToastAction = (notification: NotificationToast) => {
    if (notification.actionUrl) {
      // In a real app, this would use the router
      console.log('Navigating to:', notification.actionUrl)
      // router.push(notification.actionUrl)
    }
  }

  return (
    <>
      {/* Notification Bell */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("relative", className)}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-96 p-0" 
          align="end"
          side="bottom"
          sideOffset={8}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="w-full h-auto p-1 bg-transparent">
                <TabsTrigger 
                  value="notifications" 
                  className="flex-1 data-[state=active]:bg-muted"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="flex-1 data-[state=active]:bg-muted"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notifications" className="m-0">
              <div className="max-h-96 overflow-hidden">
                <NotificationsList />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <div className="max-h-96 overflow-y-auto p-4">
                <NotificationSettings />
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* Toast Notifications */}
      <NotificationToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        onAction={handleToastAction}
      />
    </>
  )
}

// Hook for triggering notifications from other components
export function useNotificationTrigger() {
  const triggerChatMessage = (data: {
    conversationId: string
    agentName: string
    content: string
    urgent?: boolean
  }) => {
    window.dispatchEvent(new CustomEvent('chat:new-message', { detail: data }))
  }

  const triggerTaskReminder = (data: {
    taskId: string
    title: string
    dueDate: string | Date
    priority: 'low' | 'medium' | 'high' | 'critical'
  }) => {
    window.dispatchEvent(new CustomEvent('task:reminder', { detail: data }))
  }

  const triggerContentReady = (data: {
    postId: string
    title: string
    status: 'ready_for_review' | 'published' | 'failed'
  }) => {
    window.dispatchEvent(new CustomEvent('content:ready', { detail: data }))
  }

  return {
    triggerChatMessage,
    triggerTaskReminder,
    triggerContentReady,
  }
}