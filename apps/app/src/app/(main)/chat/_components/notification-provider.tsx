'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useNotificationIntegration } from '../_hooks/use-notification-integration'

interface NotificationContextValue {
  triggerTestNotifications: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationIntegration = useNotificationIntegration()

  // Initialize notification permissions on mount
  useEffect(() => {
    // Request notification permission on first visit
    if ('Notification' in window && Notification.permission === 'default') {
      // Show a subtle prompt to enable notifications
      const shouldAsk = window.confirm(
        'Would you like to enable browser notifications for important updates from your AI assistant?'
      )
      
      if (shouldAsk) {
        Notification.requestPermission()
      }
    }
  }, [])

  const contextValue: NotificationContextValue = {
    triggerTestNotifications: notificationIntegration.triggerTestNotifications,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}