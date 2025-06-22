// Comment-related constants for the enhanced comments system

export const COMMENT_CONSTANTS = {
  // Content limits
  MAX_CONTENT_LENGTH: 10000,
  MIN_CONTENT_LENGTH: 1,

  // Reply limits
  MAX_REPLIES_PER_COMMENT: 1000,

  // Attachment limits
  MAX_ATTACHMENTS_PER_COMMENT: 5,
  SUPPORTED_ATTACHMENT_TYPES: ['image', 'video', 'document', 'link'] as const,

  // Real-time features
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
  TYPING_INDICATOR_DEBOUNCE: 500, // 500ms

  // AI features
  AI_RESPONSE_TIMEOUT: 30000, // 30 seconds
  AI_CONTEXT_LIMIT: 5, // Number of previous comments to include in AI context

  // Pagination
  DEFAULT_COMMENTS_LIMIT: 25,
  MAX_COMMENTS_LIMIT: 100,

  // Reactions
  MAX_REACTIONS_PER_USER: 1, // One reaction type per user per comment

  // Read status
  READ_STATUS_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
} as const

export type CommentAttachmentType = (typeof COMMENT_CONSTANTS.SUPPORTED_ATTACHMENT_TYPES)[number]
