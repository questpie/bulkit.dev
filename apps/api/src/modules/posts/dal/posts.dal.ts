import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  postDetailsTable,
  postsTable,
  regularPostMediaTable,
  regularPostsTable,
  resourcesTable,
  shortPostsTable,
  storyPostsTable,
  threadMediaTable,
  threadPostsTable,
  type InsertThreadMedia,
  type SelectPost,
  type SelectRegularPostMedia,
} from '@bulkit/api/db/db.schema'
import { getResourcePublicUrl } from '@bulkit/api/modules/resources/resource.utils'
import type { PostType } from '@bulkit/shared/constants/db.constants'
import { generateNewPostName } from '@bulkit/shared/modules/posts/post.utils'
import type { PostSchema } from '@bulkit/shared/modules/posts/posts.schemas'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, asc, desc, eq, getTableColumns } from 'drizzle-orm'
import type { Static } from 'elysia'

export type Post = Static<typeof PostSchema>

export async function getPost(
  db: TransactionLike,
  opts: { orgId: string; postId: string }
): Promise<Post | null> {
  const post = await db
    .select({
      id: postsTable.id,
      type: postsTable.type,
      status: postDetailsTable.status,
      name: postDetailsTable.name,
      currentVersion: postsTable.currentVersion,
      createdAt: postsTable.createdAt,
    })
    .from(postsTable)
    .innerJoin(postDetailsTable, eq(postsTable.id, postDetailsTable.postId))
    .where(
      and(
        eq(postsTable.id, opts.postId),
        eq(postsTable.organizationId, opts.orgId),
        eq(postDetailsTable.version, postsTable.currentVersion)
      )
    )
    .then((res) => res[0])

  appLogger.debug({ post })

  if (!post) {
    return null
  }

  switch (post.type) {
    case 'short': {
      const shortPost = await db
        .select()
        .from(shortPostsTable)
        .leftJoin(resourcesTable, eq(shortPostsTable.resourceId, resourcesTable.id))
        .where(
          and(eq(shortPostsTable.postId, post.id), eq(shortPostsTable.version, post.currentVersion))
        )
        .orderBy(desc(shortPostsTable.version))
        .limit(1)
        .then((res) => res[0]!)

      return {
        ...post,
        type: post.type,
        description: shortPost.short_posts.description,
        resource: shortPost.resources && {
          id: shortPost.resources.id,
          location: shortPost.resources.location,
          type: shortPost.resources.type,
          createdAt: shortPost.resources.createdAt,
          isExternal: shortPost.resources.isExternal,
          url: await getResourcePublicUrl(shortPost.resources),
        },
      } satisfies Extract<Post, { type: 'short' }>
    }
    case 'post': {
      const regularPosts = await db
        .select()
        .from(regularPostsTable)
        .where(
          and(
            eq(regularPostsTable.postId, post.id),
            eq(regularPostsTable.version, post.currentVersion)
          )
        )
        .leftJoin(
          regularPostMediaTable,
          eq(regularPostsTable.id, regularPostMediaTable.regularPostId)
        )
        .leftJoin(resourcesTable, eq(regularPostMediaTable.resourceId, resourcesTable.id))
        .orderBy(desc(regularPostsTable.version))

      if (!regularPosts.length) {
        return null
      }

      return {
        ...post,
        type: post.type,
        media: await Promise.all(
          regularPosts
            .filter((p) => !!p.resources && !!p.regular_post_media)
            .map(async (p) => {
              return {
                ...(p.regular_post_media as SelectRegularPostMedia),
                resource: {
                  id: p.resources!.id,
                  location: p.resources!.location,
                  type: p.resources!.type,
                  createdAt: p.resources!.createdAt,
                  isExternal: p.resources!.isExternal,
                  url: await getResourcePublicUrl(p.resources!),
                },
              }
            })
        ),
        text: regularPosts[0]!.regular_posts.text,
      } satisfies Extract<Post, { type: 'post' }>
    }
    case 'thread': {
      const threads = await db
        .select()
        .from(threadPostsTable)
        .where(
          and(
            eq(threadPostsTable.postId, post.id),
            eq(threadPostsTable.version, post.currentVersion)
          )
        )
        .leftJoin(threadMediaTable, eq(threadPostsTable.id, threadMediaTable.threadPostId))
        .leftJoin(resourcesTable, eq(threadMediaTable.resourceId, resourcesTable.id))
        .orderBy(desc(threadPostsTable.version), asc(threadPostsTable.order))

      if (!threads.length) {
        return null
      }

      const threadsOrderMap = new Map<number, typeof threads>()
      for (const thread of threads) {
        if (!threadsOrderMap.has(thread.thread_posts.order)) {
          threadsOrderMap.set(thread.thread_posts.order, [])
        }

        threadsOrderMap.get(thread.thread_posts.order)!.push(thread)
      }
      const items: Extract<Post, { type: 'thread' }>['items'] = []

      for (const [order, threads] of threadsOrderMap) {
        items.push({
          order: threads[0]!.thread_posts.order,
          text: threads[0]!.thread_posts.text,
          media: await Promise.all(
            threads
              .filter((p) => !!p.thread_media && !!p.resources)
              .map(async (p) => {
                return {
                  id: p.thread_media!.id,
                  order: p.thread_media!.order,
                  resource: {
                    id: p.resources!.id,
                    location: p.resources!.location,
                    type: p.resources!.type,
                    createdAt: p.resources!.createdAt,
                    isExternal: p.resources!.isExternal,
                    url: await getResourcePublicUrl(p.resources!),
                  },
                }
              })
          ),
        })
      }

      return {
        ...post,
        type: post.type,

        items,
      } satisfies Extract<Post, { type: 'thread' }>
    }
    case 'story': {
      const storyPosts = await db
        .select({
          ...getTableColumns(storyPostsTable),
          resource: resourcesTable,
        })
        .from(storyPostsTable)
        .leftJoin(resourcesTable, eq(storyPostsTable.resourceId, resourcesTable.id))
        .where(
          and(eq(storyPostsTable.postId, post.id), eq(storyPostsTable.version, post.currentVersion))
        )
        .orderBy(desc(storyPostsTable.version))
        .limit(1)
        .then((res) => res[0]!)

      return {
        ...post,
        type: post.type,

        resource: storyPosts.resource && {
          id: storyPosts.resource.id,
          location: storyPosts.resource.location,
          type: storyPosts.resource.type,
          createdAt: storyPosts.resource.createdAt,
          isExternal: storyPosts.resource.isExternal,
          url: await getResourcePublicUrl(storyPosts.resource),
        },
      } satisfies Extract<Post, { type: 'story' }>
    }
  }

  return null
}

