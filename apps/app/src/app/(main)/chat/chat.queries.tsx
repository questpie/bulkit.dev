'use client'

import { apiClient } from '@bulkit/app/api/api.client'
import { 
  infiniteQueryOptions, 
  queryOptions, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query'
import type {
  ChatConversation,
  ChatConversationWithMessages,
  ChatMessage,
  SendMessage,
  CreateConversation,
  UpdateConversation,
  SearchReferences,
  ChatNotification,
  ChatAgent,
} from '@bulkit/shared/modules/chat/chat.schemas'

interface UserMention {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  isOnline?: boolean
  lastSeen?: string
}

interface TeamMention {
  id: string
  name: string
  description?: string
  memberCount: number
  avatar?: string
}

export const CHAT_QUERY_KEYS = {
  conversations: ['chat', 'conversations'] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  notifications: ['chat', 'notifications'] as const,
  agents: ['chat', 'agents'] as const,
  references: (query: string) => ['chat', 'references', query] as const,
  users: (query: string) => ['chat', 'users', query] as const,
  teams: (query: string) => ['chat', 'teams', query] as const,
}

// Conversations queries
export function conversationsQueryOptions() {
  return infiniteQueryOptions({
    queryKey: CHAT_QUERY_KEYS.conversations,
    queryFn: async ({ pageParam = 0 }) => {
      const res = await apiClient.chat.conversations.get({
        query: { limit: 20, offset: pageParam },
      })
      if (res.error) throw res.error
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore 
        ? lastPage.pagination.offset + lastPage.pagination.limit 
        : undefined,
  })
}

export function conversationQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
    queryFn: async () => {
      const res = await apiClient.chat.conversations({ id: conversationId }).get()
      if (res.error) throw res.error
      return res.data
    },
    enabled: !!conversationId,
  })
}

// Messages queries
export function messagesQueryOptions(conversationId: string) {
  return infiniteQueryOptions({
    queryKey: CHAT_QUERY_KEYS.messages(conversationId),
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.chat.conversations({ id: conversationId }).messages.get({
        query: { 
          limit: 50,
          before: pageParam as string | undefined,
        },
      })
      if (res.error) throw res.error
      return res.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const messages = lastPage.data
      return lastPage.pagination.hasMore && messages.length > 0 
        ? messages[0]?.id 
        : undefined
    },
    enabled: !!conversationId,
  })
}

// Notifications queries
export function notificationsQueryOptions() {
  return infiniteQueryOptions({
    queryKey: CHAT_QUERY_KEYS.notifications,
    queryFn: async ({ pageParam = 0 }) => {
      const res = await apiClient.chat.notifications.get({
        query: { limit: 20, offset: pageParam },
      })
      if (res.error) throw res.error
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasMore 
        ? lastPage.pagination.offset + lastPage.pagination.limit 
        : undefined,
  })
}

export function chatNotificationsQueryOptions() {
  return queryOptions({
    queryKey: CHAT_QUERY_KEYS.notifications,
    queryFn: async () => {
      const res = await apiClient.chat.notifications.get({
        query: { limit: 100 },
      })
      if (res.error) throw res.error
      return res.data.data
    },
  })
}

// Agents query
export function agentsQueryOptions() {
  return queryOptions({
    queryKey: CHAT_QUERY_KEYS.agents,
    queryFn: async () => {
      const res = await apiClient.chat.agents.get()
      if (res.error) throw res.error
      return res.data
    },
  })
}

// Search references query
export function searchReferencesQueryOptions(query: string) {
  return queryOptions({
    queryKey: CHAT_QUERY_KEYS.references(query),
    queryFn: async () => {
      if (!query.trim()) return { references: [], hasMore: false }
      
      const res = await apiClient.chat.search.references.post({
        query: query,
        limit: 10,
      })
      if (res.error) throw res.error
      return res.data
    },
    enabled: query.trim().length > 2,
  })
}

// Search users query
export function searchUsersQueryOptions(query: string) {
  return queryOptions({
    queryKey: CHAT_QUERY_KEYS.users(query),
    queryFn: async () => {
      if (!query.trim()) return []
      
      // Mock data for now - would be replaced with actual API call
      const mockUsers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: '/placeholder-avatar.jpg',
          role: 'Admin',
          isOnline: true,
        },
        {
          id: 'user-2', 
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'Editor',
          isOnline: false,
          lastSeen: '2 hours ago',
        },
        {
          id: 'user-3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          role: 'Viewer',
          isOnline: true,
        },
      ]
      
      return mockUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      )
    },
    enabled: query.trim().length > 0,
  })
}

// Search teams query
export function searchTeamsQueryOptions(query: string) {
  return queryOptions({
    queryKey: CHAT_QUERY_KEYS.teams(query),
    queryFn: async () => {
      if (!query.trim()) return []
      
      // Mock data for now - would be replaced with actual API call
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Marketing Team',
          description: 'Social media and content marketing',
          memberCount: 8,
        },
        {
          id: 'team-2',
          name: 'Design Team', 
          description: 'UI/UX and graphic design',
          memberCount: 5,
        },
        {
          id: 'team-3',
          name: 'Analytics Team',
          description: 'Data analysis and reporting',
          memberCount: 3,
        },
      ]
      
      return mockTeams.filter(team =>
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.description?.toLowerCase().includes(query.toLowerCase())
      )
    },
    enabled: query.trim().length > 0,
  })
}

// Mutations
export function useCreateConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateConversation) => {
      const res = await apiClient.chat.conversations.post(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations })
    },
  })
}

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      ...data 
    }: { conversationId: string } & UpdateConversation) => {
      const res = await apiClient.chat.conversations({ id: conversationId }).put(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(CHAT_QUERY_KEYS.conversation(data.id), data)
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      ...data 
    }: { conversationId: string } & SendMessage) => {
      const res = await apiClient.chat.conversations({ id: conversationId }).messages.post(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      // Optimistically add the message to the messages cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.messages(data.conversationId),
        (old: any) => {
          if (!old) return old
          
          const firstPage = old.pages[0]
          if (!firstPage) return old
          
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                data: [...firstPage.data, data],
              },
              ...old.pages.slice(1),
            ],
          }
        }
      )
      
      // Update conversation last message time
      queryClient.invalidateQueries({ 
        queryKey: CHAT_QUERY_KEYS.conversation(data.conversationId) 
      })
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await apiClient.chat.conversations({ id: conversationId }).delete()
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversations })
    },
  })
}

export function useAddMessageReaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      messageId, 
      reactionType 
    }: { 
      messageId: string
      reactionType: 'like' | 'dislike' | 'helpful' | 'not_helpful'
    }) => {
      const res = await apiClient.chat.messages({ id: messageId }).reactions.post({
        reactionType,
      })
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      // Could optimize by updating specific message in cache
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await apiClient.chat.notifications({ id: notificationId }).read.put()
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.notifications })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.chat.notifications['mark-all-read'].put()
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.notifications })
    },
  })
}