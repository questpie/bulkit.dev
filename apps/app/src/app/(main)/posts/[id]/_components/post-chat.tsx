import { useState } from 'react'
import { useSelectedOrganization } from '@bulkit/app/app/(main)/organizations/_components/selected-organization-provider'
import type { api } from '@bulkit/api/index'
import { cn } from '@bulkit/transactional/style-utils'
import { Avatar, AvatarImage, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import type { Button } from '@bulkit/ui/components/ui/button'
import type { Sheet, SheetContent, SheetHeader, SheetTitle } from '@bulkit/ui/components/ui/sheet'
import { useMediaQuery } from '@bulkit/ui/hooks/use-media-query'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { apiClient } from '@bulkit/app/api/api.client'
import { LuBot } from 'react-icons/lu'
import { Spinner } from '@bulkit/ui/components/ui/spinner'

type PostChatProps = {
  postId: string
}

export function PostChat(props: PostChatProps) {
  const organization = useSelectedOrganization()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isOpen, setIsOpen] = useState(false)

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', props.postId],
    // queryFn: () => apiClient.comments.list(props.postId),
  })

  const { mutate: createComment, isPending } = useMutation({
    // mutationFn: (content: string) => apiClient.comments.create(props.postId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', props.postId] })
      setContent('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    createComment(content)
  }

  const renderContent = (comment: (typeof comments)[number]) => {
    let result = comment.content
    const mentions = [...comment.mentions].sort((a, b) => b.startIndex - a.startIndex)

    for (const mention of mentions) {
      const before = result.slice(0, mention.startIndex)
      const after = result.slice(mention.endIndex)
      const mentionText = result.slice(mention.startIndex, mention.endIndex)

      result = before + `<span class="text-primary font-medium">${mentionText}</span>` + after
    }

    return <div dangerouslySetInnerHTML={{ __html: result }} />
  }

  const chatContent = (
    <div className='flex flex-col h-full'>
      <ScrollArea className='flex-1 p-4'>
        {isLoading ? (
          <div className='flex justify-center'>
            <Spinner className='w-6 h-6' />
          </div>
        ) : (
          <div className='space-y-4'>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={cn('flex gap-3', {
                  'bg-muted/50 p-4 rounded-lg': comment.isAiResponse === 'true',
                })}
              >
                <Avatar>
                  {comment.isAiResponse === 'true' ? (
                    <div className='h-full w-full flex items-center justify-center bg-primary'>
                      <LuBot className='h-4 w-4 text-primary-foreground' />
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={comment.user.image} />
                      <AvatarFallback>{comment.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>
                      {comment.isAiResponse === 'true' ? 'AI Assistant' : comment.user.name}
                    </span>
                    <span className='text-muted-foreground text-sm'>
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className='mt-1'>{renderContent(comment)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className='p-4 border-t'>
        <div className='text-sm text-muted-foreground mb-2'>
          Use @ai in your message to get AI assistance
        </div>
        <form onSubmit={handleSubmit} className='flex gap-2'>
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='Type a message...'
            disabled={isPending}
          />
          <Button type='submit' disabled={isPending || !content.trim()}>
            {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)} className='fixed bottom-4 right-4 z-50'>
          Chat
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side='bottom' className='h-[80vh]'>
            <SheetHeader>
              <SheetTitle>Post Chat</SheetTitle>
            </SheetHeader>
            {chatContent}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return chatContent
}
