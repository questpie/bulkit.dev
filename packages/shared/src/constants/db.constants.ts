// ALL constants and enums must reside here because drizzle kit has trouble resolving ts aliases.
// So to make it easier and still be able to share constants with FE, we will export them from here.

/**
 * Users and organizations
 */

export const USER_ROLE = ['owner', 'admin', 'member'] as const
export type UserRole = (typeof USER_ROLE)[number]

/**
 * Posts
 */
export const POST_TYPE = ['reel', 'story', 'post', 'thread'] as const
export type PostType = (typeof POST_TYPE)[number]

export const POST_TYPE_NAME = {
  reel: 'Reel',
  story: 'Story',
  post: 'Post',
  thread: 'Thread',
} as const

export const POST_STATUS = ['draft', 'scheduled', 'partially-published', 'published'] as const
export type PostStatus = (typeof POST_STATUS)[number]

export const SCHEDULED_POST_STATUS = [
  'draft',
  'scheduled',
  'running',
  'published',
  'failed',
] as const
export type ScheduledPostStatus = (typeof SCHEDULED_POST_STATUS)[number]
export const PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'linkedin',
  // 'google',
] as const

export const PLATFORM_TO_NAME = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  // google: 'Google',
}

/**
 * Channels
 */

export type Platform = (typeof PLATFORMS)[number]

/**
 *
 * Enum representing the possible statuses of a channel.
 * @readonly
 * @enum {string}
 * @property {string} active - The channel is currently active and functioning normally.
 * @property {string} inactive - The channel is currently inactive or archived.
 * @property {string} error - The channel is experiencing an auth error or other issue.
 */
export const CHANNEL_STATUS = ['active', 'inactive', 'error'] as const
export type ChannelStatus = (typeof CHANNEL_STATUS)[number]

// /**
//  * Workflows
//  */

// export const WORKFLOW_STEP_TYPES = ['publish', 'wait', 'repost', 'condition'] as const

// export type WorkflowStepType = (typeof WORKFLOW_STEP_TYPES)[number]

/**
 * Tasks
 */

export const TASK_STATUS = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const
export type TaskStatus = (typeof TASK_STATUS)[number]

export const TASK_PRIORITY = ['low', 'medium', 'high', 'critical'] as const
export type TaskPriority = (typeof TASK_PRIORITY)[number]

export const DEPENDENCY_TYPE = ['finish_to_start', 'start_to_start', 'finish_to_finish'] as const
export type DependencyType = (typeof DEPENDENCY_TYPE)[number]

export const TASK_ACTIVITY_ACTION_TYPE = [
  'created',
  'updated',
  'assigned',
  'unassigned',
  'status_changed',
  'priority_changed',
  'completed',
  'reopened',
  'commented',
  'dependency_added',
  'dependency_removed',
  'time_logged',
] as const
export type TaskActivityActionType = (typeof TASK_ACTIVITY_ACTION_TYPE)[number]

/**
 * Plans
 */

export const PLAN_SUBSCRIPTION_TYPES = ['monthly', 'annual', 'life-time'] as const
export type PlanSubscriptionType = (typeof PLAN_SUBSCRIPTION_TYPES)[number]

/**
 * Comments
 */

export const COMMENT_ENTITY_TYPES = ['post', 'task', 'knowledge'] as const
export type CommentEntityType = (typeof COMMENT_ENTITY_TYPES)[number]

export const COMMENT_REACTION_TYPES = [
  'like',
  'love',
  'laugh',
  'angry',
  'sad',
  'thumbs_up',
  'thumbs_down',
] as const
export type CommentReactionType = (typeof COMMENT_REACTION_TYPES)[number]

export const COMMENT_ATTACHMENT_TYPES = ['image', 'video', 'document', 'link'] as const
export type CommentAttachmentType = (typeof COMMENT_ATTACHMENT_TYPES)[number]

export const COMMENT_MENTION_TYPES = [
  'user',
  'agent',
  'post',
  'media',
  'knowledge',
  'task',
] as const
export type CommentMentionType = (typeof COMMENT_MENTION_TYPES)[number]

/**
 * Knowledge Base
 */

export const KNOWLEDGE_STATUS = ['draft', 'published', 'archived'] as const
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUS)[number]

export const KNOWLEDGE_TEMPLATE_TYPE = [
  'general',
  'brand_guidelines',
  'competitor_analysis',
  'market_research',
  'content_strategy',
  'campaign_brief',
  'product_info',
  'style_guide',
  'process_documentation',
  'meeting_notes',
  'research_summary',
  'web_scraping_result',
] as const
export type KnowledgeTemplateType = (typeof KNOWLEDGE_TEMPLATE_TYPE)[number]

export const KNOWLEDGE_VERSION_CHANGE_TYPE = [
  'created',
  'content_updated',
  'metadata_updated',
  'template_changed',
  'status_changed',
  'restored_from_version',
] as const
export type KnowledgeVersionChangeType = (typeof KNOWLEDGE_VERSION_CHANGE_TYPE)[number]

export const KNOWLEDGE_REFERENCE_TYPE = [
  'mentions', // Referenced via @ mentions
  'links', // Linked within content
  'attachments', // Attached as resource
  'templates', // Used as template base
] as const
export type KnowledgeReferenceType = (typeof KNOWLEDGE_REFERENCE_TYPE)[number]

/**
 * Labels System
 */

export const LABEL_RESOURCE_TYPES = [
  'post',
  'task',
  'knowledge',
  'resource', // files/media
] as const
export type LabelResourceType = (typeof LABEL_RESOURCE_TYPES)[number]

/**
 * Folders System
 */

// These are the entity types that can be organized in folders
export const FOLDERABLE_ENTITY_TYPES = [
  'resource', // media files
  'post', // posts
  'knowledge', // knowledge documents
] as const
export type FolderableEntityType = (typeof FOLDERABLE_ENTITY_TYPES)[number]

export const FOLDER_PERMISSION_LEVELS = [
  'read', // Can view folder and contents
  'write', // Can add/move items, create subfolders
  'admin', // Can manage permissions, delete folder
] as const
export type FolderPermissionLevel = (typeof FOLDER_PERMISSION_LEVELS)[number]

export const FOLDER_PERMISSION_INHERITANCE = [
  'inherit', // Inherit from parent folder
  'explicit', // Explicit permission set
] as const
export type FolderPermissionInheritance = (typeof FOLDER_PERMISSION_INHERITANCE)[number]
