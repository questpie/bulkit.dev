import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@bulkit/ui/components/ui/carousel'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { InstagramPreview } from './instagram-preview'
import { XPreview } from './x-preview'
import type { Post } from '@bulkit/shared/modules/posts/post.schemas'
import type { AggregateMetrics } from '@bulkit/shared/modules/posts/post-metrics.schemas'
import { StatCard } from './stat-card'
import { PiChatText, PiEye, PiShare, PiThumbsUp } from 'react-icons/pi'

type PostPreviewCarouselProps = {
  title: string
  posts: Array<{
    post: Post
    metrics?: AggregateMetrics
  }>
}

export function PostPreviewCarousel({ title, posts }: PostPreviewCarouselProps) {
  if (!posts.length) return null

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: 'start',
          }}
          className='w-full'
        >
          <CarouselContent>
            {posts.map(({ post, metrics }) => (
              <CarouselItem key={post.id} className='md:basis-1/2 lg:basis-1/3'>
                <div className='p-1'>
                  <Card>
                    <CardContent className='p-6'>
                      {post.platform === 'instagram' && <InstagramPreview post={post} />}
                      {post.platform === 'x' && <XPreview post={post} />}

                      {metrics && (
                        <div className='grid grid-cols-2 gap-2 mt-4'>
                          <StatCard
                            title='Impressions'
                            icon={PiEye}
                            value={metrics.impressions}
                            growth={0}
                            period='7d'
                            className={{
                              wrapper: 'h-24',
                              content: 'p-2',
                              header: 'p-2',
                            }}
                          />
                          <StatCard
                            title='Likes'
                            icon={PiThumbsUp}
                            value={metrics.likes}
                            growth={0}
                            period='7d'
                            className={{
                              wrapper: 'h-24',
                              content: 'p-2',
                              header: 'p-2',
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  )
}
