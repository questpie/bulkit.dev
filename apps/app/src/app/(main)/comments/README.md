# Enhanced TipTap Comments System

This document describes the enhanced comments system that uses TipTap for rich text editing with custom mention functionality.

## Features

### Rich Text Editing
- **Bold**, *italic*, and `code` formatting
- Syntax highlighting for code blocks
- Automatic link detection and formatting
- Character count with visual warnings
- Keyboard shortcuts (Cmd/Ctrl + Enter to submit)

### Advanced Mention System
- **Multi-level mention dropdown** with categories:
  - 👤 Team Members (users in organization)
  - 🤖 AI Agents (with capabilities display)
  - 📝 Posts (existing posts and threads)
  - 📎 Media Files (uploaded resources)
- **Smart search** across all mention types
- **Visual indicators** with emojis and color coding
- **Keyboard navigation** (arrow keys, enter, escape)

### Enhanced Display
- **Rich content rendering** with proper mention highlighting
- **Interactive mentions** with hover effects
- **Simple markdown support** (bold, italic, code)
- **Responsive design** for mobile and desktop

## Components

### RichTextEditor
The main editor component with TipTap integration:

```tsx
import { RichTextEditor } from './rich-text-editor'

<RichTextEditor
  content={content}
  placeholder="Write a comment..."
  onUpdate={(content, mentions) => {
    // Handle content and mentions changes
  }}
  onSubmit={() => {
    // Handle form submission
  }}
  autoFocus={true}
  maxLength={10000}
/>
```

### CommentFormEnhanced
Complete comment form with rich text editor:

```tsx
import { CommentFormEnhanced } from './comment-form-enhanced'

<CommentFormEnhanced
  entityType="post" // or "task"
  entityId="post-123"
  parentCommentId={null} // for replies
  placeholder="Share your thoughts..."
  onSuccess={() => {
    // Handle successful submission
  }}
/>
```

### CommentCardEnhanced
Enhanced comment display with rich content rendering:

```tsx
import { CommentCardEnhanced } from './comment-card-enhanced'

<CommentCardEnhanced
  comment={comment}
  entityType="post"
  entityId="post-123"
  maxDepth={5}
  currentDepth={0}
/>
```

## Mention Types

### User Mentions
```typescript
{
  type: 'user',
  id: 'user-123',
  name: 'John Doe',
  email: 'john@company.com',
  startIndex: 0,
  endIndex: 9
}
```

### AI Agent Mentions
```typescript
{
  type: 'agent',
  id: 'agent-content-optimizer',
  name: 'Content Optimizer',
  capabilities: ['seo-analysis', 'hashtag-suggestions'],
  startIndex: 10,
  endIndex: 27
}
```

### Post Mentions
```typescript
{
  type: 'post',
  id: 'post-456',
  name: 'My Amazing Post',
  entityType: 'post',
  startIndex: 28,
  endIndex: 44
}
```

### Media Mentions
```typescript
{
  type: 'media',
  id: 'media-789',
  name: 'hero-banner.jpg',
  resourceType: 'image',
  url: 'https://example.com/hero-banner.jpg',
  startIndex: 45,
  endIndex: 61
}
```

## Usage Examples

### Basic Comment Form
```tsx
export function PostComments({ postId }: { postId: string }) {
  return (
    <div className="space-y-4">
      <CommentFormEnhanced
        entityType="post"
        entityId={postId}
        placeholder="What do you think about this post?"
      />
      <CommentList
        entityType="post"
        entityId={postId}
        showForm={false}
      />
    </div>
  )
}
```

### Task Comments with Threading
```tsx
export function TaskComments({ taskId }: { taskId: string }) {
  return (
    <CommentList
      entityType="task"
      entityId={taskId}
      showForm={true}
      maxDepth={3}
    />
  )
}
```

### Mention-Only Mode
```tsx
export function QuickMention({ onMentionSelect }: { onMentionSelect: (mention: CommentMention) => void }) {
  const editorRef = useRef<RichTextEditorRef>(null)
  
  return (
    <RichTextEditor
      ref={editorRef}
      placeholder="@mention someone..."
      onUpdate={(content, mentions) => {
        if (mentions.length > 0) {
          onMentionSelect(mentions[0])
          editorRef.current?.clear()
        }
      }}
    />
  )
}
```

## Customization

### Custom Mention Data
Replace the mock data in `mention-suggestion.ts` with actual API calls:

```typescript
export const suggestion = {
  items: async ({ query }: { query: string }) => {
    // Replace with your API calls
    const users = await apiClient.users.search.get({ query })
    const agents = await apiClient.agents.search.get({ query })
    const posts = await apiClient.posts.search.get({ query })
    const media = await apiClient.resources.search.get({ query })
    
    return [
      ...users.map(user => ({ ...user, type: 'user' as const })),
      ...agents.map(agent => ({ ...agent, type: 'agent' as const })),
      ...posts.map(post => ({ ...post, type: 'post' as const })),
      ...media.map(file => ({ ...file, type: 'media' as const })),
    ]
  },
  // ... rest of configuration
}
```

### Custom Mention Styling
Override mention colors and styles in your CSS:

```css
.mention[data-mention-type="user"] {
  @apply bg-blue-100 text-blue-800 hover:bg-blue-200;
}

.mention[data-mention-type="agent"] {
  @apply bg-green-100 text-green-800 hover:bg-green-200;
}

.mention[data-mention-type="post"] {
  @apply bg-purple-100 text-purple-800 hover:bg-purple-200;
}

.mention[data-mention-type="media"] {
  @apply bg-orange-100 text-orange-800 hover:bg-orange-200;
}
```

## Integration Points

### With Existing Comments System
The enhanced components are designed to be drop-in replacements:

1. Replace `CommentForm` with `CommentFormEnhanced`
2. Replace `CommentCard` with `CommentCardEnhanced`
3. Update your comment display logic to handle rich content

### With AI Agents
When AI agents are mentioned, you can trigger responses:

```typescript
const handleMentionCreate = (mention: CommentMention) => {
  if (mention.type === 'agent') {
    // Trigger AI agent response
    apiClient.agents.mention.post({
      agentId: mention.id,
      commentId: comment.id,
      context: extractContext(comment)
    })
  }
}
```

### With Real-time Updates
The mention system works with your existing real-time infrastructure:

```typescript
// In your WebSocket handler
pusher.trigger('comments', 'new-mention', {
  mentionType: mention.type,
  mentionId: mention.id,
  commentId: comment.id,
  userId: user.id
})
```

## Keyboard Shortcuts

- `Cmd/Ctrl + Enter` - Submit comment
- `Escape` - Cancel editing/close mention dropdown
- `@` - Open mention dropdown
- `Arrow keys` - Navigate mentions
- `Enter` - Select mention
- `Cmd/Ctrl + B` - Bold
- `Cmd/Ctrl + I` - Italic
- `Cmd/Ctrl + K` - Add link

## Performance Considerations

- Mentions are loaded asynchronously with debounced search
- Rich content rendering is optimized for large comment threads
- Component re-renders are minimized with React.memo and useMemo
- TipTap editor is destroyed and recreated only when necessary

## Future Enhancements

- [ ] File drag & drop for attachments
- [ ] Emoji picker integration
- [ ] Advanced formatting (tables, lists)
- [ ] Comment templates
- [ ] Voice-to-text input
- [ ] Collaborative editing
- [ ] Comment analytics and insights 