import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  postsTable,
  reelPostsTable,
  regularPostMediaTable,
  regularPostsTable,
  resourcesTable,
  scheduledPostsTable,
  storyPostsTable,
  threadMediaTable,
  threadPostsTable,
  type InsertThreadMedia,
  type SelectPost,
} from '@bulkit/api/db/db.schema'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { getResourcePublicUrl } from '@bulkit/api/modules/resources/resource.utils'
import {
  injectResourcesService,
  type ResourcesService,
} from '@bulkit/api/modules/resources/services/resources.service'
import type { Platform, PostType } from '@bulkit/shared/constants/db.constants'
import { DEFAULT_PLATFORM_SETTINGS } from '@bulkit/shared/modules/admin/platform-settings.constants'
import { generateNewPostName } from '@bulkit/shared/modules/posts/post.utils'
import type { PostSchema } from '@bulkit/shared/modules/posts/posts.schemas'
import { appLogger } from '@bulkit/shared/utils/logger'
import { and, asc, eq, getTableColumns } from 'drizzle-orm'
import type { Static } from 'elysia'

export type Post = Static<typeof PostSchema>

export type PostValidationError = {
  path: string
  message: string
}

export class PostsService {
  constructor(private readonly resourcesService: ResourcesService) {}

  async getById(
    db: TransactionLike,
    opts: { orgId: string; postId: string }
  ): Promise<Post | null> {
    const tmpPost = await db
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

    appLogger.debug({ post: tmpPost })

    if (!tmpPost) {
      return null
    }

    const channels = await db
      .select({
        id: channelsTable.id,
        platform: channelsTable.platform,
        name: channelsTable.name,
        imageUrl: channelsTable.imageUrl,
      })
      .from(channelsTable)
      .innerJoin(scheduledPostsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
      .where(eq(scheduledPostsTable.postId, tmpPost.id))

    const post = { ...tmpPost, channels }

    switch (post.type) {
      case 'reel': {
        const reelPost = await db
          .select()
          .from(reelPostsTable)
          .leftJoin(resourcesTable, eq(reelPostsTable.resourceId, resourcesTable.id))
          .where(and(eq(reelPostsTable.postId, post.id)))
          .limit(1)
          .then((res) => res[0]!)

        return {
          ...post,
          type: post.type,
          description: reelPost.reel_posts.description,
          resource: reelPost.resources && {
            id: reelPost.resources.id,
            location: reelPost.resources.location,
            type: reelPost.resources.type,
            createdAt: reelPost.resources.createdAt,
            isExternal: reelPost.resources.isExternal,
            url: await getResourcePublicUrl(reelPost.resources),
          },
        } satisfies Extract<Post, { type: 'reel' }>
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
      case 'reel': {
        const reelPost = await db
          .insert(reelPostsTable)
          .values({
            postId: post.id,
            description: '',
          })
          .returning()
          .then((res) => res[0]!)

        return {
          ...post,
          type: post.type as 'reel',
          channels: [],

          description: reelPost.description,
          resource: null,
        } satisfies Extract<Post, { type: 'reel' }>
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
          channels: [],

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
          channels: [],

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
          channels: [],

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

    const existingChannels = await db
      .select({
        id: channelsTable.id,
        platform: channelsTable.platform,
        name: channelsTable.name,
        imageUrl: channelsTable.imageUrl,
      })
      .from(channelsTable)
      .innerJoin(scheduledPostsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
      .where(eq(scheduledPostsTable.postId, existingPost.id))

    // TODO: finish
    // const channelsToAdd =
    // const channelsToRemove =

    opts.post.status = updatedPost.status
    opts.post.name = updatedPost.name
    opts.post.channels = existingChannels

    switch (opts.post.type) {
      case 'reel':
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
      post: Extract<Post, { type: 'reel' }>
    }
  ): Promise<Post> {
    const currentResourceId = await db
      .select({
        resourceId: reelPostsTable.resourceId,
      })
      .from(reelPostsTable)
      .where(eq(reelPostsTable.postId, opts.post.id))
      .then((res) => res[0]?.resourceId)

    if (currentResourceId) {
      await this.resourcesService.scheduleCleanup(db, {
        organizationId: opts.orgId,
        ids: [currentResourceId],
      })
    }

    const updatedShortPost = await db
      .update(reelPostsTable)
      .set({
        description: opts.post.description,
        resourceId: opts.post.resource?.id ?? null,
      })
      .where(and(eq(reelPostsTable.postId, opts.post.id)))
      .returning()
      .then((res) => res[0]!)

    if (updatedShortPost.resourceId) {
      this.resourcesService.approveResources(db, {
        organizationId: opts.orgId,
        ids: [updatedShortPost.resourceId],
      })
    }

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
    const previousMedia = await db
      .delete(regularPostMediaTable)
      .where(eq(regularPostMediaTable.regularPostId, updatedRegularPost.id))
      .returning({ resourceId: regularPostMediaTable.resourceId })

    await this.resourcesService.scheduleCleanup(db, {
      organizationId: opts.orgId,
      ids: previousMedia.map((m) => m.resourceId),
    })

    // schedule all previous resources for cleanup

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

    // remove all cleanup_at marks from inserted media
    await this.resourcesService.approveResources(db, {
      organizationId: opts.orgId,
      ids: insertedMedia.map((m) => m.resources.id),
    })

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

    const previousResourceIds = await db
      .select({
        resourceId: threadMediaTable.resourceId,
      })
      .from(threadMediaTable)
      .innerJoin(threadPostsTable, eq(threadPostsTable.id, threadMediaTable.threadPostId))
      .where(eq(threadPostsTable.postId, post.id))
      .then((data) => data.map((r) => r.resourceId))

    // schedule all previous resources for cleanup
    await this.resourcesService.scheduleCleanup(db, {
      organizationId: opts.orgId,
      ids: previousResourceIds,
    })

    // delete all previous thread posts, media are deleted with cascade
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

    if (insertedMedia.length) {
      await this.resourcesService.approveResources(db, {
        organizationId: opts.orgId,
        ids: insertedMedia.map((m) => m.resourceId),
      })
    }

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

    const previousResourceIds = await db
      .select({
        resourceId: storyPostsTable.resourceId,
      })
      .from(storyPostsTable)
      .where(eq(storyPostsTable.postId, post.id))
      .then((data) => data.map((r) => r.resourceId))

    // schedules previous resource for cleanup
    await this.resourcesService.scheduleCleanup(db, {
      organizationId: opts.orgId,
      ids: previousResourceIds.filter(Boolean) as string[],
    })

    await db
      .update(storyPostsTable)
      .set({
        resourceId: post.resource?.id ?? null,
      })
      .where(eq(storyPostsTable.postId, post.id))
      .returning({
        resourceId: storyPostsTable.resourceId,
      })
      .then((res) => res[0]!)

    // Update resource cleanupAt
    if (post.resource) {
      await this.resourcesService.approveResources(db, {
        organizationId: opts.orgId,
        ids: [post.resource.id],
      })
    }

    return {
      ...post,
      resource: post.resource,
    }
  }

  // async validate(post: Post) {
  //   // const platformsToValidate = post.platforms.length ? post.platforms : PLATFORMS
  //   const platformsToValidate = PLATFORMS

  //   const validationResults: Record<Platform, { errors: string[] }>
  // }

  private async validatePost(
    post: Post,
    platform: Platform
  ): Promise<{ post: Post; errors: PostValidationError[] }> {
    const settings = DEFAULT_PLATFORM_SETTINGS[platform]
    const errors: PostValidationError[] = []

    // Common validations
    if (post.name.length > 100) {
      errors.push({ path: 'name', message: 'Post name exceeds 100 characters limit' })
    }

    switch (post.type) {
      case 'post':
        if (post.text.length > settings.maxPostLength) {
          errors.push({
            path: 'text',
            message: `Post text exceeds ${settings.maxPostLength} characters limit`,
          })
        }
        if (post.media.length > settings.maxMediaPerPost) {
          errors.push({
            path: 'media',
            message: `Post exceeds ${settings.maxMediaPerPost} media items limit`,
          })
        }
        for (let i = 0; i < post.media.length; i++) {
          const media = post.media[i]!
          if (!settings.mediaAllowedMimeTypes.includes(media.resource.type)) {
            errors.push({
              path: `media.${i}.resource.type`,
              message: `Unsupported media type: ${media.resource.type}`,
            })
          }
          // Assuming resource size is available, add this check:
          // if (media.resource.size > settings.mediaMaxSizeInBytes) {
          //   errors.push({ path: `media.${i}.resource.size`, message: `Media item exceeds ${settings.mediaMaxSizeInBytes} bytes limit` });
          // }
        }
        break

      case 'reel':
        if (post.description.length > settings.maxPostLength) {
          errors.push({
            path: 'description',
            message: `Reel description exceeds ${settings.maxPostLength} characters limit`,
          })
        }
        if (post.resource && !settings.mediaAllowedMimeTypes.includes(post.resource.type)) {
          errors.push({
            path: 'resource.type',
            message: `Unsupported media type for reel: ${post.resource.type}`,
          })
        }
        // Add size check for reel resource if size is available
        break

      case 'thread': {
        const threadItems = post.items ?? []
        const threadSettings = settings.threadSettings
        if (!threadSettings) {
          throw new Error('Thread settings not found')
        }

        if (threadItems.length > threadSettings.limit) {
          errors.push({
            path: 'items',
            message: `Thread exceeds ${threadSettings.limit} items limit`,
          })
        }

        if (!threadItems.length) {
          errors.push({ path: 'items', message: 'Thread must have at least one item' })
        }

        let totalTextLength = 0
        let totalMediaCount = 0

        for (let i = 0; i < threadItems.length; i++) {
          const item = threadItems[i]!
          totalTextLength += item.text.length
          totalMediaCount += item.media.length

          for (let j = 0; j < item.media.length; j++) {
            const media = item.media[j]!
            if (!settings.mediaAllowedMimeTypes.includes(media.resource.type)) {
              errors.push({
                path: `items.${i}.media.${j}.resource.type`,
                message: `Unsupported media type in thread: ${media.resource.type}`,
              })
            }
            // Add size check for thread media if size is available
          }
        }

        switch (threadSettings.handlingStrategy) {
          case 'separate':
            for (let i = 0; i < threadItems.length; i++) {
              const item = threadItems[i]!
              if (item.text.length > settings.maxPostLength) {
                errors.push({
                  path: `items.${i}.text`,
                  message: `Thread item text exceeds ${settings.maxPostLength} characters limit`,
                })
              }
              if (item.media.length > settings.maxMediaPerPost) {
                errors.push({
                  path: `items.${i}.media`,
                  message: `Thread item exceeds ${settings.maxMediaPerPost} media items limit`,
                })
              }
            }
            break
          case 'concat':
            if (totalTextLength > settings.maxPostLength) {
              errors.push({
                path: 'items',
                message: `Total thread text exceeds ${settings.maxPostLength} characters limit`,
              })
            }
            if (totalMediaCount > settings.maxMediaPerPost) {
              errors.push({
                path: 'items',
                message: `Total thread media exceeds ${settings.maxMediaPerPost} items limit`,
              })
            }
            break
        }
        break
      }

      case 'story':
        if (post.resource && !settings.mediaAllowedMimeTypes.includes(post.resource.type)) {
          errors.push({
            path: 'resource.type',
            message: `Unsupported media type for story: ${post.resource.type}`,
          })
        }
        // Add size check for story resource if size is available
        break

      default:
        errors.push({ path: 'type', message: `Unsupported post type: ${(post as any).type}` })
    }

    return { post, errors }
  }
}

export const injectPostService = iocRegister('postService', () => {
  const container = iocResolve(ioc.use(injectResourcesService))

  return new PostsService(container.resourcesService)
})