export async function createPost(
  db: TransactionLike,
  opts: {
    orgId: string
    userId: string
    name?: string
    type: PostType
  }
): Promise<Post> {
  const pRaw = await db
    .insert(postsTable)
    .values({
      organizationId: opts.orgId,
      type: opts.type,
      currentVersion: 1,
    })
    .returning()
    .then((res) => res[0] as SelectPost)

  const postDetails = await db
    .insert(postDetailsTable)
    .values({
      postId: pRaw.id,
      name: opts.name || generateNewPostName(opts.type),
      version: 1,
      status: 'draft',
      createdBy: opts.userId,
    })
    .returning()
    .then((res) => res[0]!)

  const post = {
    id: pRaw.id,
    type: opts.type,
    currentVersion: 1,
    status: postDetails.status,
    name: postDetails.name,
    createdAt: pRaw.createdAt,
  }

  switch (opts.type) {
    case 'short': {
      const shortPost = await db
        .insert(shortPostsTable)
        .values({
          createdBy: opts.userId,
          postId: post.id,
          version: 1,
          description: '',
        })
        .returning()
        .then((res) => res[0]!)

      return {
        ...post,
        type: post.type as 'short',

        description: shortPost.description,
        resource: null,
      } satisfies Extract<Post, { type: 'short' }>
    }
    case 'post': {
      const regularPost = await db
        .insert(regularPostsTable)
        .values({
          createdBy: opts.userId,
          postId: post.id,
          version: 1,
          text: '',
        })
        .returning()
        .then((res) => res[0]!)

      return {
        ...post,
        type: post.type as 'post',

        text: regularPost.text,
        description: '',
        media: [],
      } as Extract<Post, { type: 'post' }>
    }

    case 'thread': {
      const threadPost = await db
        .insert(threadPostsTable)
        .values({
          postId: post.id,
          version: 1,
          createdBy: opts.userId,
          text: '',
          order: 1,
        })
        .returning()
        .then((res) => res[0]!)

      return {
        ...post,
        type: post.type as 'thread',

        items: [{ order: 1, text: '', media: [] }],
      } as Extract<Post, { type: 'thread' }>
    }
    case 'story': {
      const storyPost = await db
        .insert(storyPostsTable)
        .values({
          postId: post.id,
          version: 1,
          createdBy: opts.userId,
        })
        .returning()
        .then((res) => res[0]!)

      return {
        ...post,
        type: post.type as 'story',

        resource: null,
      } as Extract<Post, { type: 'story' }>
    }
    default:
      throw new Error(`Unsupported post type: ${opts.type}`)
  }
}

