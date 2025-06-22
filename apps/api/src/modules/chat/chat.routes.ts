import { bindContainer } from '@bulkit/api/ioc'
import { authMiddleware } from '@bulkit/api/modules/auth/auth.middleware'
import { injectChatService } from '@bulkit/api/modules/chat/services/chat.service'
import { organizationMiddleware } from '@bulkit/api/modules/organizations/organizations.middleware'
import {
  ChatConversationSchema,
  ChatConversationWithMessagesSchema,
  ChatMessageSchema,
  CreateConversationSchema,
  SearchReferenceResultSchema,
  SearchReferencesSchema,
  SendMessageSchema,
  UpdateConversationSchema,
} from '@bulkit/shared/modules/chat/chat.schemas'
import { PaginatedResponseSchema, PaginationQuerySchema } from '@bulkit/shared/schemas/misc'
import { Elysia, t } from 'elysia'

export const chatRoutes = new Elysia({ prefix: '/chat' })
  .use(authMiddleware)
  .use(organizationMiddleware)
  .use(bindContainer([injectChatService]))

  // Conversations
  .get(
    '/conversations',
    async ({ query, auth, organization, chatService, db }) => {
      return await chatService.getUserConversations(db, {
        userId: auth.user.id,
        organizationId: organization.id,
        ...query,
      })
    },
    {
      query: PaginationQuerySchema,
      response: PaginatedResponseSchema(ChatConversationSchema),
    }
  )

  .post(
    '/conversations',
    async ({ body, auth, organization, chatService, db }) => {
      return await chatService.createConversation(db, {
        userId: auth.user.id,
        organizationId: organization.id,
        ...body,
        currentPageContext: body.currentPageContext ?? undefined,
      })
    },
    {
      body: CreateConversationSchema,
      response: ChatConversationSchema,
    }
  )

  .get(
    '/conversations/:id',
    async ({ params, auth, organization, chatService, db }) => {
      return await chatService.getConversationWithMessages(db, {
        conversationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      response: ChatConversationWithMessagesSchema,
    }
  )

  .put(
    '/conversations/:id',
    async ({ params, body, auth, organization, chatService, db }) => {
      return await chatService.updateConversation(db, {
        conversationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
        ...body,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateConversationSchema,
      response: ChatConversationSchema,
    }
  )

  .delete(
    '/conversations/:id',
    async ({ params, auth, organization, chatService, db }) => {
      await chatService.deleteConversation(db, {
        conversationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
      })
      return { success: true }
    },
    {
      params: t.Object({ id: t.String() }),
    }
  )

  // Messages
  .get(
    '/conversations/:id/messages',
    async ({ params, query, auth, organization, chatService, db }) => {
      return await chatService.getConversationMessages(db, {
        conversationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
        ...query,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Composite([
        PaginationQuerySchema,
        t.Object({
          before: t.Optional(t.String()),
          after: t.Optional(t.String()),
        }),
      ]),
      response: t.Object({
        data: t.Array(ChatMessageSchema),
        nextCursor: t.Nullable(t.String()),
        total: t.Number(),
      }),
    }
  )

  .post(
    '/conversations/:id/messages',
    async ({ params, body, auth, organization, chatService, db }) => {
      return await chatService.sendMessage(db, {
        conversationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
        ...body,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      body: SendMessageSchema,
      response: ChatMessageSchema,
    }
  )

  .post(
    '/conversations/:id/messages/stream',
    async function* ({ params, body, auth, organization, chatService, db }) {
      // Elysia will automatically handle streaming when a generator is returned
      yield* chatService.sendMessageStream(db, {
        conversationId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
        ...body,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      body: SendMessageSchema,
    }
  )

  // Agent interactions
  .post(
    '/messages/:id/reactions',
    async ({ params, body, auth, organization, chatService, db }) => {
      return await chatService.addMessageReaction(db, {
        messageId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
        reactionType: body.reactionType,
      })
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        reactionType: t.Union([
          t.Literal('like'),
          t.Literal('dislike'),
          t.Literal('helpful'),
          t.Literal('not_helpful'),
        ]),
      }),
    }
  )

  .delete(
    '/messages/:id/reactions/:type',
    async ({ params, auth, organization, chatService, db }) => {
      await chatService.removeMessageReaction(db, {
        messageId: params.id,
        userId: auth.user.id,
        organizationId: organization.id,
        reactionType: params.type as any,
      })
      return { success: true }
    },
    {
      params: t.Object({
        id: t.String(),
        type: t.Union([
          t.Literal('like'),
          t.Literal('dislike'),
          t.Literal('helpful'),
          t.Literal('not_helpful'),
        ]),
      }),
    }
  )

  // Search and references
  .post(
    '/search/references',
    async ({ body, auth, organization, chatService, db }) => {
      return await chatService.searchReferences(db, {
        userId: auth.user.id,
        organizationId: organization.id,
        ...body,
      })
    },
    {
      body: SearchReferencesSchema,
      response: SearchReferenceResultSchema,
    }
  )

// .get(
//   '/agents',
//   async ({ organization, agentService, db }) => {
//     return await agentService.getOrganizationAgents(db, {
//       organizationId: organization.id,
//     })
//   },
//   {
//     response: t.Array(ChatAgentSchema),
//   }
// )

// // // Analytics
// // .get('/analytics', async ({ user, organization, db }) => {
// //   return await chatService.getChatAnalytics(db, {
// //     userId: user.id,
// //     organizationId: organization.id,
// //   })
// // })

// // Admin routes for managing agents
// .group('/admin', (app) =>
//   app
//     .post(
//       '/agents',
//       async ({ body, organization, auth, db }) => {
//         return await agentService.createAgent(db, {
//           ...body,
//           organizationId: organization.id,
//           createdByUserId: auth.user.id,
//         })
//       },
//       {
//         body: t.Object({
//           name: t.String(),
//           description: t.Optional(t.String()),
//           agentType: t.Union([
//             t.Literal('coordinator'),
//             t.Literal('post_management'),
//             t.Literal('analytics'),
//             t.Literal('content_creation'),
//             t.Literal('scheduling'),
//             t.Literal('research'),
//             t.Literal('task_management'),
//           ]),
//           capabilities: t.Array(t.String()),
//           systemPrompt: t.String(),
//           model: t.Optional(t.String()),
//           temperature: t.Optional(t.Number()),
//           maxTokens: t.Optional(t.Number()),
//         }),
//         response: ChatAgentSchema,
//       }
//     )

//     .put(
//       '/agents/:id',
//       async ({ params, body, organization, db }) => {
//         return await agentService.updateAgent(db, {
//           agentId: params.id,
//           organizationId: organization.id,
//           ...body,
//         })
//       },
//       {
//         params: t.Object({ id: t.String() }),
//         body: t.Object({
//           name: t.Optional(t.String()),
//           description: t.Optional(t.String()),
//           capabilities: t.Optional(t.Array(t.String())),
//           systemPrompt: t.Optional(t.String()),
//           model: t.Optional(t.String()),
//           temperature: t.Optional(t.Number()),
//           maxTokens: t.Optional(t.Number()),
//           isActive: t.Optional(t.Boolean()),
//         }),
//         response: ChatAgentSchema,
//       }
//     )

//     .delete(
//       '/agents/:id',
//       async ({ params, organization, db }) => {
//         await agentService.deleteAgent(db, {
//           agentId: params.id,
//           organizationId: organization.id,
//         })
//         return { success: true }
//       },
//       {
//         params: t.Object({ id: t.String() }),
//       }
//     )
// )
