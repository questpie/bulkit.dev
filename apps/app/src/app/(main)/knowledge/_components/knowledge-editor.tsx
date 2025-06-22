'use client'

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { Badge } from '@bulkit/ui/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bulkit/ui/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { RichTextEditor } from '@bulkit/ui/components/ui/rich-text-editor'
import { cn } from '@bulkit/ui/lib'
import { Save, Eye, History, FileText, Tag, Globe, Lock } from 'react-icons/lu'
import type {
  CreateKnowledge,
  UpdateKnowledge,
  KnowledgeMetadata,
  KnowledgeMention,
} from '@bulkit/shared/modules/knowledge/knowledge.schemas'
import type { KnowledgeStatus, KnowledgeTemplateType } from '@bulkit/shared/constants/db.constants'

interface KnowledgeEditorProps {
  initialData?: {
    id?: string
    title?: string
    content?: string
    excerpt?: string
    status?: KnowledgeStatus
    templateType?: KnowledgeTemplateType
    metadata?: KnowledgeMetadata
    mentions?: KnowledgeMention[]
    version?: number
  }
  templates?: Array<{
    id: string
    name: string
    templateType: KnowledgeTemplateType
    description?: string
  }>
  onSave?: (data: CreateKnowledge | UpdateKnowledge) => void
  onPreview?: (data: { title: string; content: string }) => void
  onVersionHistory?: () => void
  className?: string
  readOnly?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
}

export interface KnowledgeEditorRef {
  getContent: () => CreateKnowledge | UpdateKnowledge
  setContent: (data: KnowledgeEditorProps['initialData']) => void
  save: () => void
  clear: () => void
  focus: () => void
}

const TEMPLATE_TYPES = [
  { value: 'general', label: 'General', icon: FileText },
  { value: 'brand_guidelines', label: 'Brand Guidelines', icon: Tag },
  { value: 'competitor_analysis', label: 'Competitor Analysis', icon: Eye },
  { value: 'market_research', label: 'Market Research', icon: Globe },
  { value: 'content_strategy', label: 'Content Strategy', icon: FileText },
  { value: 'campaign_brief', label: 'Campaign Brief', icon: FileText },
  { value: 'product_info', label: 'Product Info', icon: FileText },
  { value: 'style_guide', label: 'Style Guide', icon: Tag },
  { value: 'process_documentation', label: 'Process Documentation', icon: FileText },
  { value: 'meeting_notes', label: 'Meeting Notes', icon: FileText },
  { value: 'research_summary', label: 'Research Summary', icon: Globe },
  { value: 'web_scraping_result', label: 'Web Scraping Result', icon: Globe },
] as const

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'published', label: 'Published', color: 'bg-green-500' },
  { value: 'archived', label: 'Archived', color: 'bg-orange-500' },
] as const

