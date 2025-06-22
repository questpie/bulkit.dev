'use client'

import { useEffect, useState, useCallback } from 'react'
import { useChatNotifications } from '../chat.atoms'

export interface BrowserNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: any
}

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [chatNotificationsEnabled] = useChatNotifications()

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    if (permission === 'granted') {
      return 'granted'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [isSupported, permission])

  const showNotification = useCallback(async (options: BrowserNotificationOptions) => {
    // Check if notifications are enabled in settings
    if (!chatNotificationsEnabled) {
      return null
    }

    // Check if we have permission
    if (permission !== 'granted') {
      const newPermission = await requestPermission()
      if (newPermission !== 'granted') {
        return null
      }
    }

    // Check if page is visible (don't show if user is already on the page)
    if (!document.hidden) {
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data,
        // Actions are not supported in all browsers
        ...(options.actions && { actions: options.actions }),
      })

      // Auto-close after 8 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 8000)
      }

      // Handle clicks
      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        
        // Navigate to specific page if data contains URL
        if (options.data?.url) {
          window.location.href = options.data.url
        }
        
        notification.close()
      }

      // Handle action clicks (if supported)
      if ('onnotificationclick' in window.navigator && options.actions) {
        notification.onshow = () => {
          // Register service worker event listener for action clicks
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data.type === 'notification-action') {
                const { action, notification: notificationData } = event.data
                console.log('Notification action clicked:', action, notificationData)
                // Handle the action based on the action string
                window.focus()
                notification.close()
              }
            })
          }
        }
      }

      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
      return null
    }
  }, [permission, requestPermission, chatNotificationsEnabled])

  const showChatNotification = useCallback((options: {
    title: string
    message: string
    conversationId?: string
    agentName?: string
    urgent?: boolean
  }) => {
    const { title, message, conversationId, agentName, urgent } = options

    return showNotification({
      title: `${agentName ? `${agentName}: ` : ''}${title}`,
      body: message,
      icon: '/chat-icon.png',
      tag: conversationId ? `chat-${conversationId}` : 'chat',
      requireInteraction: urgent || false,
      data: {
        type: 'chat',
        conversationId,
        url: conversationId ? `/chat?conversation=${conversationId}` : '/chat',
      },
      actions: conversationId ? [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/reply-icon.png',
        },
        {
          action: 'view',
          title: 'View Chat',
          icon: '/view-icon.png',
        },
      ] : undefined,
    })
  }, [showNotification])

  const showTaskNotification = useCallback((options: {
    title: string
    message: string
    taskId?: string
    dueDate?: Date
    priority?: 'low' | 'medium' | 'high' | 'critical'
  }) => {
    const { title, message, taskId, dueDate, priority } = options
    
    const isUrgent = priority === 'critical' || priority === 'high'
    const isDueSoon = dueDate && dueDate.getTime() - Date.now() < 24 * 60 * 60 * 1000 // Due within 24 hours

    return showNotification({
      title: `Task: ${title}`,
      body: message,
      icon: '/task-icon.png',
      tag: taskId ? `task-${taskId}` : 'task',
      requireInteraction: isUrgent || isDueSoon || false,
      data: {
        type: 'task',
        taskId,
        url: taskId ? `/tasks/${taskId}` : '/tasks',
      },
      actions: taskId ? [
        {
          action: 'complete',
          title: 'Mark Complete',
          icon: '/complete-icon.png',
        },
        {
          action: 'view',
          title: 'View Task',
          icon: '/view-icon.png',
        },
      ] : undefined,
    })
  }, [showNotification])

  const showContentNotification = useCallback((options: {
    title: string
    message: string
    postId?: string
    status?: 'ready_for_review' | 'published' | 'failed'
  }) => {
    const { title, message, postId, status } = options
    
    const isActionRequired = status === 'ready_for_review' || status === 'failed'

    return showNotification({
      title: `Content: ${title}`,
      body: message,
      icon: '/content-icon.png',
      tag: postId ? `post-${postId}` : 'content',
      requireInteraction: isActionRequired || false,
      data: {
        type: 'content',
        postId,
        url: postId ? `/posts/${postId}` : '/posts',
      },
      actions: postId ? [
        ...(status === 'ready_for_review' ? [{
          action: 'review',
          title: 'Review',
          icon: '/review-icon.png',
        }] : []),
        {
          action: 'view',
          title: 'View Post',
          icon: '/view-icon.png',
        },
      ] : undefined,
    })
  }, [showNotification])

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showChatNotification,
    showTaskNotification,
    showContentNotification,
  }
}

// Hook for integrating with chat notifications
export function useChatNotificationHandler() {
  const browserNotifications = useBrowserNotifications()

  const handleNewMessage = useCallback((data: {
    conversationId: string
    agentName: string
    content: string
    urgent?: boolean
  }) => {
    browserNotifications.showChatNotification({
      title: 'New Message',
      message: data.content.length > 100 ? 
        data.content.substring(0, 100) + '...' : 
        data.content,
      conversationId: data.conversationId,
      agentName: data.agentName,
      urgent: data.urgent,
    })
  }, [browserNotifications])

  const handleTaskReminder = useCallback((data: {
    taskId: string
    title: string
    dueDate: Date
    priority: 'low' | 'medium' | 'high' | 'critical'
  }) => {
    const timeUntilDue = data.dueDate.getTime() - Date.now()
    const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60))
    
    let message = `Due in ${hoursUntilDue} hours`
    if (hoursUntilDue < 1) {
      const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60))
      message = `Due in ${minutesUntilDue} minutes`
    } else if (hoursUntilDue > 24) {
      const daysUntilDue = Math.floor(hoursUntilDue / 24)
      message = `Due in ${daysUntilDue} days`
    }

    browserNotifications.showTaskNotification({
      title: data.title,
      message,
      taskId: data.taskId,
      dueDate: data.dueDate,
      priority: data.priority,
    })
  }, [browserNotifications])

  const handleContentReady = useCallback((data: {
    postId: string
    title: string
    status: 'ready_for_review' | 'published' | 'failed'
  }) => {
    const messages = {
      ready_for_review: 'Your content is ready for review',
      published: 'Your content has been published successfully',
      failed: 'There was an issue publishing your content',
    }

    browserNotifications.showContentNotification({
      title: data.title,
      message: messages[data.status],
      postId: data.postId,
      status: data.status,
    })
  }, [browserNotifications])

  return {
    ...browserNotifications,
    handleNewMessage,
    handleTaskReminder,
    handleContentReady,
  }
}