export async function updatePost(
  db: TransactionLike,
  opts: {
    orgId: string
    userId: string
    post: Post
  }
): Promise<Post | null> {
  const existingPost = await getPost(db, { orgId: opts.orgId, postId: opts.post.id })

  if (!existingPost) {
    return null
  }

  // increase post version
  const updatedPost = await db
    .update(postsTable)
    .set({
      currentVersion: existingPost.currentVersion + 1,
    })
    .where(eq(postsTable.id, opts.post.id))
    .returning({
      currentVersion: postsTable.currentVersion,
    })
    .then((res) => res[0]!)

  // update details
  const updatedDetails = await db
    .insert(postDetailsTable)
    .values({
      name: opts.post.name,
      status: opts.post.status,
      createdBy: opts.userId,
      postId: opts.post.id,
      version: updatedPost.currentVersion,
    })
    .returning()
    .then((res) => res[0]!)

  opts.post.currentVersion = updatedPost.currentVersion
  opts.post.status = updatedDetails.status
  opts.post.name = updatedDetails.name

  switch (opts.post.type) {
    case 'short':
      return await updateShortPost(db, opts as any)
    case 'post':
      return await updateRegularPost(db, opts as any)
    case 'thread':
      return await updateThreadPost(db, opts as any)
    case 'story':
      return await updateStoryPost(db, opts as any)
    default:
      throw new Error(`Unsupported post type: ${(opts.post as any).type}`)
  }
}

async function updateShortPost(
  db: TransactionLike,
  opts: {
    orgId: string
    userId: string
    post: Extract<Post, { type: 'short' }>
  }
): Promise<Post> {
  const { post, userId } = opts

  const updatedShortPost = await db
    .insert(shortPostsTable)
    .values({
      description: post.description,
      createdBy: userId,
      postId: post.id,
      version: post.currentVersion,
      resourceId: post.resource?.id ?? null,
    })
    .returning()
    .then((res) => res[0]!)

  return {
    ...post,
    description: updatedShortPost.description,
    resource: post.resource,
  }
}

