'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { 
  Bell, 
  Check, 
  CheckCheck,
  Clock,
  ExternalLink,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
  User,
  Calendar,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { ChatNotification } from '@bulkit/shared/modules/chat/chat.schemas'
import { chatNotificationsQueryOptions, useMarkNotificationRead, useMarkAllNotificationsRead } from '../chat.queries'
import { useChatNotifications } from '../chat.atoms'

const notificationIcons = {
  post_ready_for_review: FileText,
  task_assigned: CheckCircle,
  agent_completed_task: Check,
  system: Info,
  reminder: Clock,
  warning: AlertTriangle,
} as const

const notificationColors = {
  post_ready_for_review: 'text-blue-500',
  task_assigned: 'text-green-500', 
  agent_completed_task: 'text-purple-500',
  system: 'text-gray-500',
  reminder: 'text-orange-500',
  warning: 'text-red-500',
} as const

interface NotificationsListProps {
  notifications?: any
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export function NotificationsList({ 
  notifications: propNotifications,
  isLoading: propIsLoading,
  onLoadMore,
  hasMore,
}: NotificationsListProps = {}) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all')
  const notificationsQuery = useQuery(chatNotificationsQueryOptions())
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const notifications = propNotifications || notificationsQuery.data || []
  const isLoading = propIsLoading ?? notificationsQuery.isLoading
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'actionable') return notification.isActionable && !notification.isRead
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const actionableCount = notifications.filter(n => n.isActionable && !n.isRead).length

  const handleMarkRead = (notificationId: string) => {
    markReadMutation.mutate(notificationId)
  }

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate()
  }

  const handleNotificationClick = (notification: ChatNotification) => {
    if (!notification.isRead) {
      handleMarkRead(notification.id)
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  const renderNotification = (notification: ChatNotification) => {
    const Icon = notificationIcons[notification.notificationType] || Bell
    const iconColor = notificationColors[notification.notificationType] || 'text-gray-500'
    
    return (
      <div
        key={notification.id}
        className={cn(
          "p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors",
          !notification.isRead && "bg-blue-50/50 border-l-2 border-l-blue-500"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("mt-0.5 flex-shrink-0", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-medium",
                  !notification.isRead && "font-semibold"
                )}>
                  {notification.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {notification.message}
                </div>
              </div>

              {/* Badges and actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {notification.isActionable && !notification.isRead && (
                  <Badge variant="secondary" className="text-xs h-4">
                    Action Required
                  </Badge>
                )}
                
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkRead(notification.id)
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(notification.createdAt).toLocaleString()}
              </div>
              
              {notification.actionUrl && (
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  View
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs h-7"
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="h-7 text-xs"
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === 'actionable' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('actionable')}
            className="h-7 text-xs"
          >
            Action Required ({actionableCount})
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              Loading notifications...
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bell className="w-8 h-8 text-muted-foreground mb-2" />
            <div className="text-sm font-medium text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'actionable' ? 'No action required' :
               'No notifications'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {filter === 'all' && "You're all caught up!"}
            </div>
          </div>
        ) : (
          <div className="group">
            {filteredNotifications.map(renderNotification)}
          </div>
        )}
      </ScrollArea>

      {/* Quick stats */}
      {notifications.length > 0 && (
        <div className="p-3 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {actionableCount > 0 && (
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                {actionableCount} action{actionableCount === 1 ? '' : 's'} required
              </div>
            )}
            <div>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}