import type { TransactionLike } from '@bulkit/api/db/db.client'
import { commentsTable, usersTable, type CommentMention } from '@bulkit/api/db/db.schema'
import { ioc, iocRegister, iocResolve } from '@bulkit/api/ioc'
import {
  injectCompletionService,
  type CompletionService,
} from '@bulkit/api/modules/ai/services/completion.service'
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm'

export type CreateCommentOptions = {
  postId: string
  userId: string
  organizationId: string
  content: string
}

export class CommentsService {
  constructor(private readonly completionService: CompletionService) {}

  async create(db: TransactionLike, opts: CreateCommentOptions) {
    const mentions = this.extractMentions(opts.content)
    const hasAiMention = mentions.some((m) => m.type === 'ai')

    // First create the user's comment
    const comment = await db
      .insert(commentsTable)
      .values({
        ...opts,
        mentions,
      })
      .returning()
      .then((res) => res[0]!)

    // If @ai is mentioned, get context and generate AI response
    if (hasAiMention) {
      // Get last 5 messages for context
      const context = await db
        .select()
        .from(commentsTable)
        .where(
          and(
            eq(commentsTable.postId, opts.postId),
            eq(commentsTable.organizationId, opts.organizationId)
          )
        )
        .orderBy(desc(commentsTable.createdAt))
        .limit(5)

      const post = await db.query.postsTable.findFirst({
        where: eq(commentsTable.id, opts.postId),
      })

      if (!post) {
        throw new Error('Post not found')
      }

      try {
        const aiResponse = await this.completionService.complete({
          messages: [
            {
              role: 'system',
              content: `You are a helpful AI assistant in a chat about a social media post.
              The post data is: ${JSON.stringify(post)}

              Recent chat context:
              ${context
                .reverse()
                .map((c) => `${c.userId}: ${c.content}`)
                .join('\n')}`,
            },
            {
              role: 'user',
              content: opts.content.replace(/@ai/g, '').trim(),
            },
          ],
        })

        // Create AI response comment
        await db.insert(commentsTable).values({
          postId: opts.postId,
          userId: opts.userId,
          organizationId: opts.organizationId,
          content: aiResponse,
          isAiResponse: 'true',
        })
      } catch (error) {
        // Create error response
        await db.insert(commentsTable).values({
          postId: opts.postId,
          userId: opts.userId,
          organizationId: opts.organizationId,
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isAiResponse: 'true',
        })
      }
    }

    return comment
  }

  async getPostComments(
    db: TransactionLike,
    opts: {
      postId: string
      organizationId: string
      timestamp: number
      limit: number
      order: 'asc' | 'desc'
    }
  ) {
    const cursorCompFn = opts.order === 'desc' ? lte : gte
    const orderFn = opts.order === 'desc' ? desc : asc

    return db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
        mentions: commentsTable.mentions,
        isAiResponse: commentsTable.isAiResponse,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(
        and(
          eq(commentsTable.postId, opts.postId),
          eq(commentsTable.organizationId, opts.organizationId),
          cursorCompFn(commentsTable.createdAt, new Date(opts.timestamp).toISOString())
        )
      )
      .orderBy(orderFn(commentsTable.createdAt))
      .limit(opts.limit)
  }

  private extractMentions(content: string): CommentMention[] {
    const mentions: CommentMention[] = []
    let match: RegExpExecArray | null

    // Match @user mentions
    const userMentionRegex = /@([a-zA-Z0-9_-]+)(?!\[)/g
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = userMentionRegex.exec(content)) !== null) {
      mentions.push({
        type: 'user',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }

    // Match @ai mentions
    const aiMentionRegex = /@ai\b/g
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = aiMentionRegex.exec(content)) !== null) {
      mentions.push({
        type: 'ai',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }

    return mentions
  }
}

export const injectCommentsService = iocRegister('commentsService', () => {
  const container = iocResolve(ioc.use(injectCompletionService))
  return new CommentsService(container.completionService)
})
