# Task 02: Enhanced Post Comments System

## Overview
Enhance the existing post comments system to support AI agent interactions, threaded discussions, and real-time collaboration. This system will enable seamless communication between users and AI agents within the context of social media posts.

## Current State Analysis
Based on the existing `comments.table.ts`, the system already has:
- Basic comment functionality with user and organization references
- AI response support (`isAiResponse` field)
- Mentions system with JSON-based mention tracking
- Integration with posts and users

## Enhanced Features

### 1. Threaded Comments
- **Nested Replies**: Support multi-level comment threading
- **Thread Collapsing**: Collapsible comment threads for better UX
- **Thread Context**: Maintain context when replying to specific comments
- **Thread Notifications**: Alert users when their comments receive replies

### 2. Advanced AI Integration
- **AI Agent Mentions**: @mention specific AI agents in comments
- **Contextual AI Responses**: AI agents respond based on post content and context
- **AI Suggestions**: Automated suggestions for post improvements
- **Agent Conversations**: Allow AI agents to have conversations with users and each other

### 3. Rich Content Support
- **Markdown Rendering**: Full markdown support for formatted text
- **Code Snippets**: Syntax highlighting for code blocks
- **Media Attachments**: Images, videos, and documents in comments
- **Link Previews**: Automatic preview generation for shared links
- **Emoji Reactions**: Quick reactions to comments

### 4. Real-time Features
- **Live Comments**: Real-time comment updates
- **Typing Indicators**: Show when users are typing
- **Read Receipts**: Track comment read status
- **Presence Indicators**: Show who's currently viewing the post

## Database Schema Updates

