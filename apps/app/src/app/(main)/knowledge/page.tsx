'use client'

import { useState } from 'react'
import { KnowledgeList } from './_components/knowledge-list'
import { KnowledgeEditor } from './_components/knowledge-editor'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bulkit/ui/components/ui/dialog'
import type { KnowledgeListQuery } from '@bulkit/shared/modules/knowledge/knowledge.schemas'

export default function KnowledgePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Mock data - replace with actual API calls
  const [items] = useState([
    {
      id: '1',
      title: 'Brand Guidelines 2024',
      excerpt: 'Complete brand guidelines including logo usage, colors, and typography standards for 2024.',
      status: 'published' as const,
      templateType: 'brand_guidelines' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 45,
      version: 2,
      createdByUser: {
        id: '1',
        displayName: 'John Doe',
        email: 'john@example.com'
      },
      lastEditedByUser: {
        id: '1',
        displayName: 'John Doe',
        email: 'john@example.com'
      },
      metadata: {
        tags: ['branding', 'guidelines', '2024'],
        category: 'Brand Assets'
      }
    }
  ])

  const handleSearch = (query: KnowledgeListQuery) => {
    console.log('Search query:', query)
    // Implement actual search logic here
  }

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true)
  }

  const handleView = (item: any) => {
    console.log('View item:', item)
    // Navigate to view page or open modal
  }

  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (item: any) => {
    console.log('Delete item:', item)
    // Implement delete logic
  }

  const handleVersionHistory = (item: any) => {
    console.log('Version history for:', item)
    // Navigate to version history page
  }

  const handleSave = (data: any) => {
    console.log('Save data:', data)
    // Implement save logic
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="container mx-auto p-6">
      <KnowledgeList
        items={items}
        totalCount={items.length}
        currentPage={1}
        pageSize={20}
        onPageChange={() => {}}
        onSearch={handleSearch}
        onCreateNew={handleCreateNew}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onVersionHistory={handleVersionHistory}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Knowledge Document</DialogTitle>
          </DialogHeader>
          <KnowledgeEditor
            onSave={handleSave}
            autoSave={false}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Document</DialogTitle>
          </DialogHeader>
          <KnowledgeEditor
            initialData={selectedItem}
            onSave={handleSave}
            autoSave={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}