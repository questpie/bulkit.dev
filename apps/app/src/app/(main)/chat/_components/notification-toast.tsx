'use client'

import { useEffect, useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { 
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  FileText,
  User,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

export interface NotificationToast {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  notificationType?: 'post_ready_for_review' | 'task_assigned' | 'agent_completed_task' | 'system' | 'reminder' | 'warning'
  actionUrl?: string
  actionLabel?: string
  isActionable?: boolean
  duration?: number // Auto-dismiss after ms (0 = no auto-dismiss)
  timestamp?: Date
  soundEnabled?: boolean
}

interface NotificationToastProps {
  notification: NotificationToast
  onDismiss: (id: string) => void
  onAction?: (notification: NotificationToast) => void
  className?: string
}

const typeIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  error: AlertTriangle,
}

const typeColors = {
  success: 'border-green-500 bg-green-50 text-green-800',
  warning: 'border-orange-500 bg-orange-50 text-orange-800',
  info: 'border-blue-500 bg-blue-50 text-blue-800',
  error: 'border-red-500 bg-red-50 text-red-800',
}

const typeIconColors = {
  success: 'text-green-500',
  warning: 'text-orange-500',
  info: 'text-blue-500',
  error: 'text-red-500',
}

export function NotificationToast({ 
  notification, 
  onDismiss, 
  onAction, 
  className 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Slide in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.duration])

  // Play notification sound
  useEffect(() => {
    if (notification.soundEnabled) {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }, [notification.soundEnabled])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  const handleAction = () => {
    if (onAction) {
      onAction(notification)
    }
    handleDismiss()
  }

  const Icon = typeIcons[notification.type]
  const colorClass = typeColors[notification.type]
  const iconColorClass = typeIconColors[notification.type]

  return (
    <div
      className={cn(
        "fixed top-4 right-4 w-80 max-w-sm border-l-4 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ease-out z-50",
        colorClass,
        isVisible && !isExiting 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn("flex-shrink-0 mt-0.5", iconColorClass)}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-medium text-sm">{notification.title}</div>
              
              {notification.isActionable && (
                <Badge variant="secondary" className="text-xs h-4 flex-shrink-0">
                  Action Required
                </Badge>
              )}
            </div>

            <div className="text-sm opacity-90 mb-2">
              {notification.message}
            </div>

            {/* Timestamp */}
            {notification.timestamp && (
              <div className="flex items-center gap-1 text-xs opacity-75 mb-2">
                <Clock className="w-3 h-3" />
                {notification.timestamp.toLocaleTimeString()}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {notification.actionUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                  className="h-7 text-xs bg-white/50 hover:bg-white/70"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {notification.actionLabel || 'View'}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-7 w-7 p-0 ml-auto bg-white/20 hover:bg-white/40"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-current opacity-30 transition-all ease-linear"
            style={{ 
              animation: `notification-progress ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes notification-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Hook for managing toast notifications
export function useNotificationToasts() {
  const [toasts, setToasts] = useState<NotificationToast[]>([])

  const addToast = (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const newToast: NotificationToast = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      duration: 5000, // Default 5 seconds
      ...toast,
    }
    
    setToasts(prev => [...prev, newToast])
    return newToast.id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  }
}

// Toast container component
interface NotificationToastContainerProps {
  toasts: NotificationToast[]
  onDismiss: (id: string) => void
  onAction?: (notification: NotificationToast) => void
}

export function NotificationToastContainer({ 
  toasts, 
  onDismiss, 
  onAction 
}: NotificationToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 4}px)`,
            zIndex: 50 - index,
          }}
        >
          <NotificationToast
            notification={toast}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        </div>
      ))}
    </div>
  )
}