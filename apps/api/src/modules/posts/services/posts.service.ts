import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
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
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import { getResourcePublicUrl } from '@bulkit/api/modules/resources/resource.utils'
import type { PostType } from '@bulkit/shared/constants/db.constants'
import { generateNewPostName } from '@bulkit/shared/modules/posts/post.utils'
import type { PostSchema } from '@bulkit/shared/modules/posts/posts.schemas'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, asc, eq, getTableColumns } from 'drizzle-orm'
import { Elysia, type Static } from 'elysia'

export type Post = Static<typeof PostSchema>

export class PostsService {
  async getById(
    db: TransactionLike,
    opts: { orgId: string; postId: string }
  ): Promise<Post | null> {
    const post = await db
      .select({
        id: postsTable.id,
        type: postsTable.type,
        status: postsTable.status,
        name: postsTable.name,
        createdAt: postsTable.createdAt,
      })
      .from(postsTable)
      .where(and(eq(postsTable.id, opts.postId), eq(postsTable.organizationId, opts.orgId)))
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
          .where(and(eq(shortPostsTable.postId, post.id)))
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
          .where(and(eq(regularPostsTable.postId, post.id)))
          .leftJoin(
            regularPostMediaTable,
            eq(regularPostsTable.id, regularPostMediaTable.regularPostId)
          )
          .leftJoin(resourcesTable, eq(regularPostMediaTable.resourceId, resourcesTable.id))
          .orderBy(asc(regularPostMediaTable.order))

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
                  id: p.regular_post_media!.id,
                  order: p.regular_post_media!.order,
                  resource: {
                    id: p.resources!.id,
                    location: p.resources!.location,
                    type: p.resources!.type,
                    createdAt: p.resources!.createdAt,
                    isExternal: p.resources!.isExternal,
                    url: await getResourcePublicUrl(p.resources!),
                  },
                } satisfies Extract<Post, { type: 'post' }>['media'][number]
              })
          ),
          text: regularPosts[0]!.regular_posts.text,
        } satisfies Extract<Post, { type: 'post' }>
      }
      case 'thread': {
        const threads = await db
          .select()
          .from(threadPostsTable)
          .where(and(eq(threadPostsTable.postId, post.id)))
          .leftJoin(threadMediaTable, eq(threadPostsTable.id, threadMediaTable.threadPostId))
          .leftJoin(resourcesTable, eq(threadMediaTable.resourceId, resourcesTable.id))
          .orderBy(asc(threadPostsTable.order))

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
            id: threads[0]!.thread_posts.id,
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
          .where(and(eq(storyPostsTable.postId, post.id)))
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

  async create(
    db: TransactionLike,
    opts: {
      orgId: string
      name?: string
      type: PostType
    }
  ): Promise<Post> {
    const post = await db
      .insert(postsTable)
      .values({
        organizationId: opts.orgId,
        type: opts.type,
        name: opts.name || generateNewPostName(opts.type),
        status: 'draft',
      })
      .returning()
      .then((res) => res[0] as SelectPost)

    switch (opts.type) {
      case 'short': {
        const shortPost = await db
          .insert(shortPostsTable)
          .values({
            postId: post.id,
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
            postId: post.id,
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
            text: '',
            order: 1,
          })
          .returning()
          .then((res) => res[0]!)

        return {
          ...post,
          type: post.type as 'thread',

          items: [{ order: 1, text: '', media: [], id: threadPost.id }],
        } as Extract<Post, { type: 'thread' }>
      }
      case 'story': {
        const storyPost = await db
          .insert(storyPostsTable)
          .values({
            postId: post.id,
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
  async update(
    db: TransactionLike,
    opts: {
      orgId: string
      post: Post
    }
  ): Promise<Post | null> {
    const existingPost = await this.getById(db, { orgId: opts.orgId, postId: opts.post.id })

    if (!existingPost) {
      return null
    }

    // Increase post version
    const updatedPost = await db
      .update(postsTable)
      .set({
        updatedAt: new Date().toISOString(),
        name: opts.post.name,
        status: opts.post.status,
      })
      .where(eq(postsTable.id, opts.post.id))
      .returning()
      .then((res) => res[0]!)

    opts.post.status = updatedPost.status
    opts.post.name = updatedPost.name

    switch (opts.post.type) {
      case 'short':
        return await this.updateShortPost(db, { ...opts } as any)
      case 'post':
        return await this.updateRegularPost(db, { ...opts } as any)
      case 'thread':
        return await this.updateThreadPost(db, { ...opts } as any)
      case 'story':
        return await this.updateStoryPost(db, { ...opts } as any)
      default:
        throw new Error(`Unsupported post type: ${(opts.post as any).type}`)
    }
  }

  private async updateShortPost(
    db: TransactionLike,
    opts: {
      orgId: string
      post: Extract<Post, { type: 'short' }>
    }
  ): Promise<Post> {
    const updatedShortPost = await db
      .update(shortPostsTable)
      .set({
        description: opts.post.description,
        resourceId: opts.post.resource?.id ?? null,
      })
      .where(and(eq(shortPostsTable.postId, opts.post.id)))
      .returning()
      .then((res) => res[0]!)

    return {
      ...opts.post,
      description: updatedShortPost.description,
      resource: opts.post.resource,
    }
  }

  private async updateRegularPost(
    db: TransactionLike,
    opts: {
      orgId: string
      post: Extract<Post, { type: 'post' }>
    }
  ): Promise<Post> {
    const { post } = opts

    const updatedRegularPost = await db
      .update(regularPostsTable)
      .set({
        text: post.text,
      })
      .where(eq(regularPostsTable.postId, post.id))
      .returning()
      .then((res) => res[0]!)

    // Fix order
    const sortedMedia = post.media.sort((a, b) => a.order - b.order)
    for (let i = 0; i < sortedMedia.length; i++) {
      sortedMedia[i]!.order = i + 1
    }

    // delete previous media
    await db
      .delete(regularPostMediaTable)
      .where(eq(regularPostMediaTable.regularPostId, updatedRegularPost.id))

    // Insert new media
    if (sortedMedia.length) {
      await db
        .insert(regularPostMediaTable)
        .values(
          sortedMedia.map((m) => ({
            regularPostId: updatedRegularPost.id,
            order: m.order,
            resourceId: m.resource.id,
          }))
        )
        .returning()
    }

    const insertedMedia = await db
      .select()
      .from(regularPostMediaTable)
      .where(eq(regularPostMediaTable.regularPostId, updatedRegularPost.id))
      .orderBy(asc(regularPostMediaTable.order))
      .innerJoin(resourcesTable, eq(resourcesTable.id, regularPostMediaTable.resourceId))

    return {
      ...post,
      text: updatedRegularPost.text,
      media: await Promise.all(
        insertedMedia.map(async (m) => ({
          id: m.regular_post_media.id,
          order: m.regular_post_media.order,
          resource: {
            id: m.resources.id,
            createdAt: m.resources.createdAt,
            isExternal: m.resources.isExternal,
            location: m.resources.location,
            type: m.resources.type,
            url: await getResourcePublicUrl(m.resources),
          },
        }))
      ),
    }
  }

  private async updateThreadPost(
    db: TransactionLike,
    opts: {
      orgId: string
      post: Extract<Post, { type: 'thread' }>
    }
  ): Promise<Post> {
    const { post } = opts

    // Fix order
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

    // delete all previous thread posts, media are automatically deleted by cascade
    await db.delete(threadPostsTable).where(eq(threadPostsTable.postId, post.id))

    // Insert new thread version
    const newThreadPosts = await db
      .insert(threadPostsTable)
      .values(
        post.items.map((item, index) => ({
          name: post.name,
          text: item.text,
          order: item.order,
          postId: post.id,
        }))
      )
      .returning()

    const mediaPayload: InsertThreadMedia[] = []

    const resourceByThreadMedia = new Map<string, any>()

    for (const threadPost of newThreadPosts) {
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

    const insertedMedia = mediaPayload.length
      ? await db.insert(threadMediaTable).values(mediaPayload).returning()
      : []

    return {
      ...post,
      items: newThreadPosts.map((threadPost) => ({
        id: threadPost.id,
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

  private async updateStoryPost(
    db: TransactionLike,
    opts: {
      orgId: string
      post: Extract<Post, { type: 'story' }>
    }
  ): Promise<Extract<Post, { type: 'story' }>> {
    const { post } = opts

    await db
      .update(storyPostsTable)
      .set({
        resourceId: post.resource?.id ?? null,
      })
      .where(eq(storyPostsTable.postId, post.id))
      .returning()
      .then((res) => res[0]!)

    return {
      ...post,
      resource: post.resource,
    }
  }
}

export const postServicePlugin = () =>
  ioc.use(
    new Elysia({
      name: 'ioc.PostsService',
    }).decorate('postService', new PostsService())
  )