export const KnowledgeEditor = forwardRef<KnowledgeEditorRef, KnowledgeEditorProps>(
  (
    {
      initialData,
      templates = [],
      onSave,
      onPreview,
      onVersionHistory,
      className,
      readOnly = false,
      autoSave = false,
      autoSaveDelay = 2000,
    },
    ref
  ) => {
    const [title, setTitle] = useState(initialData?.title || '')
    const [content, setContent] = useState(initialData?.content || '')
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
    const [status, setStatus] = useState<KnowledgeStatus>(initialData?.status || 'draft')
    const [templateType, setTemplateType] = useState<KnowledgeTemplateType>(
      initialData?.templateType || 'general'
    )
    const [mentions, setMentions] = useState<KnowledgeMention[]>(initialData?.mentions || [])
    const [metadata, setMetadata] = useState<KnowledgeMetadata>(initialData?.metadata || {})

    // Auto-save state
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

    const editorRef = useRef<any>(null)

    // Generate excerpt from content
    const generateExcerpt = (content: string) => {
      const plainText = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/#{1,6}\s+/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .trim()

      return plainText.length > 300 ? `${plainText.substring(0, 297)}...` : plainText
    }

    // Handle content changes
    const handleContentChange = (newContent: string, newMentions: KnowledgeMention[] = []) => {
      setContent(newContent)
      setMentions(newMentions)

      // Auto-generate excerpt if not manually set
      if (!excerpt) {
        setExcerpt(generateExcerpt(newContent))
      }

      // Trigger auto-save
      if (autoSave && onSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
          handleAutoSave()
        }, autoSaveDelay)
      }
    }

    // Handle auto-save
    const handleAutoSave = async () => {
      if (!onSave) return

      setIsAutoSaving(true)
      try {
        const data = getFormData()
        await onSave(data)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsAutoSaving(false)
      }
    }

    // Get form data
    const getFormData = (): CreateKnowledge | UpdateKnowledge => {
      return {
        title,
        content,
        excerpt: excerpt || generateExcerpt(content),
        status,
        templateType,
        mentions,
        metadata: {
          ...metadata,
          tags: metadata.tags || [],
        },
      }
    }

    // Handle manual save
    const handleSave = () => {
      if (onSave) {
        onSave(getFormData())
        setLastSaved(new Date())
      }
    }

    // Handle preview
    const handlePreview = () => {
      if (onPreview) {
        onPreview({ title, content })
      }
    }

    // Add tag
    const addTag = (tag: string) => {
      if (tag && !metadata.tags?.includes(tag)) {
        setMetadata((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), tag],
        }))
      }
    }

    // Remove tag
    const removeTag = (tagToRemove: string) => {
      setMetadata((prev) => ({
        ...prev,
        tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
      }))
    }

    // Imperative API
    useImperativeHandle(ref, () => ({
      getContent: getFormData,
      setContent: (data) => {
        if (data) {
          setTitle(data.title || '')
          setContent(data.content || '')
          setExcerpt(data.excerpt || '')
          setStatus(data.status || 'draft')
          setTemplateType(data.templateType || 'general')
          setMentions(data.mentions || [])
          setMetadata(data.metadata || {})
        }
      },
      save: handleSave,
      clear: () => {
        setTitle('')
        setContent('')
        setExcerpt('')
        setStatus('draft')
        setTemplateType('general')
        setMentions([])
        setMetadata({})
        editorRef.current?.clear()
      },
      focus: () => {
        editorRef.current?.focus()
      },
    }))

    // Cleanup auto-save timeout
    useEffect(() => {
      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current)
        }
      }
    }, [])

    const selectedTemplate = TEMPLATE_TYPES.find((t) => t.value === templateType)
    const selectedStatus = STATUS_OPTIONS.find((s) => s.value === status)

    return (
      <div className={cn('space-y-6', className)}>
        {/* Header with actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {selectedTemplate && (
              <selectedTemplate.icon className='w-5 h-5 text-muted-foreground' />
            )}
            <h2 className='text-lg font-semibold'>
              {initialData?.id ? 'Edit Knowledge' : 'New Knowledge'}
            </h2>
            {initialData?.version && <Badge variant='outline'>v{initialData.version}</Badge>}
          </div>

          <div className='flex items-center gap-2'>
            {autoSave && (
              <div className='text-xs text-muted-foreground'>
                {isAutoSaving
                  ? 'Auto-saving...'
                  : lastSaved
                    ? `Saved ${lastSaved.toLocaleTimeString()}`
                    : 'Not saved'}
              </div>
            )}

            {onVersionHistory && initialData?.id && (
              <Button variant='outline' size='sm' onClick={onVersionHistory}>
                <History className='w-4 h-4 mr-2' />
                History
              </Button>
            )}

            <Button variant='outline' size='sm' onClick={handlePreview}>
              <Eye className='w-4 h-4 mr-2' />
              Preview
            </Button>

            <Button onClick={handleSave} disabled={readOnly}>
              <Save className='w-4 h-4 mr-2' />
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue='content' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='content'>Content</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
            <TabsTrigger value='metadata'>Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value='content' className='space-y-4'>
            {/* Title */}
            <div className='space-y-2'>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Enter knowledge document title...'
                disabled={readOnly}
                className='text-lg font-medium'
              />
            </div>

            {/* Content Editor */}
            <div className='space-y-2'>
              <Label>Content *</Label>
              <div className='border rounded-lg'>
                <RichTextEditor
                  ref={editorRef}
                  content={content}
                  placeholder='Start writing your knowledge document...'
                  onChange={(newContent) => {
                    // The rich text editor would need to be enhanced to extract mentions
                    handleContentChange(newContent, mentions)
                  }}
                  editable={!readOnly}
                  showToolbar={true}
                  className='min-h-[400px]'
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className='space-y-2'>
              <Label htmlFor='excerpt'>Excerpt</Label>
              <Textarea
                id='excerpt'
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder='Auto-generated from content or enter custom excerpt...'
                disabled={readOnly}
                rows={3}
              />
              <div className='text-xs text-muted-foreground'>{excerpt.length}/300 characters</div>
            </div>
          </TabsContent>

          <TabsContent value='settings' className='space-y-4'>
            {/* Template Type */}
            <div className='space-y-2'>
              <Label htmlFor='templateType'>Template Type</Label>
              <Select
                value={templateType}
                onValueChange={(value) => setTemplateType(value as KnowledgeTemplateType)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className='flex items-center gap-2'>
                        <Icon className='w-4 h-4' />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as KnowledgeStatus)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(({ value, label, color }) => (
                    <SelectItem key={value} value={value}>
                      <div className='flex items-center gap-2'>
                        <div className={cn('w-2 h-2 rounded-full', color)} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Templates (if creating new document) */}
            {!initialData?.id && templates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Start from Template</CardTitle>
                  <CardDescription>Choose a template to get started quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-2'>
                    {templates.slice(0, 5).map((template) => (
                      <Button
                        key={template.id}
                        variant='outline'
                        onClick={() => {
                          // This would load template content
                          setTemplateType(template.templateType)
                        }}
                        className='justify-start'
                      >
                        <FileText className='w-4 h-4 mr-2' />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='metadata' className='space-y-4'>
            {/* Tags */}
            <div className='space-y-2'>
              <Label>Tags</Label>
              <div className='flex flex-wrap gap-2 mb-2'>
                {metadata.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant='secondary'
                    className='cursor-pointer'
                    onClick={() => !readOnly && removeTag(tag)}
                  >
                    {tag}
                    {!readOnly && <span className='ml-1 text-xs opacity-70'>×</span>}
                  </Badge>
                ))}
              </div>
              {!readOnly && (
                <Input
                  placeholder='Add tag and press Enter...'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const value = e.currentTarget.value.trim()
                      if (value) {
                        addTag(value)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              )}
            </div>

            {/* Category */}
            <div className='space-y-2'>
              <Label htmlFor='category'>Category</Label>
              <Input
                id='category'
                value={metadata.category || ''}
                onChange={(e) => setMetadata((prev) => ({ ...prev, category: e.target.value }))}
                placeholder='Enter category...'
                disabled={readOnly}
              />
            </div>

            {/* Source URL */}
            <div className='space-y-2'>
              <Label htmlFor='sourceUrl'>Source URL</Label>
              <Input
                id='sourceUrl'
                value={metadata.sourceUrl || ''}
                onChange={(e) => setMetadata((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder='https://example.com/source'
                disabled={readOnly}
                type='url'
              />
            </div>

            {/* Summary */}
            <div className='space-y-2'>
              <Label htmlFor='summary'>Summary</Label>
              <Textarea
                id='summary'
                value={metadata.summary || ''}
                onChange={(e) => setMetadata((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder='Brief summary of the content...'
                disabled={readOnly}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Mentions Display */}
        {mentions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>References ({mentions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {mentions.map((mention, index) => (
                  <Badge key={index} variant='outline'>
                    {mention.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }
)

KnowledgeEditor.displayName = 'KnowledgeEditor'
