'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/components/ui/select'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bulkit/ui/components/ui/dropdown-menu'
import { cn } from '@bulkit/ui/lib'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Eye, 
  Archive, 
  Trash2, 
  History,
  FileText,
  Tag,
  Globe,
  Clock,
  User,
  SortAsc,
  SortDesc,
} from 'react-icons/lu'
import type { 
  KnowledgeListQuery 
} from '@bulkit/shared/modules/knowledge/knowledge.schemas'
import type { 
  KnowledgeStatus, 
  KnowledgeTemplateType 
} from '@bulkit/shared/constants/db.constants'

interface KnowledgeItem {
  id: string
  title: string
  excerpt?: string
  status: KnowledgeStatus
  templateType: KnowledgeTemplateType
  createdAt: string
  updatedAt: string
  viewCount: number
  version: number
  createdByUser: {
    id: string
    displayName: string
    email: string
  }
  lastEditedByUser?: {
    id: string
    displayName: string
    email: string
  }
  metadata?: {
    tags?: string[]
    category?: string
  }
}

interface KnowledgeListProps {
  items: KnowledgeItem[]
  totalCount: number
  currentPage: number
  pageSize: number
  isLoading?: boolean
  onPageChange: (page: number) => void
  onSearch: (query: KnowledgeListQuery) => void
  onCreateNew: () => void
  onView: (item: KnowledgeItem) => void
  onEdit: (item: KnowledgeItem) => void
  onDelete: (item: KnowledgeItem) => void
  onVersionHistory: (item: KnowledgeItem) => void
  className?: string
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

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'title', label: 'Title' },
  { value: 'viewCount', label: 'View Count' },
] as const

export function KnowledgeList({
  items,
  totalCount,
  currentPage,
  pageSize,
  isLoading = false,
  onPageChange,
  onSearch,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onVersionHistory,
  className,
}: KnowledgeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<KnowledgeStatus | 'all'>('all')
  const [templateFilter, setTemplateFilter] = useState<KnowledgeTemplateType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'viewCount'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Handle search
  const handleSearch = () => {
    const query: KnowledgeListQuery = {
      page: 1,
      limit: pageSize,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      templateType: templateFilter !== 'all' ? templateFilter : undefined,
      sortBy,
      sortOrder,
    }
    onSearch(query)
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTemplateFilter('all')
    setSortBy('updatedAt')
    setSortOrder('desc')
    setShowFilters(false)
    
    onSearch({
      page: 1,
      limit: pageSize,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    })
  }

  // Get template info
  const getTemplateInfo = (templateType: KnowledgeTemplateType) => {
    return TEMPLATE_TYPES.find(t => t.value === templateType) || TEMPLATE_TYPES[0]
  }

  // Get status info
  const getStatusInfo = (status: KnowledgeStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return formatDate(dateString)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            {totalCount} document{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as KnowledgeStatus | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_OPTIONS.map(({ value, label, color }) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', color)} />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Template Type</label>
                  <Select value={templateFilter} onValueChange={(value) => setTemplateFilter(value as KnowledgeTemplateType | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {TEMPLATE_TYPES.map(({ value, label, icon: Icon }) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <SortDesc className="w-4 h-4" />
                          Descending
                        </div>
                      </SelectItem>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="w-4 h-4" />
                          Ascending
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 flex gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    Apply Filters
                  </Button>
                  <Button onClick={clearFilters} variant="outline">
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Items */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No knowledge documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || templateFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first knowledge document'}
                </p>
                <Button onClick={onCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Document
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Knowledge items
          items.map((item) => {
            const templateInfo = getTemplateInfo(item.templateType)
            const statusInfo = getStatusInfo(item.status)
            const TemplateIcon = templateInfo.icon

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-2">
                        <TemplateIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <h3 
                          className="font-medium text-lg cursor-pointer hover:text-primary transition-colors truncate"
                          onClick={() => onView(item)}
                        >
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={cn('w-2 h-2 rounded-full', statusInfo.color)} />
                          <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
                          {item.version > 1 && (
                            <Badge variant="outline" className="text-xs">
                              v{item.version}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Excerpt */}
                      {item.excerpt && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}

                      {/* Tags */}
                      {item.metadata?.tags && item.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.metadata.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.metadata.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.metadata.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.createdByUser.displayName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Updated {formatTimeAgo(item.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.viewCount} views
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {templateInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(item)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onVersionHistory(item)}>
                          <History className="w-4 h-4 mr-2" />
                          Version History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(item)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} documents
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2)
                if (page > totalPages) return null
                
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}