### Enhanced Comments Table
```sql
-- Add new columns to existing comments table
ALTER TABLE comments ADD COLUMN parent_comment_id TEXT REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN thread_depth INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN reaction_count JSONB DEFAULT '{}';
ALTER TABLE comments ADD COLUMN attachment_ids TEXT[] DEFAULT '{}';
ALTER TABLE comments ADD COLUMN is_edited BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_thread_depth ON comments(thread_depth);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

### Comment Reactions Table
```sql
CREATE TABLE comment_reactions (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'angry', 'sad', 'thumbs_up', 'thumbs_down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type),
  UNIQUE(comment_id, agent_id, reaction_type),
  CHECK ((user_id IS NOT NULL AND agent_id IS NULL) OR (user_id IS NULL AND agent_id IS NOT NULL))
);
```

### Comment Attachments Table
```sql
CREATE TABLE comment_attachments (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('image', 'video', 'document', 'link')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Comment Read Status Table
```sql
CREATE TABLE comment_read_status (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
```

## API Endpoints Enhancement

### Core Comment Operations
- `GET /api/posts/:postId/comments` - Get threaded comments with pagination
- `POST /api/posts/:postId/comments` - Create new comment or reply
- `PUT /api/comments/:id` - Update comment content
- `DELETE /api/comments/:id` - Delete comment and handle replies
- `GET /api/comments/:id/thread` - Get full comment thread

### Interactive Features
- `POST /api/comments/:id/reactions` - Add reaction to comment
- `DELETE /api/comments/:id/reactions/:type` - Remove reaction
- `POST /api/comments/:id/attachments` - Add attachment to comment
- `DELETE /api/comments/:id/attachments/:attachmentId` - Remove attachment

### AI Agent Integration
- `POST /api/comments/:id/ai-response` - Trigger AI response to comment
- `GET /api/posts/:postId/ai-suggestions` - Get AI suggestions for post
- `POST /api/agents/:agentId/mention` - Notify AI agent of mention

### Real-time Operations
- `POST /api/comments/:id/typing` - Update typing status
- `POST /api/comments/:id/read` - Mark comment as read
- `GET /api/posts/:postId/presence` - Get users currently viewing post

## Frontend Components Enhancement

### Core Components
- `CommentThread` - Threaded comment display with nesting
- `CommentForm` - Rich text editor for creating comments
- `CommentCard` - Individual comment with reactions and actions
- `MentionAutocomplete` - AI agent and user mention suggestions
- `ReactionPicker` - Emoji reaction selector

### Rich Content Components
- `MarkdownRenderer` - Render markdown with syntax highlighting
- `AttachmentPreview` - Display comment attachments
- `LinkPreview` - Show preview cards for shared links
- `MediaGallery` - Gallery view for multiple images/videos

### Real-time Components
- `TypingIndicator` - Show who's currently typing
- `PresenceIndicator` - Display active users on post
- `NotificationToast` - Real-time comment notifications
- `ReactionAnimation` - Animated reaction feedback

## AI Agent Integration

### Agent Mention System
```typescript
type AgentMention = {
  type: 'agent'
  agentId: string
  agentName: string
  startIndex: number
  endIndex: number
  capabilities: string[] // What this agent can help with
}

type UserMention = {
  type: 'user' 
  userId: string
  username: string
  startIndex: number
  endIndex: number
}

// Enhanced mention type
type CommentMention = AgentMention | UserMention
```

### AI Response Triggers
- Mention-based responses (@agent-name)
- Keyword-based automatic responses
- Context-aware suggestions
- Scheduled check-ins on post performance

### Agent Capabilities
- **Content Optimization Agent**: Suggests improvements to post content
- **Analytics Agent**: Provides performance insights in comments
- **Scheduling Agent**: Helps with posting schedule optimization
- **Research Agent**: Provides industry insights and trends

## Technical Implementation

### Backend Services
- `EnhancedCommentsService` - Extended comment management
- `ThreadingService` - Handle comment thread operations
- `ReactionService` - Manage comment reactions
- `AIResponseService` - Coordinate AI agent responses
- `NotificationService` - Real-time comment notifications

### Frontend Implementation
- React Query for comment data management
- WebSocket integration for real-time features
- Rich text editor (e.g., TipTap or Draft.js)
- Intersection Observer for read status tracking
- Optimistic updates for smooth interactions

### Performance Optimizations
- Comment pagination with infinite scroll
- Lazy loading of nested comment threads
- Debounced typing indicators
- Efficient mention parsing and suggestions
- Cached AI response templates

## Integration Points

### Existing Systems
- Leverage existing user authentication
- Integrate with current post management
- Use established resource management for attachments
- Connect with organization permissions

### New Systems
- Link to upcoming AI agent framework
- Connect with task management system
- Integrate with analytics dashboard
- Hook into notification system

## Success Criteria
- [ ] Comments support unlimited nesting levels
- [ ] AI agents respond contextually to mentions
- [ ] Real-time updates work across all clients
- [ ] Rich content renders properly in comments
- [ ] Reaction system is intuitive and responsive
- [ ] Thread performance remains good with 100+ comments
- [ ] Mobile experience is fully functional
- [ ] AI suggestions are relevant and helpful
- [ ] Notification system doesn't spam users
- [ ] Comment search and filtering work effectively

## Dependencies
- Requires AI agent framework (Task 03)
- Needs enhanced resource management
- Depends on real-time infrastructure
- Integrates with user management system

## Estimated Timeline
- Database schema updates: 1 day
- Backend API enhancements: 4 days
- Frontend component updates: 6 days
- AI integration: 3 days
- Real-time features: 3 days
- Testing and optimization: 2 days
- **Total: 19 days**

## Migration Strategy
1. Add new database columns with defaults
2. Migrate existing comments to new structure
3. Deploy backend changes with backward compatibility
4. Gradually roll out frontend features
5. Enable AI integration after agent framework is ready

## Notes
- Maintain backward compatibility with existing comments
- Consider implementing comment moderation features
- Plan for spam detection and prevention
- Ensure accessibility compliance for all new features
- Design system should accommodate future AI agent types 