async function updateRegularPost(
  db: TransactionLike,
  opts: {
    orgId: string
    userId: string
    post: Extract<Post, { type: 'post' }>
  }
): Promise<Post> {
  const { post, userId } = opts

  const updatedRegularPost = await db
    .insert(regularPostsTable)
    .values({
      text: post.text,
      createdBy: userId,
      postId: post.id,
      version: post.currentVersion,
    })
    .returning()
    .then((res) => res[0]!)

  // fix order
  const sortedMedia = post.media.sort((a, b) => a.order - b.order)
  for (let i = 0; i < sortedMedia.length; i++) {
    sortedMedia[i]!.order = i + 1
  }

  // Insert new media
  const insertedMedia = await db
    .insert(regularPostMediaTable)
    .values(
      sortedMedia.map((m) => ({
        regularPostId: updatedRegularPost.id,
        order: m.order,
        resourceId: m.resource.id,
      }))
    )
    .returning()

  const resourceByOrderMap = new Map<number, any>()
  for (const m of sortedMedia) {
    resourceByOrderMap.set(m.order, m.resource)
  }

  // just insert new media there is no need to handle _create, we just need to fix the order if not right

  return {
    ...post,
    text: updatedRegularPost.text,
    media: insertedMedia.map((m) => ({
      id: m.id,
      order: m.order,
      resource: resourceByOrderMap.get(m.order)!,
    })),
  }
}

async function updateThreadPost(
  db: TransactionLike,
  opts: {
    orgId: string
    userId: string
    post: Extract<Post, { type: 'thread' }>
  }
): Promise<Post> {
  const { post, userId } = opts

  // fix order
  const sortedItems = post.items.sort((a, b) => a.order - b.order)
  for (let i = 0; i < sortedItems.length; i++) {
    sortedItems[i]!.order = i + 1
  }

  const mediaByOrder = new Map<number, (typeof post.items)[number]['media']>()
  for (const item of post.items) {
    mediaByOrder.set(item.order, item.media)

    const sortedMedia = item.media.sort((a, b) => a.order - b.order)
    for (let i = 0; i < sortedMedia.length; i++) {
      sortedMedia[i]!.order = i + 1
    }
  }

  // Insert new thread version
  const updatedThreadPosts = await db
    .insert(threadPostsTable)
    .values(
      post.items.map((item, index) => ({
        name: post.name,
        text: item.text,
        order: item.order,
        createdBy: userId,
        postId: post.id,
        version: post.currentVersion,
      }))
    )
    .returning()

  const mediaPayload: InsertThreadMedia[] = []

  const resourceByThreadMedia = new Map<string, any>()

  for (const threadPost of updatedThreadPosts) {
    if (!mediaByOrder.has(threadPost.order) || !mediaByOrder.get(threadPost.order)?.length) {
      continue
    }

    const media = mediaByOrder.get(threadPost.order)!
    for (const m of media) {
      mediaPayload.push({
        threadPostId: threadPost.id,
        order: m.order,
        resourceId: m.resource.id,
      })
      resourceByThreadMedia.set(`${threadPost.id}-${m.order}`, m.resource)
    }
  }

  const insertedMedia = await db.insert(threadMediaTable).values(mediaPayload).returning()

  return {
    ...post,
    items: updatedThreadPosts.map((threadPost) => ({
      order: threadPost.order,
      text: threadPost.text,
      media: insertedMedia
        .filter((m) => m.threadPostId === threadPost.id)
        .map((m) => ({
          id: m.id,
          order: m.order,
          resource: resourceByThreadMedia.get(`${threadPost.id}-${m.order}`)!,
        })),
    })),
  }
}

async function updateStoryPost(
  db: TransactionLike,
  opts: {
    orgId: string
    userId: string
    post: Extract<Post, { type: 'story' }>
  }
): Promise<Extract<Post, { type: 'story' }>> {
  const { post, userId } = opts

  await db
    .insert(storyPostsTable)
    .values({
      createdBy: userId,
      postId: post.id,
      version: post.currentVersion,
      resourceId: post.resource?.id ?? null,
    })
    .returning()
    .then((res) => res[0]!)

  return {
    ...post,
    resource: post.resource,
  }
}
