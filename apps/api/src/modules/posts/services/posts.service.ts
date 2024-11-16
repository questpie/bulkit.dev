import { coalesce } from '@bulkit/api/db/db-utils'
import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  postMetricsHistoryTable,
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
} from '@bulkit/api/db/db.schema'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import { PostCantBeDeletedException } from '@bulkit/api/modules/posts/exceptions/post-cant-be-deleted.exception'
import { injectPublishPostJob } from '@bulkit/api/modules/posts/jobs/publish-post.job'
import {
  getResourcePublicUrl,
  isMediaTypeAllowed,
} from '@bulkit/api/modules/resources/resource.utils'
import {
  injectResourcesService,
  type ResourcesService,
} from '@bulkit/api/modules/resources/services/resources.service'
import { PLATFORMS, type Platform, type PostType } from '@bulkit/shared/constants/db.constants'
import { DEFAULT_PLATFORM_SETTINGS } from '@bulkit/shared/modules/admin/platform-settings.constants'
import type {
  PostChannel,
  PostSchema,
  PostValidationErrorSchema,
  PostValidationResultSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { generateNewPostName, isPostDeletable } from '@bulkit/shared/modules/posts/posts.utils'
import { dedupe } from '@bulkit/shared/types/data'
import { addSeconds, isBefore, max } from 'date-fns'
import { and, asc, eq, getTableColumns, inArray, or, sql } from 'drizzle-orm'
import type { Static } from 'elysia'
import { HttpError } from 'elysia-http-error'

export type Post = Static<typeof PostSchema>

export class PostsService {
  constructor(private readonly resourcesService: ResourcesService) {}

  async getById(
    db: TransactionLike,
    opts: { orgId?: string; postId: string }
  ): Promise<Post | null> {
    const tmpPost = await db
      .select({
        id: postsTable.id,
        type: postsTable.type,
        status: postsTable.status,
        name: postsTable.name,
        createdAt: postsTable.createdAt,

        totalLikes: coalesce(
          sql<number>`cast(sum(${postMetricsHistoryTable.likes}) as int)`,
          sql<number>`0`
        ),
        totalImpressions: coalesce(
          sql<number>`cast(sum(${postMetricsHistoryTable.impressions}) as int)`,
          sql<number>`0`
        ),
        totalComments: coalesce(
          sql<number>`cast(sum(${postMetricsHistoryTable.comments}) as int)`,
          sql<number>`0`
        ),
        totalShares: coalesce(
          sql<number>`cast(sum(${postMetricsHistoryTable.shares}) as int)`,
          sql<number>`0`
        ),

        scheduledAt: postsTable.scheduledAt,
      })
      .from(postsTable)
      .where(
        and(
          eq(postsTable.id, opts.postId),
          opts.orgId ? eq(postsTable.organizationId, opts.orgId) : undefined
        )
      )
      .leftJoin(scheduledPostsTable, eq(postsTable.id, scheduledPostsTable.postId))
      .leftJoin(
        postMetricsHistoryTable,
        eq(postMetricsHistoryTable.scheduledPostId, scheduledPostsTable.id)
      )
      .groupBy(postsTable.id)
      .then((res) => res[0])

    if (!tmpPost) {
      return null
    }

    const post = { ...tmpPost, channels: await this.getPostChannels(db, tmpPost.id) }

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
      .then((res) => ({
        ...res[0]!,
        channels: [],
        totalComments: 0,
        totalImpressions: 0,
        totalLikes: 0,
        totalShares: 0,
      }))

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
        throw HttpError.Internal(`Unsupported post type: ${opts.type}`)
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
        scheduledAt: opts.post.scheduledAt,
      })
      .where(eq(postsTable.id, opts.post.id))
      .returning()
      .then((res) => res[0]!)

    // Update channels
    await this.updatePostChannels(db, {
      orgId: opts.orgId,
      postId: opts.post.id,
      existingChannels: existingPost.channels,
      newChannels: opts.post.channels,
    })
    opts.post.status = updatedPost.status
    opts.post.name = updatedPost.name

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
        throw HttpError.Internal(`Unsupported post type: ${(opts.post as any).type}`)
    }
  }

  private async getPostChannels(db: TransactionLike, postId: string): Promise<PostChannel[]> {
    return db
      .select({
        id: channelsTable.id,
        platform: channelsTable.platform,
        name: channelsTable.name,
        imageUrl: channelsTable.imageUrl,

        scheduledPost: {
          id: scheduledPostsTable.id,
          status: scheduledPostsTable.status,
          scheduledAt: scheduledPostsTable.scheduledAt,
          startedAt: scheduledPostsTable.startedAt,
          publishedAt: scheduledPostsTable.publishedAt,
          failedAt: scheduledPostsTable.failedAt,
          failureReason: scheduledPostsTable.failureReason,
          parentPostId: scheduledPostsTable.parentPostId,
          parentPostSettings: scheduledPostsTable.parentPostSettings,
          repostSettings: scheduledPostsTable.repostSettings,
        },
      })
      .from(channelsTable)
      .innerJoin(scheduledPostsTable, eq(scheduledPostsTable.channelId, channelsTable.id))
      .where(eq(scheduledPostsTable.postId, postId))
  }

  private async updatePostChannels(
    db: TransactionLike,
    opts: {
      orgId: string
      postId: string
      existingChannels: PostChannel[]
      newChannels: PostChannel[]
    }
  ): Promise<PostChannel[]> {
    const existingChannelMap = new Map(opts.existingChannels.map((c) => [c.id, c]))
    const channelsToAdd: PostChannel[] = []
    const channelsToUpdate: PostChannel[] = []
    const deduplicatedInputChannels = dedupe(opts.newChannels, (d) => d.id)

    for (const channel of deduplicatedInputChannels) {
      if (!existingChannelMap.has(channel.id)) {
        channelsToAdd.push(channel)
        continue
      }

      if (existingChannelMap.has(channel.id)) {
        channelsToUpdate.push(channel)
        existingChannelMap.delete(channel.id)
      }
    }

    const channelsToRemove = Array.from(existingChannelMap.values())

    const promises: Promise<any>[] = []
    if (channelsToRemove.length > 0) {
      promises.push(
        db
          .delete(scheduledPostsTable)
          .where(
            and(
              eq(scheduledPostsTable.postId, opts.postId),
              inArray(
                scheduledPostsTable.channelId,
                channelsToRemove.map((c) => c.id)
              )
            )
          )
          .execute()
      )
    }

    if (channelsToAdd.length > 0) {
      promises.push(
        db
          .insert(scheduledPostsTable)
          .values(
            channelsToAdd.map((c) => ({
              postId: opts.postId,
              channelId: c.id,
              organizationId: opts.orgId,
            }))
          )
          .execute()
      )
    }

    for (const channel of channelsToUpdate) {
      if (!channel.scheduledPost) continue
      promises.push(
        db
          .update(scheduledPostsTable)
          .set({
            publishedAt: channel.scheduledPost.publishedAt,
            scheduledAt: channel.scheduledPost.scheduledAt,
            parentPostId: channel.scheduledPost.parentPostId,
            parentPostSettings: channel.scheduledPost.parentPostSettings,
            repostSettings: channel.scheduledPost.repostSettings,
          })
          .where(
            and(
              eq(scheduledPostsTable.postId, opts.postId),
              eq(scheduledPostsTable.channelId, channel.id)
            )
          )
          .execute()
      )
    }

    // Remove channels post connections
    await Promise.all([promises])

    return this.getPostChannels(db, opts.postId)
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

  async deleteById(
    db: TransactionLike,
    opts: {
      orgId: string
      postId: string
    }
  ): Promise<null | Post> {
    // First, check if the post exists and is in a deletable state
    const post = await this.getById(db, opts)

    if (!post) {
      return null // Post not found or not in a deletable state
    }

    if (!isPostDeletable(post)) {
      throw new PostCantBeDeletedException(post.id)
    }

    // Delete associated resources
    await this.deleteAssociatedResources(db, opts.postId, opts.orgId)

    // Delete the post
    await db.delete(postsTable).where(eq(postsTable.id, opts.postId)).execute()

    return post
  }

  private async deleteAssociatedResources(
    db: TransactionLike,
    postId: string,
    orgId: string
  ): Promise<void> {
    // Get all resource IDs associated with the post
    const resourceIds = await db
      .select({ resourceId: resourcesTable.id })
      .from(resourcesTable)
      .leftJoin(regularPostMediaTable, eq(regularPostMediaTable.resourceId, resourcesTable.id))
      .innerJoin(regularPostsTable, eq(regularPostsTable.id, regularPostMediaTable.regularPostId))
      .leftJoin(threadMediaTable, eq(threadMediaTable.resourceId, resourcesTable.id))
      .innerJoin(threadPostsTable, eq(threadPostsTable.id, threadMediaTable.threadPostId))
      .leftJoin(reelPostsTable, eq(reelPostsTable.resourceId, resourcesTable.id))
      .leftJoin(storyPostsTable, eq(storyPostsTable.resourceId, resourcesTable.id))
      .where(
        or(
          eq(regularPostsTable.postId, postId),
          eq(threadPostsTable.postId, postId),
          eq(reelPostsTable.postId, postId),
          eq(storyPostsTable.postId, postId)
        )
      )
      .then((res) => res.map((r) => r.resourceId).filter((id): id is string => id !== null))

    // Schedule cleanup for these resources
    if (resourceIds.length > 0) {
      await this.resourcesService.scheduleCleanup(db, {
        organizationId: orgId,
        ids: resourceIds,
      })
    }
  }

  async archiveById(
    db: TransactionLike,
    opts: {
      orgId: string
      postId: string
    }
  ) {
    return db
      .update(postsTable)
      .set({ archivedAt: new Date().toISOString() })
      .where(and(eq(postsTable.id, opts.postId), eq(postsTable.organizationId, opts.orgId)))
      .returning()
      .then((res) => res[0])
  }

  async validate(post: Post): Promise<Static<typeof PostValidationResultSchema> | null> {
    // const platformsToValidate = post.platforms.length ? post.platforms : PLATFORMS
    const platformsToValidate = dedupe(post.channels, (c) => c.platform).map((c) => c.platform)

    const validationResults = Object.fromEntries(
      PLATFORMS.map((platform) => [platform, []])
    ) as unknown as Static<typeof PostValidationResultSchema>['platforms']

    const commonErrors = await this.validateCommon(post)

    let isInvalid = commonErrors.length > 0

    for (const platform of platformsToValidate) {
      const errors = await this.validatePost(post, platform)
      if (errors.length) {
        isInvalid = true
        validationResults[platform] = errors
      }
    }

    return isInvalid
      ? {
          common: commonErrors,
          platforms: validationResults,
        }
      : null
  }

  private async validateCommon(post: Post): Promise<Static<typeof PostValidationErrorSchema>[]> {
    const errors: Static<typeof PostValidationErrorSchema>[] = []
    // Common validations
    if (post.name.length > 100) {
      errors.push({ path: 'name', message: 'Post name exceeds 100 characters limit' })
    }

    if (post.channels.length === 0) {
      errors.push({ path: 'channels', message: 'Post must have at least one channel' })
    }
    switch (post.type) {
      case 'reel':
        if (!post.resource) {
          errors.push({
            path: 'resource',
            message: 'Reel media is required',
          })
        }
        break
      case 'story':
        if (!post.resource) {
          errors.push({
            path: 'resource',
            message: 'Story media is required',
          })
        }
        break
    }

    return errors
  }

  private async validatePost(
    post: Post,
    platform: Platform
  ): Promise<Static<typeof PostValidationErrorSchema>[]> {
    const settings = DEFAULT_PLATFORM_SETTINGS[platform]
    const errors: Static<typeof PostValidationErrorSchema>[] = []

    // Helper function to check if a MIME type is a video
    const isVideoType = (mimeType: string) =>
      mimeType.startsWith('video/') ||
      mimeType === 'application/x-mpegURL' ||
      mimeType === 'application/dash+xml'

    // Helper function to validate media combination rules
    const validateMediaCombination = (mediaItems: { resource: { type: string } }[]) => {
      if (settings.mediaCombineType === 'images-only') {
        const hasVideo = mediaItems.some((m) => isVideoType(m.resource.type))
        if (hasVideo && mediaItems.length > 1) {
          errors.push({
            path: 'media',
            message: 'When including video, only single media item is allowed',
          })
        }
      }
    }

    switch (post.type) {
      case 'post':
        if (post.text.length > settings.maxPostLength) {
          errors.push({
            path: 'text',
            message: `Post text exceeds ${settings.maxPostLength} characters limit`,
          })
        }
        if (post.media.length < settings.minMediaPerPost) {
          errors.push({
            path: 'media',
            message: `Post requires at least ${settings.minMediaPerPost} media item(s)`,
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
          if (!isMediaTypeAllowed(settings.mediaAllowedMimeTypes, media.resource.type)) {
            errors.push({
              path: `media.${i}.resource`,
              message: `Unsupported media type: ${media.resource.type}`,
            })
          }
          // Assuming resource size is available, add this check:
          // if (media.resource.size > settings.mediaMaxSizeInBytes) {
          //   errors.push({ path: `media.${i}.resource.size`, message: `Media item exceeds ${settings.mediaMaxSizeInBytes} bytes limit` });
          // }
        }

        // Add media combination validation
        if (post.media.length > 1) {
          validateMediaCombination(post.media)
        }
        break

      case 'reel':
        if (post.description.length > settings.maxPostLength) {
          errors.push({
            path: 'description',
            message: `Reel description exceeds ${settings.maxPostLength} characters limit`,
          })
        }
        if (
          post.resource &&
          !isMediaTypeAllowed(settings.mediaAllowedMimeTypes, post.resource.type)
        ) {
          errors.push({
            path: 'resource',
            message: `Unsupported media type for reel: ${post.resource.type}`,
          })
        }
        break

      case 'thread': {
        const threadItems = post.items ?? []
        const threadSettings = settings.threadSettings
        if (!threadSettings) {
          throw HttpError.Internal('Thread settings not found')
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
            if (!isMediaTypeAllowed(settings.mediaAllowedMimeTypes, media.resource.type)) {
              errors.push({
                path: `items.${i}.media.${j}.resource`,
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

              if (item.media.length < settings.minMediaPerPost) {
                errors.push({
                  path: `items.${i}.media`,
                  message: `Thread item requires at least ${settings.minMediaPerPost} media item(s)`,
                })
              }

              // Add media combination validation for each thread item
              if (item.media.length > 1) {
                validateMediaCombination(item.media)
              }
            }
            break
          case 'concat': {
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
            } else if (totalMediaCount < settings.minMediaPerPost) {
              errors.push({
                path: 'items',
                message: `Thread requires at least ${settings.minMediaPerPost} media item(s) in total`,
              })
            }

            // Add media combination validation for all thread items combined
            const allMedia = threadItems.flatMap((item) => item.media)
            if (allMedia.length > 1) {
              validateMediaCombination(allMedia)
            }
            break
          }
        }
        break
      }

      case 'story':
        if (
          post.resource &&
          !isMediaTypeAllowed(settings.mediaAllowedMimeTypes, post.resource.type)
        ) {
          errors.push({
            path: 'resource',
            message: `Unsupported media type for story: ${post.resource.type}`,
          })
        }
        // Add size check for story resource if size is available
        break

      default:
        errors.push({ path: 'type', message: `Unsupported post type: ${(post as any).type}` })
    }

    return errors
  }

  async returnToDraft(
    db: TransactionLike,
    opts: {
      orgId: string
      postId: string
    }
  ): Promise<Post | null> {
    const post = await this.getById(db, opts)
    const container = iocResolve(ioc.use(injectPublishPostJob))

    if (!post || post.status !== 'scheduled') {
      return null
    }

    // Get all scheduled post IDs that might have running jobs
    const scheduledPostIds = post.channels
      .filter((channel) => channel.scheduledPost?.status === 'scheduled')
      .map((channel) => channel.scheduledPost!.id)

    const updatedPost = await db
      .update(postsTable)
      .set({
        status: 'draft',
        scheduledAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(postsTable.id, opts.postId))
      .returning()
      .then((res) => res[0]!)

    // Update all scheduled posts to draft
    await db
      .update(scheduledPostsTable)
      .set({
        status: 'draft',
        scheduledAt: null,
      })
      .where(eq(scheduledPostsTable.postId, opts.postId))
      .execute()

    await Promise.all(
      scheduledPostIds.map(
        (id) => container.jobPublishPost.remove(id).catch(() => null) // Ignore errors if job doesn't exist
      )
    )

    return {
      ...post,
      status: 'draft',
      scheduledAt: null,
    }
  }

  async rename(
    db: TransactionLike,
    opts: {
      orgId: string
      postId: string
      name: string
    }
  ): Promise<Post | null> {
    const post = await this.getById(db, opts)

    if (!post) {
      return null
    }

    await db
      .update(postsTable)
      .set({
        name: opts.name,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(postsTable.id, opts.postId))
      .then((r) => r[0]!)

    return {
      ...post,
      name: opts.name,
    }
  }

  async publish(
    db: TransactionLike,
    opts: {
      orgId: string
      postId: string
    }
  ): Promise<Post> {
    const container = iocResolve(ioc.use(injectPublishPostJob))
    const post = await this.getById(db, {
      orgId: opts.orgId,
      postId: opts.postId,
    })

    if (!post) {
      throw HttpError.NotFound('Post not found')
    }

    // validate
    const errors = await this.validate(post)
    if (errors) {
      throw HttpError.BadGateway('Post validation failed', {
        errors: errors,
      })
    }

    const areAllScheduledPostsDraft = post.channels.every(
      (channel) => channel.scheduledPost?.status === 'draft'
    )

    if (post.status !== 'draft' || !areAllScheduledPostsDraft) {
      throw HttpError.BadGateway(
        'Cannot publish post already scheduled post. Please bring post back to draft and schedule again'
      )
    }

    const scheduledPosts = await db.transaction(async (trx) => {
      const scheduledPosts: { scheduledPostId: string; delay: number }[] = []
      let earliestScheduledAt: Date | null = null

      for (const channel of post.channels) {
        if (!channel.scheduledPost) continue

        const userDefinedScheduledAt = channel.scheduledPost.scheduledAt ?? post.scheduledAt
        const scheduledAtClamped = userDefinedScheduledAt
          ? max([new Date(userDefinedScheduledAt), addSeconds(new Date(), 1)])
          : new Date()

        if (earliestScheduledAt === null || isBefore(scheduledAtClamped, earliestScheduledAt)) {
          earliestScheduledAt = scheduledAtClamped
        }

        const delay = Math.max(new Date(scheduledAtClamped).getTime() - new Date().getTime(), 1000)

        await trx
          .update(scheduledPostsTable)
          .set({
            status: 'scheduled',
            ...(channel.scheduledPost.scheduledAt
              ? { scheduledAt: scheduledAtClamped.toISOString() }
              : {}),
          })
          .where(eq(scheduledPostsTable.id, channel.scheduledPost!.id))

        scheduledPosts.push({ scheduledPostId: channel.scheduledPost!.id, delay })
      }

      await trx
        .update(postsTable)
        .set({
          status: post.status === 'draft' ? 'scheduled' : post.status,
          scheduledAt: post.scheduledAt ?? earliestScheduledAt?.toISOString(),
        })
        .where(eq(postsTable.id, post.id))

      return scheduledPosts
    })

    // Schedule the jobs
    for (const { scheduledPostId, delay } of scheduledPosts) {
      await container.jobPublishPost.invoke(
        { scheduledPostId },
        {
          jobId: scheduledPostId,
          delay,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      )
    }

    return {
      ...post,
      status: 'scheduled',
    }
  }
}

export const injectPostService = iocRegister('postService', () => {
  const container = iocResolve(ioc.use(injectResourcesService))
  return new PostsService(container.resourcesService)
})
