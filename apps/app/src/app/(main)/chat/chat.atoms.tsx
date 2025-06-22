'use client'

import { atom, useAtom } from 'jotai'
import type { 
  ChatConversation, 
  PageContext,
  SmartReference,
  Mention,
} from '@bulkit/shared/modules/chat/chat.schemas'

// Chat drawer state
export const chatDrawerOpenAtom = atom(false)
export const useChatDrawer = () => useAtom(chatDrawerOpenAtom)

// Active conversation
export const activeConversationIdAtom = atom<string | null>(null)
export const useActiveConversation = () => useAtom(activeConversationIdAtom)

// Current page context for chat
export const currentPageContextAtom = atom<PageContext | null>(null)
export const useCurrentPageContext = () => useAtom(currentPageContextAtom)

// Chat input state
export const chatInputAtom = atom('')
export const useChatInput = () => useAtom(chatInputAtom)

// References being composed in chat input
export const chatReferencesAtom = atom<SmartReference[]>([])
export const useChatReferences = () => useAtom(chatReferencesAtom)

// Mentions being composed in chat input
export const chatMentionsAtom = atom<Mention[]>([])
export const useChatMentions = () => useAtom(chatMentionsAtom)

// Typing state
export const isTypingAtom = atom(false)
export const useIsTyping = () => useAtom(isTypingAtom)

// Agent typing state (for showing "AI is thinking...")
export const agentTypingAtom = atom<{ agentName: string; conversationId: string } | null>(null)
export const useAgentTyping = () => useAtom(agentTypingAtom)

// Message composition mode
export const compositionModeAtom = atom<'text' | 'voice' | 'command'>('text')
export const useCompositionMode = () => useAtom(compositionModeAtom)

// Chat sidebar mode (conversations, create, notifications, settings)
export const chatSidebarModeAtom = atom<'conversations' | 'create' | 'notifications' | 'settings'>('conversations')
export const useChatSidebarMode = () => useAtom(chatSidebarModeAtom)

// Search state for conversations
export const conversationSearchAtom = atom('')
export const useConversationSearch = () => useAtom(conversationSearchAtom)

// Reference search state
export const referenceSearchAtom = atom('')
export const useReferenceSearch = () => useAtom(referenceSearchAtom)

// Show reference picker
export const showReferencePickerAtom = atom(false)
export const useShowReferencePicker = () => useAtom(showReferencePickerAtom)

// Show mention picker
export const showMentionPickerAtom = atom(false)
export const useShowMentionPicker = () => useAtom(showMentionPickerAtom)

// Unread notifications count
export const unreadNotificationsCountAtom = atom(0)
export const useUnreadNotificationsCount = () => useAtom(unreadNotificationsCountAtom)

// Chat settings
export const chatSettingsAtom = atom({
  autoSave: true,
  showTypingIndicators: true,
  enableNotifications: true,
  soundEnabled: false,
  markReadOnView: true,
})
export const useChatSettings = () => useAtom(chatSettingsAtom)

// Auto-scroll settings
export const autoScrollEnabledAtom = atom(true)
export const useAutoScrollEnabled = () => useAtom(autoScrollEnabledAtom)

// Chat notifications settings
export const chatNotificationsEnabledAtom = atom(true)
export const useChatNotifications = () => useAtom(chatNotificationsEnabledAtom)

// Chat sounds settings
export const chatSoundsEnabledAtom = atom(false)
export const useChatSounds = () => useAtom(chatSoundsEnabledAtom)

// Chat theme
export const chatThemeAtom = atom<'light' | 'dark' | 'system'>('system')
export const useChatTheme = () => useAtom(chatThemeAtom)

// Typing indicators enabled
export const typingIndicatorsEnabledAtom = atom(true)
export const useTypingIndicatorsEnabled = () => useAtom(typingIndicatorsEnabledAtom)

// Conversation creation state
export const isCreatingConversationAtom = atom(false)
export const useIsCreatingConversation = () => useAtom(isCreatingConversationAtom)

// Message streaming state
export const streamingMessageAtom = atom<{
  messageId: string
  content: string
  isComplete: boolean
} | null>(null)
export const useStreamingMessage = () => useAtom(streamingMessageAtom)

// Chat history/pinned conversations
export const pinnedConversationsAtom = atom<string[]>([])
export const usePinnedConversations = () => useAtom(pinnedConversationsAtom)

// Quick actions state
export const quickActionsAtom = atom({
  showCreatePost: false,
  showCreateTask: false,
  showAnalytics: false,
})
export const useQuickActions = () => useAtom(quickActionsAtom)