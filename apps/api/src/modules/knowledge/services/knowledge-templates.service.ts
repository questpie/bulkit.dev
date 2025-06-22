import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  knowledgeTemplatesTable,
  type InsertKnowledgeTemplate,
  type SelectKnowledgeTemplate,
} from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import type { KnowledgeTemplateType } from '@bulkit/shared/constants/db.constants'
import type {
  CreateKnowledgeTemplate,
  KnowledgeMetadata,
  UpdateKnowledgeTemplate,
} from '@bulkit/shared/modules/knowledge/knowledge.schemas'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

interface CreateTemplateOpts {
  organizationId: string
  userId: string
  data: CreateKnowledgeTemplate
}

interface UpdateTemplateOpts {
  templateId: string
  organizationId: string
  userId: string
  data: UpdateKnowledgeTemplate
}

interface GetTemplateOpts {
  templateId: string
  organizationId?: string // Optional for public templates
}

interface ListTemplatesOpts {
  organizationId: string
  templateType?: KnowledgeTemplateType
  includePublic?: boolean
  search?: string
  limit?: number
  offset?: number
}

interface UseTemplateOpts {
  templateId: string
  organizationId: string
  userId: string
  customData?: {
    title?: string
    placeholderValues?: Record<string, string>
  }
}

export class KnowledgeTemplatesService {
  async create(db: TransactionLike, opts: CreateTemplateOpts): Promise<SelectKnowledgeTemplate> {
    const { organizationId, userId, data } = opts

    const template = await db
      .insert(knowledgeTemplatesTable)
      .values({
        name: data.name,
        description: data.description,
        templateType: data.templateType,
        contentTemplate: data.contentTemplate,
        metadataTemplate: data.metadataTemplate || {},
        isPublic: data.isPublic || false,
        organizationId: data.isPublic ? null : organizationId,
        createdByUserId: userId,
        usageCount: 0,
      })
      .returning()
      .then((res) => res[0]!)

    return template
  }

  async getById(
    db: TransactionLike,
    opts: GetTemplateOpts
  ): Promise<SelectKnowledgeTemplate | null> {
    const { templateId, organizationId } = opts

    const conditions = [eq(knowledgeTemplatesTable.id, templateId)]

    // If organizationId provided, include org templates and public templates
    if (organizationId) {
      conditions.push(
        or(
          eq(knowledgeTemplatesTable.organizationId, organizationId),
          eq(knowledgeTemplatesTable.isPublic, true)
        )!
      )
    } else {
      // Only public templates if no organization specified
      conditions.push(eq(knowledgeTemplatesTable.isPublic, true))
    }

    return db
      .select()
      .from(knowledgeTemplatesTable)
      .where(and(...conditions))
      .then((res) => res[0] || null)
  }

  async list(
    db: TransactionLike,
    opts: ListTemplatesOpts
  ): Promise<{
    templates: SelectKnowledgeTemplate[]
    total: number
  }> {
    const {
      organizationId,
      templateType,
      includePublic = true,
      search,
      limit = 20,
      offset = 0,
    } = opts

    const conditions = []

    // Organization and public templates
    if (includePublic) {
      conditions.push(
        or(
          eq(knowledgeTemplatesTable.organizationId, organizationId),
          eq(knowledgeTemplatesTable.isPublic, true)
        )!
      )
    } else {
      conditions.push(eq(knowledgeTemplatesTable.organizationId, organizationId))
    }

    if (templateType) {
      conditions.push(eq(knowledgeTemplatesTable.templateType, templateType))
    }

    if (search) {
      conditions.push(
        or(
          ilike(knowledgeTemplatesTable.name, `%${search}%`),
          ilike(knowledgeTemplatesTable.description, `%${search}%`)
        )!
      )
    }

    // Get total count
    const totalCount = await db
      .select({ count: count() })
      .from(knowledgeTemplatesTable)
      .where(and(...conditions))
      .then((res) => res[0]?.count || 0)

    // Get templates
    const templates = await db
      .select()
      .from(knowledgeTemplatesTable)
      .where(and(...conditions))
      .orderBy(desc(knowledgeTemplatesTable.usageCount), desc(knowledgeTemplatesTable.createdAt))
      .limit(limit)
      .offset(offset)

    return {
      templates,
      total: totalCount,
    }
  }

  async update(db: TransactionLike, opts: UpdateTemplateOpts): Promise<SelectKnowledgeTemplate> {
    const { templateId, organizationId, userId, data } = opts

    // Verify ownership (only organization templates can be updated by org members)
    const existingTemplate = await db
      .select()
      .from(knowledgeTemplatesTable)
      .where(
        and(
          eq(knowledgeTemplatesTable.id, templateId),
          eq(knowledgeTemplatesTable.organizationId, organizationId) // Must be org template
        )
      )
      .then((res) => res[0])

    if (!existingTemplate) {
      throw new Error('Template not found or not editable')
    }

    const updateData: Partial<InsertKnowledgeTemplate> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.templateType !== undefined) updateData.templateType = data.templateType
    if (data.contentTemplate !== undefined) updateData.contentTemplate = data.contentTemplate
    if (data.metadataTemplate !== undefined) updateData.metadataTemplate = data.metadataTemplate
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic

