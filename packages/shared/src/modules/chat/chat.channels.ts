// export  const CHAT_CHANNELS = {
//   USER_CONVERSATIONS: (userId: string) => `private-user-${userId}-conversations`,
//   CONVERSATION: (conversationId: string) => `private-conversation-${conversationId}`,
//   USER_NOTIFICATIONS: (userId: string) => `private-user-${userId}-notifications`,
//   AGENT_STATUS: (organizationId: string) => `private-org-${organizationId}-agents`,
// } as const

import { createChannel } from '@bulkit/shared/utils/pusher'

export const chatUserConversationsChannel = createChannel('private-user-${userId}-conversations')
export const chatConversationChannel = createChannel('private-conversation-${conversationId}')
export const chatUserNotificationsChannel = createChannel('private-user-${userId}-notifications')
export const chatAgentStatusChannel = createChannel('private-org-${organizationId}-agents')

export const chatMessageCreatedChannel = createChannel('private-message-created')
export const chatMessageUpdatedChannel = createChannel('private-message-updated')
