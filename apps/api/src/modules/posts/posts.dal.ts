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
  type SelectPost,
  type SelectRegularPostMedia,
} from '@bulkit/api/db/db.schema'
import { POST_TYPE_NAME, type PostType } from '@bulkit/shared/constants/db.constants'
import type { PostSchema } from '@bulkit/shared/modules/posts/posts.schemas'
import { and, asc, desc, eq, getTableColumns } from 'drizzle-orm'
import type { Static } from 'elysia'

type Post = Static<typeof PostSchema>

export async function getPost(
  db: TransactionLike,
  opts: { orgId: string; postId: string }
): Promise<Post | null> {
  const post = await db
    .select({
      id: postsTable.id,
      type: postsTable.type,
    })
    .from(postsTable)
    .where(and(eq(postsTable.id, opts.postId), eq(postsTable.organizationId, opts.orgId)))
    .then((res) => res[0] as SelectPost)

  if (!post) {
    return null
  }

  switch (post.type) {
    case 'short': {
      const lastVersion = await getLastVersion(db, shortPostsTable, post.id)

      const shortPost = await db
        .select()
        .from(shortPostsTable)
        .leftJoin(resourcesTable, eq(shortPostsTable.resourceId, resourcesTable.id))
        .where(and(eq(shortPostsTable.postId, post.id), eq(shortPostsTable.version, lastVersion)))
        .orderBy(desc(shortPostsTable.version))
        .limit(1)
        .then((res) => res[0]!)

      return {
        id: post.id,
        type: post.type,
        description: shortPost.short_posts.description,
        name: shortPost.short_posts.name,
        resource: shortPost.resources && {
          id: shortPost.resources.id,
          location: shortPost.resources.location,
          type: shortPost.resources.type,
        },
      } as Extract<Post, { type: 'short' }>
    }
    case 'post': {
      const lastVersion = await getLastVersion(db, regularPostsTable, post.id)

      const regularPosts = await db
        .select()
        .from(regularPostsTable)
        .where(
          and(eq(regularPostsTable.postId, post.id), eq(regularPostsTable.version, lastVersion))
        )
        .leftJoin(
          regularPostMediaTable,
          eq(regularPostsTable.id, regularPostMediaTable.regularPostId)
        )
        .innerJoin(resourcesTable, eq(regularPostMediaTable.resourceId, resourcesTable.id))
        .orderBy(desc(regularPostsTable.version))

      if (!regularPosts.length) {
        return null
      }

      return {
        id: post.id,
        type: post.type,
        media: regularPosts.map((p) => {
          return {
            ...(p.regular_post_media as SelectRegularPostMedia),
            resource: {
              id: p.resources.id,
              location: p.resources.location,
              type: p.resources.type,
            },
          }
        }),
        name: regularPosts[0]!.regular_posts.name,
        text: regularPosts[0]!.regular_posts.text,
      } satisfies Extract<Post, { type: 'post' }>
    }
    case 'thread': {
      const lastVersion = await getLastVersion(db, threadPostsTable, post.id)

      const threads = await db
        .select()
        .from(threadPostsTable)
        .where(and(eq(threadPostsTable.postId, post.id), eq(threadPostsTable.version, lastVersion)))
        .leftJoin(threadMediaTable, eq(threadPostsTable.id, threadMediaTable.threadPostId))
        .innerJoin(resourcesTable, eq(threadMediaTable.resourceId, resourcesTable.id))
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
          media: threads
            .filter((p) => !!p.thread_media)
            .map((p) => {
              return {
                id: p.thread_media!.id,
                order: p.thread_media!.order,
                resource: {
                  id: p.resources.id,
                  location: p.resources.location,
                  type: p.resources.type,
                },
              }
            }),
        })
      }

      return {
        id: post.id,
        type: post.type,
        name: threads[0]!.thread_posts.name,
        items,
      } as Extract<Post, { type: 'thread' }>
    }
    case 'story': {
      const lastVersion = await getLastVersion(db, storyPostsTable, post.id)

      const storyPosts = await db
        .select({
          ...getTableColumns(storyPostsTable),
          resource: resourcesTable,
        })
        .from(storyPostsTable)
        .leftJoin(resourcesTable, eq(storyPostsTable.resourceId, resourcesTable.id))
        .where(and(eq(storyPostsTable.postId, post.id), eq(storyPostsTable.version, lastVersion)))
        .orderBy(desc(storyPostsTable.version))
        .limit(1)
        .then((res) => res[0]!)

      return {
        id: post.id,
        type: post.type,
        name: storyPosts.name,

        resource: storyPosts.resource && {
          id: storyPosts.resource.id,
          location: storyPosts.resource.location,
          type: storyPosts.resource.type,
        },
      } as Extract<Post, { type: 'story' }>
    }
  }

  return null
}

export async function createPost(
  db: TransactionLike,
  opts: {
    organizationId: string
    userId: string
    type: PostType
  }
): Promise<Post> {
  const post = await db
    .insert(postsTable)
    .values({
      organizationId: opts.organizationId,
      type: opts.type,
      status: 'draft',
    })
    .returning()
    .then((res) => res[0] as SelectPost)

  const name = `${POST_TYPE_NAME[opts.type]} (${post.id})`

  switch (opts.type) {
    case 'short': {
      const shortPost = await db
        .insert(shortPostsTable)
        .values({
          name,
          createdBy: opts.userId,
          postId: post.id,
          version: 1,
          description: '',
        })
        .returning()
        .then((res) => res[0]!)

      return {
        id: post.id,
        type: post.type as 'short',
        description: shortPost.description,
        name: shortPost.name,
        resource: null,
      } as Extract<Post, { type: 'short' }>
    }
    case 'post': {
      const regularPost = await db
        .insert(regularPostsTable)
        .values({
          name,
          createdBy: opts.userId,
          postId: post.id,
          version: 1,
          text: '',
        })
        .returning()
        .then((res) => res[0]!)

      return {
        id: post.id,
        name: regularPost.name,
        text: regularPost.text,
        description: '',
        media: [],
        type: post.type as 'post',
      } as Extract<Post, { type: 'post' }>
    }

    case 'thread': {
      const threadPost = await db
        .insert(threadPostsTable)
        .values({
          name,
          postId: post.id,
          version: 1,
          createdBy: opts.userId,
          text: '',
          order: 1,
        })
        .returning()
        .then((res) => res[0]!)

      return {
        id: post.id,
        items: [{ order: 1, text: '', media: [] }],
        name: threadPost.name,
        type: post.type as 'thread',
      } as Extract<Post, { type: 'thread' }>
    }
    case 'story': {
      const storyPost = await db
        .insert(storyPostsTable)
        .values({
          name,
          postId: post.id,
          version: 1,
          createdBy: opts.userId,
        })
        .returning()
        .then((res) => res[0]!)

      return {
        id: post.id,
        name: storyPost.name,
        type: post.type as 'story',
        resource: null,
      } as Extract<Post, { type: 'story' }>
    }
    default:
      throw new Error(`Unsupported post type: ${opts.type}`)
  }
}


async function getLastVersion(db: TransactionLike, table: any, postId: string): Promise<number> {
  const result = await db
    .select({ maxVersion: table.version })
    .from(table)
    .where(eq(table.postId, postId))
    .orderBy(desc(table.version))
    .limit(1)
    .then((res) => res[0]?.maxVersion ?? 1)
  return result
}

async function getNextVersion(db: TransactionLike, table: any, postId: string): Promise<number> {
  return (await getLastVersion(db, table, postId)) + 1
}


export function updatePost