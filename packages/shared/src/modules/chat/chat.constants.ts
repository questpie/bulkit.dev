// Chat system constants

// Chat UI constants
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CONVERSATION_TITLE_LENGTH: 100,
  MESSAGE_PAGINATION_LIMIT: 50,
  TYPING_TIMEOUT: 3000, // ms
  MAX_PINNED_RESOURCES: 10,
  MAX_SEARCH_RESULTS: 20,
} as const

// Pusher channel names
export const CHAT_CHANNELS = {
  USER_CONVERSATIONS: (userId: string) => `private-user-${userId}-conversations`,
  CONVERSATION: (conversationId: string) => `private-conversation-${conversationId}`,
  USER_NOTIFICATIONS: (userId: string) => `private-user-${userId}-notifications`,
  AGENT_STATUS: (organizationId: string) => `private-org-${organizationId}-agents`,
} as const

// Pusher event names
export const CHAT_EVENTS = {
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_STREAMING: 'message.streaming',
  CONVERSATION_UPDATED: 'conversation.updated',
  AGENT_TYPING: 'agent.typing',
  USER_TYPING: 'user.typing',
  NOTIFICATION_CREATED: 'notification.created',
  AGENT_STATUS_CHANGED: 'agent.status_changed',
} as const

// Error messages
export const CHAT_ERRORS = {
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  AGENT_NOT_AVAILABLE: 'Agent is not available',
  CONTENT_TOO_LONG: 'Message content is too long',
  INVALID_REFERENCE: 'Invalid reference provided',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  STREAMING_ERROR: 'Error during message streaming',
  TOOL_EXECUTION_FAILED: 'Tool execution failed',
} as const

// Success messages
export const CHAT_SUCCESS = {
  CONVERSATION_CREATED: 'Conversation created successfully',
  MESSAGE_SENT: 'Message sent successfully',
  CONVERSATION_UPDATED: 'Conversation updated successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
  REFERENCE_ADDED: 'Reference added successfully',
} as const
