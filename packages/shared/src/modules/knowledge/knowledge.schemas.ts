import { t, type Static } from 'elysia'
import {
  KNOWLEDGE_STATUS,
  KNOWLEDGE_TEMPLATE_TYPE,
  KNOWLEDGE_VERSION_CHANGE_TYPE,
  KNOWLEDGE_REFERENCE_TYPE,
} from '@bulkit/shared/constants/db.constants'

// Base knowledge mention schema (similar to comment mentions)
export const KnowledgeMentionSchema = t.Object({
  type: t.Union([
    t.Literal('user'),
    t.Literal('post'),
    t.Literal('task'),
    t.Literal('knowledge'),
    t.Literal('media'),
  ]),
  id: t.String(),
  name: t.String(),
  startIndex: t.Number(),
  endIndex: t.Number(),
})

// Knowledge metadata schema
export const KnowledgeMetadataSchema = t.Object({
  tags: t.Optional(t.Array(t.String())),
  category: t.Optional(t.String()),
  sourceUrl: t.Optional(t.String()),
  extractedData: t.Optional(t.Record(t.String(), t.Any())),
  summary: t.Optional(t.String()),
  keyPoints: t.Optional(t.Array(t.String())),
  relatedTopics: t.Optional(t.Array(t.String())),
})

// Create knowledge document schema
export const CreateKnowledgeSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  content: t.String({ minLength: 1 }),
  excerpt: t.Optional(t.String({ maxLength: 500 })),
  templateType: t.Optional(t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type)))),
  status: t.Optional(t.Union(KNOWLEDGE_STATUS.map((status) => t.Literal(status)))),
  mentions: t.Optional(t.Array(KnowledgeMentionSchema)),
  metadata: t.Optional(KnowledgeMetadataSchema),
})

// Update knowledge document schema
export const UpdateKnowledgeSchema = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  content: t.Optional(t.String({ minLength: 1 })),
  excerpt: t.Optional(t.String({ maxLength: 500 })),
  templateType: t.Optional(t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type)))),
  status: t.Optional(t.Union(KNOWLEDGE_STATUS.map((status) => t.Literal(status)))),
  mentions: t.Optional(t.Array(KnowledgeMentionSchema)),
  metadata: t.Optional(KnowledgeMetadataSchema),
  changeDescription: t.Optional(t.String({ maxLength: 500 })),
})

// Knowledge list query schema
export const KnowledgeListQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  search: t.Optional(t.String()),
  status: t.Optional(t.Union(KNOWLEDGE_STATUS.map((status) => t.Literal(status)))),
  templateType: t.Optional(t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type)))),
  createdBy: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  sortBy: t.Optional(
    t.Union([
      t.Literal('title'),
      t.Literal('createdAt'),
      t.Literal('updatedAt'),
      t.Literal('viewCount'),
    ])
  ),
  sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
})

// Knowledge template schema
export const CreateKnowledgeTemplateSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  templateType: t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type))),
  contentTemplate: t.String({ minLength: 1 }),
  metadataTemplate: t.Optional(KnowledgeMetadataSchema),
  isPublic: t.Optional(t.Boolean()),
})

export const UpdateKnowledgeTemplateSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String({ maxLength: 500 })),
  templateType: t.Optional(t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type)))),
  contentTemplate: t.Optional(t.String({ minLength: 1 })),
  metadataTemplate: t.Optional(KnowledgeMetadataSchema),
  isPublic: t.Optional(t.Boolean()),
})

// Knowledge version schema
export const KnowledgeVersionSchema = t.Object({
  id: t.String(),
  knowledgeId: t.String(),
  version: t.Number(),
  title: t.String(),
  content: t.String(),
  excerpt: t.Optional(t.String()),
  templateType: t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type))),
  status: t.Union(KNOWLEDGE_STATUS.map((status) => t.Literal(status))),
  changeType: t.Union(KNOWLEDGE_VERSION_CHANGE_TYPE.map((type) => t.Literal(type))),
  changeDescription: t.Optional(t.String()),
  changedByUserId: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
})

// Knowledge reference schema
export const CreateKnowledgeReferenceSchema = t.Object({
  referencedEntityId: t.String(),
  referencedEntityType: t.String(),
  referenceType: t.Union(KNOWLEDGE_REFERENCE_TYPE.map((type) => t.Literal(type))),
  contextSnippet: t.Optional(t.String({ maxLength: 300 })),
})

// Knowledge search result schema
export const KnowledgeSearchResultSchema = t.Object({
  id: t.String(),
  title: t.String(),
  excerpt: t.Optional(t.String()),
  templateType: t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type))),
  status: t.Union(KNOWLEDGE_STATUS.map((status) => t.Literal(status))),
  createdAt: t.String(),
  updatedAt: t.String(),
  viewCount: t.Number(),
  relevanceScore: t.Optional(t.Number()), // For search ranking
  matchSnippets: t.Optional(t.Array(t.String())), // Highlighted text matches
})

// Web scraping request schema
export const WebScrapingRequestSchema = t.Object({
  url: t.String({ format: 'uri' }),
  title: t.Optional(t.String({ maxLength: 255 })),
  extractContent: t.Optional(t.Boolean()), // Whether to extract main content
  extractMetadata: t.Optional(t.Boolean()), // Whether to extract meta tags, etc.
  templateType: t.Optional(t.Union(KNOWLEDGE_TEMPLATE_TYPE.map((type) => t.Literal(type)))),
  category: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
})

// Knowledge analytics schema
export const KnowledgeAnalyticsSchema = t.Object({
  totalDocuments: t.Number(),
  documentsByStatus: t.Record(t.String(), t.Number()),
  documentsByTemplate: t.Record(t.String(), t.Number()),
  mostViewedDocuments: t.Array(
    t.Object({
      id: t.String(),
      title: t.String(),
      viewCount: t.Number(),
    })
  ),
  recentActivity: t.Array(
    t.Object({
      type: t.String(), // 'created', 'updated', 'viewed'
      documentId: t.String(),
      documentTitle: t.String(),
      userId: t.String(),
      timestamp: t.String(),
    })
  ),
  popularTags: t.Array(
    t.Object({
      tag: t.String(),
      count: t.Number(),
    })
  ),
})

// Type exports
export type KnowledgeMention = Static<typeof KnowledgeMentionSchema>
export type KnowledgeMetadata = Static<typeof KnowledgeMetadataSchema>
export type CreateKnowledge = Static<typeof CreateKnowledgeSchema>
export type UpdateKnowledge = Static<typeof UpdateKnowledgeSchema>
export type KnowledgeListQuery = Static<typeof KnowledgeListQuerySchema>
export type CreateKnowledgeTemplate = Static<typeof CreateKnowledgeTemplateSchema>
export type UpdateKnowledgeTemplate = Static<typeof UpdateKnowledgeTemplateSchema>
export type KnowledgeVersion = Static<typeof KnowledgeVersionSchema>
export type CreateKnowledgeReference = Static<typeof CreateKnowledgeReferenceSchema>
export type KnowledgeSearchResult = Static<typeof KnowledgeSearchResultSchema>
export type WebScrapingRequest = Static<typeof WebScrapingRequestSchema>
export type KnowledgeAnalytics = Static<typeof KnowledgeAnalyticsSchema>
