import { CommentFormEnhanced } from '../_components/comment-form-enhanced'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Badge } from '@bulkit/ui/components/ui/badge'

export default function CommentsDemo() {
  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <div className='space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold'>Enhanced TipTap Comments System</h1>
          <p className='text-muted-foreground max-w-2xl mx-auto'>
            Experience our rich text comment system with advanced mention functionality, supporting
            team members, AI agents, posts, and media files.
          </p>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold flex items-center gap-2'>✨ Rich Text Editing</h3>
                <ul className='text-sm text-muted-foreground space-y-1 ml-4'>
                  <li>• Bold, italic, and code formatting</li>
                  <li>• Automatic link detection</li>
                  <li>• Character count with warnings</li>
                  <li>• Keyboard shortcuts (Cmd/Ctrl + Enter)</li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold flex items-center gap-2'>🎯 Advanced Mentions</h3>
                <ul className='text-sm text-muted-foreground space-y-1 ml-4'>
                  <li>• Multi-level dropdown categories</li>
                  <li>• Smart search across all types</li>
                  <li>• Visual indicators and color coding</li>
                  <li>• Keyboard navigation support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mention Types */}
        <Card>
          <CardHeader>
            <CardTitle>Mention Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='text-center space-y-2'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto'>
                  <span className='text-xl'>👤</span>
                </div>
                <h3 className='font-medium'>Team Members</h3>
                <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
                  @john
                </Badge>
              </div>

              <div className='text-center space-y-2'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto'>
                  <span className='text-xl'>🤖</span>
                </div>
                <h3 className='font-medium'>AI Agents</h3>
                <Badge variant='secondary' className='bg-green-100 text-green-800'>
                  @content-optimizer
                </Badge>
              </div>

              <div className='text-center space-y-2'>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto'>
                  <span className='text-xl'>📝</span>
                </div>
                <h3 className='font-medium'>Posts</h3>
                <Badge variant='secondary' className='bg-purple-100 text-purple-800'>
                  @my-post
                </Badge>
              </div>

              <div className='text-center space-y-2'>
                <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto'>
                  <span className='text-xl'>📎</span>
                </div>
                <h3 className='font-medium'>Media Files</h3>
                <Badge variant='secondary' className='bg-orange-100 text-orange-800'>
                  @banner.jpg
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Comment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Try It Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                Start typing with <code>@</code> to see the mention dropdown in action. Try
                formatting with <strong>**bold**</strong>, <em>*italic*</em>, or <code>`code`</code>
                .
              </p>

              <CommentFormEnhanced
                entityType='post'
                entityId='demo-post'
                placeholder='Try mentioning @someone or formatting **bold** text...'
                onSuccess={() => {
                  console.log('Demo comment submitted!')
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Submit comment</span>
                  <Badge variant='outline'>Cmd/Ctrl + Enter</Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Cancel editing</span>
                  <Badge variant='outline'>Escape</Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Open mentions</span>
                  <Badge variant='outline'>@</Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Navigate mentions</span>
                  <Badge variant='outline'>Arrow keys</Badge>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Bold text</span>
                  <Badge variant='outline'>Cmd/Ctrl + B</Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Italic text</span>
                  <Badge variant='outline'>Cmd/Ctrl + I</Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Add link</span>
                  <Badge variant='outline'>Cmd/Ctrl + K</Badge>
                </div>
                <div className='flex justify-between'>
                  <span>Select mention</span>
                  <Badge variant='outline'>Enter</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-sm text-muted-foreground'>
                The enhanced comment system is designed as drop-in replacements for existing
                components:
              </p>

              <div className='bg-gray-50 p-4 rounded-md'>
                <pre className='text-xs overflow-x-auto'>
                  {`// Replace existing comment form
<CommentFormEnhanced
  entityType="post"
  entityId={postId}
  placeholder="Share your thoughts..."
  onSuccess={() => {
    // Handle successful submission
  }}
/>

// Replace existing comment card
<CommentCardEnhanced
  comment={comment}
  entityType="post"
  entityId={postId}
  maxDepth={5}
/>`}
                </pre>
              </div>

              <p className='text-xs text-muted-foreground'>
                See the full documentation in <code>README.md</code> for advanced usage and
                customization options.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
