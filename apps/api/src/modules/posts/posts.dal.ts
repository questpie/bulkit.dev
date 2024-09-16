import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  postsTable,
  regularPostMediaTable,
  regularPostsTable,
  resourcesTable,
  selectPostSchema,
  selectRegularPostMediaSchema,
  selectRegularPostSchema,
  selectResourceSchema,
  selectShortPostSchema,
  selectStoryPostSchema,
  selectThreadMediaSchema,
  selectThreadPostSchema,
  shortPostsTable,
  storyPostsTable,
  threadMediaTable,
  threadPostsTable,
  type SelectPost,
  type SelectRegularPostMedia,
  type SelectThreadMedia,
} from '@bulkit/api/db/db.schema'
import { POST_TYPE, POST_TYPE_NAME, type PostType } from '@bulkit/shared/constants/db.constants'
import { StringLiteralEnum } from '@bulkit/shared/schemas/misc'
import { and, desc, eq, getTableColumns } from 'drizzle-orm'
import { t, type Static } from 'elysia'

export const PostWithDataSelectSchema = t.Composite([
  t.Omit(selectPostSchema, ['type']),
  t.Union([
    t.Object({
      type: t.Literal('short'),
      data: t.Composite([
        selectShortPostSchema,
        t.Object({ resource: t.Nullable(selectResourceSchema) }),
      ]),
    }),
    t.Object({
      type: t.Literal('post'),
      data: t.Composite([
        selectRegularPostSchema,
        t.Object({
          media: t.Array(
            t.Composite([
              selectRegularPostMediaSchema,
              t.Object({ resource: selectResourceSchema }),
            ]),
            { default: [] }
          ),
        }),
      ]),
    }),
    t.Object({
      type: t.Literal('thread'),
      data: t.Composite([
        selectThreadPostSchema,
        t.Object({
          media: t.Array(
            t.Composite([selectThreadMediaSchema, t.Object({ resource: selectResourceSchema })]),
            { default: [] }
          ),
        }),
      ]),
    }),
    t.Object({
      type: t.Literal('story'),
      data: t.Composite([
        selectStoryPostSchema,
        t.Object({ resource: t.Nullable(selectResourceSchema) }),
      ]),
    }),
  ]),
])
export const PostWithDataInsertSchema = t.Object({
  type: StringLiteralEnum(POST_TYPE),
})
export const PostWithDataUpdateSchema = t.Object({
  postId: t.String(),
  data: t.Union([
    t.Omit(selectShortPostSchema, ['postId', 'version', 'createdBy']),
    t.Omit(selectRegularPostSchema, ['postId', 'version', 'createdBy']),
    t.Omit(selectThreadPostSchema, ['postId', 'version', 'createdBy']),
    t.Omit(selectStoryPostSchema, ['postId', 'version', 'createdBy']),
  ]),
})

export type PostWithDataSelect = Static<typeof PostWithDataSelectSchema>
export type PostWithDataInsert = Static<typeof PostWithDataInsertSchema>
export type PostWithDataUpdate = Static<typeof PostWithDataUpdateSchema>

