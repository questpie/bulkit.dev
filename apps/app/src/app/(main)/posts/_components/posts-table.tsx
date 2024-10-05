'use client'
import type { apiClient, RouteOutput } from '@bulkit/app/api/api.client'
import { POST_TYPE_ICON } from '@bulkit/app/app/(main)/posts/post.constants'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@bulkit/ui/components/ui/table'
import Link from 'next/link'
import { LuEye } from 'react-icons/lu'

export type Post = RouteOutput<typeof apiClient.posts.index.get>['data'][number]

export function PostsTable(props: { posts: Post[] }) {
  return (
    <>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              {/* <TableHead>Version</TableHead> */}
              <TableHead>Created At</TableHead>
              <TableHead>{/* Actions */}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.posts.map((post) => (
              <PostTableRow key={post.id} post={post} />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='sm:hidden px-2'>
        {props.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  )
}

type PostTableRowProps = {
  post: Post
}

export function PostTableRow(props: PostTableRowProps) {
  const Icon = POST_TYPE_ICON[props.post.type]

  return (
    <TableRow key={props.post.id}>
      <TableCell className='font-medium pl-4'>
        <div className='flex items-center gap-2'>{props.post.name}</div>
      </TableCell>
      <TableCell>
        <Badge
          variant={props.post.status === 'published' ? 'default' : 'warning'}
          className='capitalize'
        >
          {props.post.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-2'>
          <Icon className='h-4 w-4' />
          <span className='capitalize'>{props.post.type.toLowerCase()}</span>
        </div>
      </TableCell>
      {/* <TableCell>v{props.post.currentVersion}</TableCell> */}

      <TableCell suppressHydrationWarning>
        {new Date(props.post.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className='flex items-center justify-end gap-2'>
          <Button variant='ghost' asChild>
            <Link href={`/posts/${props.post.id}`}>
              <LuEye className='h-4 w-4' />
              View
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function PostCard({ post }: PostTableRowProps) {
  const Icon = POST_TYPE_ICON[post.type]

  return (
    <Link href={`/posts/${post.id}`}>
      <Card className='p-4 mb-2 '>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex-1 flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm font-bold'>{post.name}</h3>
              <Badge
                variant={post.status === 'scheduled' ? 'default' : 'warning'}
                className='capitalize'
                size='sm'
              >
                {post.status}
              </Badge>
            </div>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span className='capitalize'>{post.type.toLowerCase()}</span>
              <span>•</span>
              {/* <span>v{post.currentVersion}</span> */}
              <span>•</span>
              <span suppressHydrationWarning>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Icon className='size-6' />
        </div>
      </Card>
    </Link>
  )
}
