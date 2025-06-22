'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUnreadNotificationsCount } from '../chat.atoms'
import { CHAT_QUERY_KEYS } from '../chat.queries'
import { useNotificationTrigger } from '../_components/notification-center'

// Hook to integrate notifications with real-time updates
export function useNotificationIntegration() {
  const queryClient = useQueryClient()
  const [, setUnreadCount] = useUnreadNotificationsCount()
  const notificationTrigger = useNotificationTrigger()

  useEffect(() => {
    // Listen for WebSocket/Pusher events
    const handleRealtimeNotification = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'chat:new-message':
            handleNewChatMessage(data.payload)
            break
          case 'task:reminder':
            handleTaskReminder(data.payload)
            break
          case 'task:assigned':
            handleTaskAssigned(data.payload)
            break
          case 'content:ready-for-review':
            handleContentReady(data.payload)
            break
          case 'content:published':
            handleContentPublished(data.payload)
            break
          case 'system:alert':
            handleSystemAlert(data.payload)
            break
          default:
            console.log('Unknown notification type:', data.type)
        }
      } catch (error) {
        console.error('Error parsing real-time notification:', error)
      }
    }

    const handleNewChatMessage = (payload: {
      conversationId: string
      messageId: string
      content: string
      agentName: string
      agentType: string
      urgent?: boolean
    }) => {
      // Update unread count
      setUnreadCount(prev => prev + 1)
      
      // Invalidate notifications query to fetch new data
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.notifications
      })
      
      // Trigger notification
      notificationTrigger.triggerChatMessage({
        conversationId: payload.conversationId,
        agentName: payload.agentName,
        content: payload.content,
        urgent: payload.urgent,
      })
    }

    const handleTaskReminder = (payload: {
      taskId: string
      title: string
      dueDate: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      minutesUntilDue: number
    }) => {
      setUnreadCount(prev => prev + 1)
      
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.notifications
      })
      
      notificationTrigger.triggerTaskReminder({
        taskId: payload.taskId,
        title: payload.title,
        dueDate: payload.dueDate,
        priority: payload.priority,
      })
    }

    const handleTaskAssigned = (payload: {
      taskId: string
      title: string
      assignedBy: string
      priority: 'low' | 'medium' | 'high' | 'critical'
      dueDate?: string
    }) => {
      setUnreadCount(prev => prev + 1)
      
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.notifications
      })
      
      // Trigger custom notification for task assignment
      window.dispatchEvent(new CustomEvent('chat:new-message', {
        detail: {
          conversationId: 'system',
          agentName: 'Task Manager',
          content: `New task assigned: "${payload.title}" by ${payload.assignedBy}`,
          urgent: payload.priority === 'critical' || payload.priority === 'high',
        }
      }))
    }

    const handleContentReady = (payload: {
      postId: string
      title: string
      status: 'ready_for_review' | 'published' | 'failed'
      platform?: string
    }) => {
      setUnreadCount(prev => prev + 1)
      
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.notifications
      })
      
      notificationTrigger.triggerContentReady({
        postId: payload.postId,
        title: payload.title,
        status: payload.status,
      })
    }

    const handleContentPublished = (payload: {
      postId: string
      title: string
      platform: string
      metrics?: {
        likes?: number
        views?: number
        shares?: number
      }
    }) => {
      notificationTrigger.triggerContentReady({
        postId: payload.postId,
        title: payload.title,
        status: 'published',
      })
    }

    const handleSystemAlert = (payload: {
      title: string
      message: string
      severity: 'info' | 'warning' | 'error'
      actionUrl?: string
    }) => {
      setUnreadCount(prev => prev + 1)
      
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.notifications
      })
      
      // Trigger system notification
      window.dispatchEvent(new CustomEvent('chat:new-message', {
        detail: {
          conversationId: 'system',
          agentName: 'System',
          content: `${payload.title}: ${payload.message}`,
          urgent: payload.severity === 'error',
        }
      }))
    }

    // Mock WebSocket connection (in real app this would be Pusher/Socket.io)
    const mockWebSocket = {
      addEventListener: (event: string, handler: EventListener) => {
        if (event === 'message') {
          // Store handler for cleanup
          ;(mockWebSocket as any).messageHandler = handler
        }
      },
      removeEventListener: (event: string, handler: EventListener) => {
        if (event === 'message') {
          ;(mockWebSocket as any).messageHandler = null
        }
      },
      close: () => {},
    }

    // Simulate real-time notifications for demo
    const simulateNotifications = () => {
      const notifications = [
        {
          type: 'chat:new-message',
          payload: {
            conversationId: 'conv-123',
            messageId: 'msg-456',
            content: 'Your social media analytics report for this week is ready. The engagement rate has increased by 15%!',
            agentName: 'Analytics Agent',
            agentType: 'analytics',
          }
        },
        {
          type: 'task:reminder',
          payload: {
            taskId: 'task-789',
            title: 'Review Instagram post for tomorrow',
            dueDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
            priority: 'high' as const,
            minutesUntilDue: 60,
          }
        },
        {
          type: 'content:ready-for-review',
          payload: {
            postId: 'post-101',
            title: 'Weekly Marketing Tips - Instagram Carousel',
            status: 'ready_for_review' as const,
            platform: 'instagram',
          }
        },
        {
          type: 'task:assigned',
          payload: {
            taskId: 'task-202',
            title: 'Create TikTok video for product launch',
            assignedBy: 'Sarah from Marketing',
            priority: 'medium' as const,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          }
        },
        {
          type: 'system:alert',
          payload: {
            title: 'API Rate Limit Warning',
            message: 'Your Instagram API usage is at 85%. Consider upgrading your plan.',
            severity: 'warning' as const,
          }
        },
      ]

      const sendRandomNotification = () => {
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
        handleRealtimeNotification({
          data: JSON.stringify(randomNotification)
        } as MessageEvent)
        
        // Schedule next notification (random interval between 45-90 seconds)
        const nextInterval = Math.random() * 45000 + 45000
        setTimeout(sendRandomNotification, nextInterval)
      }

      // Start sending notifications after 10 seconds
      setTimeout(sendRandomNotification, 10000)
    }

    // Start simulation
    simulateNotifications()

    // In a real app, you would set up Pusher/WebSocket here:
    // const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    //   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    // })
    // const channel = pusher.subscribe('notifications')
    // channel.bind('new-notification', handleRealtimeNotification)

    return () => {
      // Cleanup
      if ((mockWebSocket as any).messageHandler) {
        mockWebSocket.removeEventListener('message', (mockWebSocket as any).messageHandler)
      }
      mockWebSocket.close()
    }
  }, [queryClient, setUnreadCount, notificationTrigger])

  // Function to manually trigger test notifications
  const triggerTestNotifications = () => {
    // Trigger a few test notifications
    setTimeout(() => {
      notificationTrigger.triggerChatMessage({
        conversationId: 'test-conv',
        agentName: 'Content Creator',
        content: 'I\'ve generated 5 new post ideas for your upcoming campaign. Would you like me to create drafts?',
        urgent: false,
      })
    }, 1000)

    setTimeout(() => {
      notificationTrigger.triggerTaskReminder({
        taskId: 'test-task',
        title: 'Schedule social media posts for next week',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
      })
    }, 3000)

    setTimeout(() => {
      notificationTrigger.triggerContentReady({
        postId: 'test-post',
        title: 'Holiday Season Marketing Campaign',
        status: 'ready_for_review',
      })
    }, 5000)
  }

  return {
    triggerTestNotifications,
  }
}