export async function getPostWithData(
  db: TransactionLike,
  opts: { orgId: string; postId: string }
): Promise<PostWithDataSelect | null> {
  const post = await db.query.postsTable.findFirst({
    where: and(eq(postsTable.organizationId, opts.orgId), eq(postsTable.id, opts.postId)),
  })
  if (!post) {
    return null
  }

  let data: PostWithDataSelect['data'] | undefined = undefined

  switch (post.type) {
    case 'short': {
      const lastVersion = await getLastVersion(db, shortPostsTable, post.id)

      data = await db
        .select({
          ...getTableColumns(shortPostsTable),
          resource: resourcesTable,
        })
        .from(shortPostsTable)
        .leftJoin(resourcesTable, eq(shortPostsTable.resourceId, resourcesTable.id))
        .where(and(eq(shortPostsTable.postId, post.id), eq(shortPostsTable.version, lastVersion)))
        .orderBy(desc(shortPostsTable.version))
        .limit(1)
        .then((res) => res[0])

      break
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

      data = {
        ...regularPosts[0]!.regular_posts,
        media: regularPosts
          .filter((p) => !!p.regular_post_media)
          .map((p) => {
            return {
              ...(p.regular_post_media as SelectRegularPostMedia),
              resource: p.resources,
            }
          }),
      }

      break
    }
    case 'thread': {
      const lastVersion = await getLastVersion(db, threadPostsTable, post.id)

      const threads = await db
        .select()
        .from(threadPostsTable)
        .where(and(eq(threadPostsTable.postId, post.id), eq(threadPostsTable.version, lastVersion)))
        .leftJoin(threadMediaTable, eq(threadPostsTable.id, threadMediaTable.threadPostId))
        .innerJoin(resourcesTable, eq(threadMediaTable.resourceId, resourcesTable.id))
        .orderBy(desc(threadPostsTable.version))

      if (!threads.length) {
        return null
      }

      data = {
        ...threads[0]!.thread_posts,
        media: threads
          .filter((p) => !!p.thread_media)
          .map((p) => {
            return {
              ...(p.thread_media as SelectThreadMedia),
              resource: p.resources,
            }
          }),
      }

      break
    }
    case 'story': {
      const lastVersion = await getLastVersion(db, storyPostsTable, post.id)

      data = await db
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

      break
    }
  }

  if (!data) {
    return null
  }

  return { ...post, data } satisfies PostWithDataSelect
}

export async function createPost(
  db: TransactionLike,
  opts: {
    organizationId: string
    userId: string
  } & PostWithDataInsert
): Promise<PostWithDataSelect> {
  const post = await db
    .insert(postsTable)
    .values({
      organizationId: opts.organizationId,
      type: opts.type,
      status: 'draft',
    })
    .returning()
    .then((res) => res[0] as SelectPost)

  let data: PostWithDataSelect['data']

  const name = `${POST_TYPE_NAME[opts.type]} (${post.id})`

  switch (opts.type) {
    case 'short':
      data = await db
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
      break
    case 'post':
      data = await db
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
      break
    case 'thread':
      data = await db
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
      break
    case 'story':
      data = await db
        .insert(storyPostsTable)
        .values({
          name,
          postId: post.id,
          version: 1,
          createdBy: opts.userId,
        })
        .returning()
        .then((res) => res[0]!)
      break
    default:
      throw new Error(`Unsupported post type: ${opts.type}`)
  }

  return { ...post, data } satisfies PostWithDataSelect
}

export async function updatePost<TPostType extends PostType>(
  db: TransactionLike,
  opts: {
    organizationId: string
    userId: string
  } & PostWithDataUpdate
): Promise<PostWithDataSelect | null> {
  const post = await db.query.postsTable.findFirst({
    where: and(eq(postsTable.id, opts.postId), eq(postsTable.organizationId, opts.organizationId)),
  })

  if (!post) {
    return null
  }

  let updatedData: PostWithDataSelect['data']

  switch (post.type) {
    case 'short':
      updatedData = await db
        .insert(shortPostsTable)
        .values({
          ...(opts.data as any),
          createdBy: opts.userId,
          postId: opts.postId,
          version: await getNextVersion(db, shortPostsTable, opts.postId),
        })
        .returning()
        .then((res) => res[0]!)
      break
    case 'post':
      updatedData = await db
        .insert(regularPostsTable)
        .values({
          ...(opts.data as any),
          createdBy: opts.userId,
          postId: opts.postId,
          version: await getNextVersion(db, regularPostsTable, opts.postId),
        })
        .returning()
        .then((res) => res[0]!)
      break
    case 'thread':
      updatedData = await db
        .insert(threadPostsTable)
        .values({
          ...(opts.data as any),
          createdBy: opts.userId,
          postId: opts.postId,
          version: await getNextVersion(db, threadPostsTable, opts.postId),
        })
        .returning()
        .then((res) => res[0]!)
      break
    case 'story':
      updatedData = await db
        .insert(storyPostsTable)
        .values({
          ...(opts.data as any),
          createdBy: opts.userId,
          postId: opts.postId,
          version: await getNextVersion(db, storyPostsTable, opts.postId),
        })
        .returning()
        .then((res) => res[0]!)
      break
    default:
      throw new Error(`Unsupported post type: ${post.type}`)
  }

  return { ...post, data: updatedData } as PostWithDataSelect
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