    const updatedTemplate = await db
      .update(knowledgeTemplatesTable)
      .set(updateData)
      .where(eq(knowledgeTemplatesTable.id, templateId))
      .returning()
      .then((res) => res[0]!)

    return updatedTemplate
  }

  async delete(db: TransactionLike, templateId: string, organizationId: string): Promise<void> {
    // Verify ownership
    const template = await db
      .select({ id: knowledgeTemplatesTable.id })
      .from(knowledgeTemplatesTable)
      .where(
        and(
          eq(knowledgeTemplatesTable.id, templateId),
          eq(knowledgeTemplatesTable.organizationId, organizationId)
        )
      )
      .then((res) => res[0])

    if (!template) {
      throw new Error('Template not found or not deletable')
    }

    await db.delete(knowledgeTemplatesTable).where(eq(knowledgeTemplatesTable.id, templateId))
  }

  async useTemplate(
    db: TransactionLike,
    opts: UseTemplateOpts
  ): Promise<{
    title: string
    content: string
    metadata: KnowledgeMetadata
    templateType: KnowledgeTemplateType
  }> {
    const { templateId, organizationId, userId, customData } = opts

    return db.transaction(async (trx) => {
      // Get template
      const template = await this.getById(trx, { templateId, organizationId })

      if (!template) {
        throw new Error('Template not found')
      }

      // Increment usage count
      await trx
        .update(knowledgeTemplatesTable)
        .set({
          usageCount: template.usageCount + 1,
        })
        .where(eq(knowledgeTemplatesTable.id, templateId))

      // Process template content with placeholders
      let processedContent = template.contentTemplate

      if (customData?.placeholderValues) {
        for (const [placeholder, value] of Object.entries(customData.placeholderValues)) {
          const regex = new RegExp(`{{${placeholder}}}`, 'g')
          processedContent = processedContent.replace(regex, value)
        }
      }

      // Generate title from template name or custom title
      const title = customData?.title || `${template.name} - ${new Date().toLocaleDateString()}`

      return {
        title,
        content: processedContent,
        metadata: template.metadataTemplate,
        templateType: template.templateType,
      }
    })
  }

  async getByType(
    db: TransactionLike,
    templateType: KnowledgeTemplateType,
    organizationId: string
  ): Promise<SelectKnowledgeTemplate[]> {
    return db
      .select()
      .from(knowledgeTemplatesTable)
      .where(
        and(
          eq(knowledgeTemplatesTable.templateType, templateType),
          or(
            eq(knowledgeTemplatesTable.organizationId, organizationId),
            eq(knowledgeTemplatesTable.isPublic, true)
          )!
        )
      )
      .orderBy(desc(knowledgeTemplatesTable.usageCount))
  }

  async getPopular(
    db: TransactionLike,
    organizationId: string,
    limit = 10
  ): Promise<SelectKnowledgeTemplate[]> {
    return db
      .select()
      .from(knowledgeTemplatesTable)
      .where(
        or(
          eq(knowledgeTemplatesTable.organizationId, organizationId),
          eq(knowledgeTemplatesTable.isPublic, true)
        )!
      )
      .orderBy(desc(knowledgeTemplatesTable.usageCount))
      .limit(limit)
  }

  async trackUsage(
    db: TransactionLike,
    opts: { templateId: string; organizationId: string }
  ): Promise<void> {
    const { templateId, organizationId } = opts

    // Verify template access
    const template = await this.getById(db, { templateId, organizationId })

    if (!template) {
      throw new Error('Template not found or access denied')
    }

    // Increment usage count
    await db
      .update(knowledgeTemplatesTable)
      .set({
        usageCount: template.usageCount + 1,
      })
      .where(eq(knowledgeTemplatesTable.id, templateId))
  }

  // Predefined system templates that get created for new organizations
  async createSystemTemplates(
    db: TransactionLike,
    organizationId: string,
    userId: string
  ): Promise<void> {
    const systemTemplates = [
      {
        name: 'Brand Guidelines',
        description: 'Document your brand identity, voice, and visual guidelines',
        templateType: 'brand_guidelines' as const,
        contentTemplate: `# {{company_name}} Brand Guidelines

## Brand Overview
{{brand_overview}}

## Brand Voice & Tone
- **Voice**: {{brand_voice}}
- **Tone**: {{brand_tone}}

## Visual Identity
### Logo
{{logo_guidelines}}

### Colors
- Primary: {{primary_color}}
- Secondary: {{secondary_color}}
- Accent: {{accent_color}}

### Typography
- Primary Font: {{primary_font}}
- Secondary Font: {{secondary_font}}

## Messaging
### Tagline
{{tagline}}

### Key Messages
{{key_messages}}

## Content Guidelines
{{content_guidelines}}

## Do's and Don'ts
### Do's
{{brand_dos}}

### Don'ts
{{brand_donts}}`,
        metadataTemplate: {
          category: 'brand',
          tags: ['brand', 'guidelines', 'identity'],
        },
      },
      {
        name: 'Competitor Analysis',
        description: 'Analyze and document competitor strategies and insights',
        templateType: 'competitor_analysis' as const,
        contentTemplate: `# Competitor Analysis: {{competitor_name}}

## Company Overview
- **Website**: {{competitor_website}}
- **Industry**: {{industry}}
- **Founded**: {{founded_year}}
- **Size**: {{company_size}}

## Products/Services
{{products_services}}

## Target Audience
{{target_audience}}

## Marketing Strategy
### Social Media Presence
{{social_media_analysis}}

### Content Strategy
{{content_strategy}}

### Advertising Approach
{{advertising_approach}}

## Strengths
{{strengths}}

## Weaknesses
{{weaknesses}}

## Opportunities for Us
{{opportunities}}

## Key Takeaways
{{key_takeaways}}`,
        metadataTemplate: {
          category: 'research',
          tags: ['competitor', 'analysis', 'research'],
        },
      },
      {
        name: 'Content Strategy',
        description: 'Plan and document your content marketing strategy',
        templateType: 'content_strategy' as const,
        contentTemplate: `# Content Strategy: {{strategy_name}}

## Objectives
{{objectives}}

## Target Audience
### Primary Audience
{{primary_audience}}

### Secondary Audience
{{secondary_audience}}

## Content Pillars
1. {{pillar_1}}
2. {{pillar_2}}
3. {{pillar_3}}

## Content Types
{{content_types}}

## Distribution Channels
{{distribution_channels}}

## Content Calendar
{{content_calendar}}

## KPIs & Metrics
{{kpis}}

## Resources & Budget
{{resources}}`,
        metadataTemplate: {
          category: 'strategy',
          tags: ['content', 'strategy', 'marketing'],
        },
      },
      {
        name: 'Meeting Notes',
        description: 'Standard template for capturing meeting notes and action items',
        templateType: 'meeting_notes' as const,
        contentTemplate: `# Meeting Notes: {{meeting_title}}

**Date**: {{date}}
**Time**: {{time}}
**Attendees**: {{attendees}}

## Agenda
{{agenda}}

## Discussion Points
{{discussion}}

## Decisions Made
{{decisions}}

## Action Items
{{action_items}}

## Next Steps
{{next_steps}}

## Next Meeting
**Date**: {{next_meeting_date}}
**Topics**: {{next_meeting_topics}}`,
        metadataTemplate: {
          category: 'documentation',
          tags: ['meeting', 'notes', 'planning'],
        },
      },
      {
        name: 'Campaign Brief',
        description: 'Plan and document marketing campaign details and requirements',
        templateType: 'campaign_brief' as const,
        contentTemplate: `# Campaign Brief: {{campaign_name}}

## Campaign Overview
**Campaign Name**: {{campaign_name}}
**Campaign Type**: {{campaign_type}}
**Start Date**: {{start_date}}
**End Date**: {{end_date}}
**Budget**: {{budget}}

## Objectives
### Primary Goal
{{primary_goal}}

### Secondary Goals
{{secondary_goals}}

## Target Audience
{{target_audience}}

## Key Messages
{{key_messages}}

## Creative Direction
### Visual Style
{{visual_style}}

### Tone of Voice
{{tone_of_voice}}

## Channels & Platforms
{{channels}}

## Content Requirements
{{content_requirements}}

## Timeline & Milestones
{{timeline}}

## Success Metrics
{{success_metrics}}

## Team & Responsibilities
{{team_responsibilities}}

## Risks & Considerations
{{risks}}`,
        metadataTemplate: {
          category: 'campaigns',
          tags: ['campaign', 'brief', 'marketing', 'planning'],
        },
      },
      {
        name: 'Product Information',
        description: 'Document product features, benefits, and specifications',
        templateType: 'product_info' as const,
        contentTemplate: `# Product Information: {{product_name}}

## Product Overview
**Product Name**: {{product_name}}
**Category**: {{category}}
**Launch Date**: {{launch_date}}
**Price**: {{price}}

## Description
{{product_description}}

## Key Features
{{key_features}}

## Benefits
{{benefits}}

## Target Market
{{target_market}}

## Technical Specifications
{{specifications}}

## Use Cases
{{use_cases}}

## Competitive Advantages
{{competitive_advantages}}

## Marketing Angles
{{marketing_angles}}

## Support Information
{{support_info}}

## FAQs
{{faqs}}`,
        metadataTemplate: {
          category: 'products',
          tags: ['product', 'information', 'specifications'],
        },
      },
      {
        name: 'Market Research Summary',
        description: 'Compile and analyze market research findings',
        templateType: 'market_research' as const,
        contentTemplate: `# Market Research: {{research_topic}}

## Research Overview
**Topic**: {{research_topic}}
**Research Period**: {{research_period}}
**Methodology**: {{methodology}}
**Sample Size**: {{sample_size}}

## Key Findings
{{key_findings}}

## Market Size & Opportunity
{{market_size}}

## Customer Insights
### Demographics
{{demographics}}

### Behaviors
{{behaviors}}

### Pain Points
{{pain_points}}

### Preferences
{{preferences}}

## Industry Trends
{{industry_trends}}

## Competitive Landscape
{{competitive_landscape}}

## Recommendations
{{recommendations}}

## Next Steps
{{next_steps}}

## Data Sources
{{data_sources}}`,
        metadataTemplate: {
          category: 'research',
          tags: ['market', 'research', 'analysis', 'insights'],
        },
      },
      {
        name: 'Style Guide',
        description: 'Define visual and content style standards',
        templateType: 'style_guide' as const,
        contentTemplate: `# Style Guide: {{brand_name}}

## Typography
### Primary Fonts
{{primary_fonts}}

### Secondary Fonts
{{secondary_fonts}}

### Font Hierarchy
{{font_hierarchy}}

## Color Palette
### Primary Colors
{{primary_colors}}

### Secondary Colors
{{secondary_colors}}

### Neutral Colors
{{neutral_colors}}

## Logo Usage
### Primary Logo
{{logo_primary}}

### Logo Variations
{{logo_variations}}

### Logo Don'ts
{{logo_donts}}

## Imagery Style
{{imagery_style}}

## Content Style
### Writing Style
{{writing_style}}

### Tone Guidelines
{{tone_guidelines}}

### Content Structure
{{content_structure}}

## Social Media Guidelines
{{social_media_guidelines}}

## Print Guidelines
{{print_guidelines}}

## Digital Guidelines
{{digital_guidelines}}`,
        metadataTemplate: {
          category: 'brand',
          tags: ['style', 'guide', 'brand', 'design'],
        },
      },
      {
        name: 'Process Documentation',
        description: 'Document workflows, procedures, and processes',
        templateType: 'process_documentation' as const,
        contentTemplate: `# Process Documentation: {{process_name}}

## Process Overview
**Process Name**: {{process_name}}
**Department**: {{department}}
**Owner**: {{process_owner}}
**Last Updated**: {{last_updated}}

## Purpose
{{purpose}}

## Scope
{{scope}}

## Prerequisites
{{prerequisites}}

## Step-by-Step Process
{{process_steps}}

## Roles & Responsibilities
{{roles_responsibilities}}

## Tools & Resources
{{tools_resources}}

## Quality Checks
{{quality_checks}}

## Troubleshooting
{{troubleshooting}}

## Related Processes
{{related_processes}}

## Revision History
{{revision_history}}`,
        metadataTemplate: {
          category: 'documentation',
          tags: ['process', 'documentation', 'workflow', 'procedures'],
        },
      },
      {
        name: 'Research Summary',
        description: 'Summarize research findings and insights',
        templateType: 'research_summary' as const,
        contentTemplate: `# Research Summary: {{research_title}}

## Executive Summary
{{executive_summary}}

## Research Question
{{research_question}}

## Methodology
{{methodology}}

## Key Findings
{{key_findings}}

## Detailed Analysis
{{detailed_analysis}}

## Implications
{{implications}}

## Recommendations
{{recommendations}}

## Limitations
{{limitations}}

## Future Research
{{future_research}}

## References
{{references}}`,
        metadataTemplate: {
          category: 'research',
          tags: ['research', 'summary', 'analysis', 'findings'],
        },
      },
    ]

    // Create templates
    for (const template of systemTemplates) {
      await db.insert(knowledgeTemplatesTable).values({
        name: template.name,
        description: template.description,
        templateType: template.templateType,
        contentTemplate: template.contentTemplate,
        metadataTemplate: template.metadataTemplate,
        isPublic: false,
        organizationId,
        createdByUserId: userId,
        usageCount: 0,
      })
    }
  }
}

export const injectKnowledgeTemplatesService = ioc.register('knowledgeTemplatesService', () => {
  return new KnowledgeTemplatesService()
})
