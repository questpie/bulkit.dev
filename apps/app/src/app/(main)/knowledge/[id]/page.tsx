'use client'

import { use } from 'react'
import { KnowledgeEditor } from '../_components/knowledge-editor'

interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>
}

export default function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { id } = use(params)
  
  // Mock data - replace with actual API call
  const knowledgeData = id === 'new' ? undefined : {
    id,
    title: 'Brand Guidelines 2024',
    content: '# Brand Guidelines 2024\n\nThis document outlines our brand guidelines for 2024...',
    excerpt: 'Complete brand guidelines including logo usage, colors, and typography standards for 2024.',
    status: 'published' as const,
    templateType: 'brand_guidelines' as const,
    version: 2,
    metadata: {
      tags: ['branding', 'guidelines', '2024'],
      category: 'Brand Assets',
      sourceUrl: 'https://example.com/brand-source',
      summary: 'Updated brand guidelines for the new year'
    },
    mentions: []
  }

  const handleSave = (data: any) => {
    console.log('Save knowledge:', data)
    // Implement save logic here
  }

  const handlePreview = (data: { title: string; content: string }) => {
    console.log('Preview:', data)
    // Implement preview logic
  }

  const handleVersionHistory = () => {
    console.log('Show version history for:', id)
    // Navigate to version history
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <KnowledgeEditor
        initialData={knowledgeData}
        onSave={handleSave}
        onPreview={handlePreview}
        onVersionHistory={knowledgeData ? handleVersionHistory : undefined}
        autoSave={true}
        autoSaveDelay={3000}
      />
    </div>
  )
}