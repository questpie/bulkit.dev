'use client'

import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSubscription } from '@bulkit/app/pusher/pusher-provider'
import { CHAT_CHANNELS, CHAT_EVENTS } from '@bulkit/shared/modules/chat/chat.constants'
import { CHAT_QUERY_KEYS } from '../chat.queries'
import type { 
  ChatMessage, 
  ChatConversation, 
  ChatNotification,
  AgentTypingEvent,
  UserTypingEvent,
} from '@bulkit/shared/modules/chat/chat.schemas'

// Hook for conversation-level real-time events
export function useChatConversationRealtime(conversationId: string | null) {
  const queryClient = useQueryClient()

  // Listen for new messages
  const { error: messageError } = useSubscription<{ message: ChatMessage }>({
    channelName: conversationId ? CHAT_CHANNELS.CONVERSATION(conversationId) : '',
    eventName: CHAT_EVENTS.MESSAGE_CREATED,
    enabled: !!conversationId,
    onMessage: useCallback((data) => {
      if (!conversationId) return

      // Add new message to messages cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.messages(conversationId),
        (oldData: any) => {
          if (!oldData?.pages?.[0]) return oldData

          const firstPage = oldData.pages[0]
          const newMessage = data.message

          // Check if message already exists (avoid duplicates)
          const messageExists = firstPage.data.some((msg: ChatMessage) => msg.id === newMessage.id)
          if (messageExists) return oldData

          return {
            ...oldData,
            pages: [
              {
                ...firstPage,
                data: [...firstPage.data, newMessage],
              },
              ...oldData.pages.slice(1),
            ],
          }
        }
      )

      // Update conversation last message timestamp
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
      })
    }, [conversationId, queryClient]),
  })

  // Listen for message updates (streaming, edits, etc.)
  const { error: updateError } = useSubscription<{ message: ChatMessage }>({
    channelName: conversationId ? CHAT_CHANNELS.CONVERSATION(conversationId) : '',
    eventName: CHAT_EVENTS.MESSAGE_UPDATED,
    enabled: !!conversationId,
    onMessage: useCallback((data) => {
      if (!conversationId) return

      // Update message in cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.messages(conversationId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: ChatMessage) =>
                msg.id === data.message.id ? data.message : msg
              ),
            })),
          }
        }
      )
    }, [conversationId, queryClient]),
  })

  // Listen for conversation updates
  const { error: conversationError } = useSubscription<{ conversation: ChatConversation }>({
    channelName: conversationId ? CHAT_CHANNELS.CONVERSATION(conversationId) : '',
    eventName: CHAT_EVENTS.CONVERSATION_UPDATED,
    enabled: !!conversationId,
    onMessage: useCallback((data) => {
      if (!conversationId) return

      // Update conversation in cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversationId),
        data.conversation
      )

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      })
    }, [conversationId, queryClient]),
  })

  return {
    errors: {
      messages: messageError,
      updates: updateError,
      conversation: conversationError,
    },
  }
}

// Hook for user-level real-time events (notifications, new conversations)
export function useChatUserRealtime(userId: string | null) {
  const queryClient = useQueryClient()

  // Listen for new notifications
  const { error: notificationError } = useSubscription<{ notification: ChatNotification }>({
    channelName: userId ? CHAT_CHANNELS.USER_NOTIFICATIONS(userId) : '',
    eventName: CHAT_EVENTS.NOTIFICATION_CREATED,
    enabled: !!userId,
    onMessage: useCallback((data) => {
      // Add notification to cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.notifications,
        (oldData: any) => {
          if (!oldData) return oldData

          const newNotification = data.notification
          
          // Add to first page
          if (oldData.pages?.[0]) {
            return {
              ...oldData,
              pages: [
                {
                  ...oldData.pages[0],
                  data: [newNotification, ...oldData.pages[0].data],
                },
                ...oldData.pages.slice(1),
              ],
            }
          }

          return oldData
        }
      )

      // Show browser notification if permissions granted
      if (Notification.permission === 'granted') {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: '/favicon.ico',
        })
      }
    }, [queryClient]),
  })

  // Listen for conversation updates (new conversations, archiving, etc.)
  const { error: conversationsError } = useSubscription<{ conversation: ChatConversation }>({
    channelName: userId ? CHAT_CHANNELS.USER_CONVERSATIONS(userId) : '',
    eventName: CHAT_EVENTS.CONVERSATION_UPDATED,
    enabled: !!userId,
    onMessage: useCallback((data) => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({
        queryKey: CHAT_QUERY_KEYS.conversations,
      })
    }, [queryClient]),
  })

  return {
    errors: {
      notifications: notificationError,
      conversations: conversationsError,
    },
  }
}

// Hook for typing indicators
export function useChatTypingIndicators(conversationId: string | null) {
  const queryClient = useQueryClient()

  // Listen for agent typing events
  const { error: agentTypingError } = useSubscription<AgentTypingEvent>({
    channelName: conversationId ? CHAT_CHANNELS.CONVERSATION(conversationId) : '',
    eventName: CHAT_EVENTS.AGENT_TYPING,
    enabled: !!conversationId,
    onMessage: useCallback((data) => {
      // Could update a typing state atom or show typing indicator
      console.log('Agent typing:', data)
    }, []),
  })

  // Listen for user typing events (from other users in the future)
  const { error: userTypingError } = useSubscription<UserTypingEvent>({
    channelName: conversationId ? CHAT_CHANNELS.CONVERSATION(conversationId) : '',
    eventName: CHAT_EVENTS.USER_TYPING,
    enabled: !!conversationId,
    onMessage: useCallback((data) => {
      // Could show typing indicators for other users
      console.log('User typing:', data)
    }, []),
  })

  return {
    errors: {
      agentTyping: agentTypingError,
      userTyping: userTypingError,
    },
  }
}

// Hook for streaming message updates
export function useChatMessageStreaming(conversationId: string | null) {
  const queryClient = useQueryClient()

  const { error: streamingError } = useSubscription<{ messageId: string; chunk: string; isComplete: boolean }>({
    channelName: conversationId ? CHAT_CHANNELS.CONVERSATION(conversationId) : '',
    eventName: CHAT_EVENTS.MESSAGE_STREAMING,
    enabled: !!conversationId,
    onMessage: useCallback((data) => {
      if (!conversationId) return

      // Update streaming message content
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.messages(conversationId),
        (oldData: any) => {
          if (!oldData?.pages) return oldData

          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((msg: ChatMessage) => {
                if (msg.id === data.messageId) {
                  return {
                    ...msg,
                    content: msg.content + data.chunk,
                    isStreaming: !data.isComplete,
                  }
                }
                return msg
              }),
            })),
          }
        }
      )
    }, [conversationId, queryClient]),
  })

  return {
    errors: {
      streaming: streamingError,
    },
  }
}

// Combined hook for all chat real-time features
export function useChatRealtime(opts: {
  conversationId?: string | null
  userId?: string | null
  organizationId?: string | null
}) {
  const conversationRealtime = useChatConversationRealtime(opts.conversationId || null)
  const userRealtime = useChatUserRealtime(opts.userId || null)
  const typingIndicators = useChatTypingIndicators(opts.conversationId || null)
  const messageStreaming = useChatMessageStreaming(opts.conversationId || null)

  // Request notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  return {
    conversation: conversationRealtime,
    user: userRealtime,
    typing: typingIndicators,
    streaming: messageStreaming,
    errors: {
      ...conversationRealtime.errors,
      ...userRealtime.errors,
      ...typingIndicators.errors,
      ...messageStreaming.errors,
    },
  }
}