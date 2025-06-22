'use client'

import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { MessageCircle, Sparkles } from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import { useChatDrawer, useUnreadNotificationsCount } from '../chat.atoms'

interface ChatToggleButtonProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function ChatToggleButton({ 
  className,
  variant = 'ghost',
  size = 'default',
  showLabel = true,
}: ChatToggleButtonProps) {
  const [isOpen, setIsOpen] = useChatDrawer()
  const [unreadCount] = useUnreadNotificationsCount()

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        "relative transition-all duration-200",
        isOpen && "bg-primary/10 text-primary",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {/* Icon with animation */}
        <div className="relative">
          <MessageCircle className={cn(
            "transition-transform duration-200",
            isOpen ? "scale-110" : "scale-100",
            size === 'icon' ? "w-4 h-4" : "w-5 h-5"
          )} />
          
          {/* AI sparkles indicator */}
          <Sparkles className={cn(
            "absolute -top-1 -right-1 text-blue-500 animate-pulse",
            size === 'icon' ? "w-2 h-2" : "w-3 h-3"
          )} />
        </div>

        {/* Label */}
        {showLabel && size !== 'icon' && (
          <span className="font-medium">AI Chat</span>
        )}
      </div>

      {/* Unread notification badge */}
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            "absolute -top-1 -right-1 h-5 min-w-5 text-xs flex items-center justify-center",
            size === 'icon' && "-top-2 -right-2"
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}

      {/* Pulse effect when active */}
      {isOpen && (
        <div className="absolute inset-0 rounded-md bg-primary/20 animate-ping" />
      )}
    </Button>
  )
}

// Compact version for mobile
export function ChatToggleButtonCompact({ className }: { className?: string }) {
  return (
    <ChatToggleButton
      variant="ghost"
      size="icon"
      showLabel={false}
      className={cn("w-9 h-9", className)}
    />
  )
}

// Floating action button version
export function ChatToggleButtonFloating({ className }: { className?: string }) {
  const [isOpen] = useChatDrawer()
  const [unreadCount] = useUnreadNotificationsCount()

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50",
      isOpen && "opacity-50 pointer-events-none",
      className
    )}>
      <ChatToggleButton
        variant="default"
        size="lg"
        showLabel={false}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg hover:shadow-xl",
          "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
          "border-0 text-white"
        )}
      />
      
      {/* Floating notification dot */}
      {unreadCount > 0 && !isOpen && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  )
}