'use client'

import { useState, useCallback } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Progress } from '@bulkit/ui/components/ui/progress'
import React from 'react'
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bulkit/ui/components/ui/tabs'
import { 
  Upload,
  Image,
  Video,
  Music,
  File,
  X,
  Check,
  Link,
  Search,
  Download,
  Play,
  Pause,
  Camera,
  Loader2,
  AlertCircle,
  Palette,
  Save,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

interface MediaUploaderProps {
  conversationId: string
  onComplete: () => void
}

interface UploadedFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  size: number
  url: string
  thumbnail?: string
  uploadProgress: number
  status: 'uploading' | 'completed' | 'error'
}

interface StockImage {
  id: string
  url: string
  thumbnail: string
  title: string
  author: string
  tags: string[]
  source: 'unsplash' | 'pixabay'
}

const fileTypes = [
  { type: 'image', label: 'Images', icon: Image, accept: 'image/*', description: 'JPG, PNG, GIF, WebP' },
  { type: 'video', label: 'Videos', icon: Video, accept: 'video/*', description: 'MP4, MOV, AVI, WebM' },
  { type: 'audio', label: 'Audio', icon: Music, accept: 'audio/*', description: 'MP3, WAV, AAC' },
  { type: 'document', label: 'Documents', icon: File, accept: '.pdf,.doc,.docx,.txt', description: 'PDF, DOC, TXT' },
]

export function MediaUploader({ conversationId, onComplete }: MediaUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isUrlLoading, setIsUrlLoading] = useState(false)
  const [stockImages, setStockImages] = useState<StockImage[]>([])
  const [stockSearchQuery, setStockSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      const fileId = Math.random().toString(36).substring(7)
      const fileType = getFileType(file.type)
      
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: fileType,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadProgress: 0,
        status: 'uploading',
      }
      
      setUploadedFiles(prev => [...prev, newFile])
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, uploadProgress: Math.min(f.uploadProgress + 10, 100) }
            : f
        ))
      }, 200)
      
      // Complete upload after 2 seconds
      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, uploadProgress: 100, status: 'completed' }
            : f
        ))
      }, 2000)
    }
  }

  const getFileType = (mimeType: string): UploadedFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return
    
    setIsUrlLoading(true)
    try {
      // Mock URL import - would integrate with actual service
      const fileId = Math.random().toString(36).substring(7)
      const fileName = urlInput.split('/').pop() || 'imported-file'
      
      const importedFile: UploadedFile = {
        id: fileId,
        name: fileName,
        type: 'image', // Would detect from URL
        size: 1024000, // Mock size
        url: urlInput,
        uploadProgress: 100,
        status: 'completed',
      }
      
      setUploadedFiles(prev => [...prev, importedFile])
      setUrlInput('')
    } catch (error) {
      console.error('Failed to import from URL:', error)
    } finally {
      setIsUrlLoading(false)
    }
  }

  const searchStockImages = async () => {
    if (!stockSearchQuery.trim()) return
    
    setIsSearching(true)
    try {
      // Mock stock image search - would integrate with Unsplash/Pixabay APIs
      const mockImages: StockImage[] = [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
          title: 'Social Media Marketing',
          author: 'John Doe',
          tags: ['marketing', 'social', 'business'],
          source: 'unsplash',
        },
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400',
          title: 'Content Creation',
          author: 'Jane Smith',
          tags: ['content', 'writing', 'creative'],
          source: 'unsplash',
        },
        {
          id: '3',
          url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
          title: 'Analytics Dashboard',
          author: 'Mike Johnson',
          tags: ['analytics', 'data', 'charts'],
          source: 'unsplash',
        },
      ]
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStockImages(mockImages)
    } catch (error) {
      console.error('Failed to search stock images:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleStockImageSelect = (image: StockImage) => {
    const fileId = Math.random().toString(36).substring(7)
    
    const stockFile: UploadedFile = {
      id: fileId,
      name: `${image.title}.jpg`,
      type: 'image',
      size: 1024000, // Mock size
      url: image.url,
      thumbnail: image.thumbnail,
      uploadProgress: 100,
      status: 'completed',
    }
    
    setUploadedFiles(prev => [...prev, stockFile])
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    setSelectedFiles(prev => prev.filter(id => id !== fileId))
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      case 'document': return <File className="w-4 h-4" />
    }
  }

  const renderUploadedFile = (file: UploadedFile) => {
    const isSelected = selectedFiles.includes(file.id)
    
    return (
      <div
        key={file.id}
        className={cn(
          "p-3 border rounded-lg transition-all",
          isSelected && "border-primary bg-primary/5",
          file.status === 'error' && "border-destructive bg-destructive/5"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail/Icon */}
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
            {file.type === 'image' && file.url ? (
              <img
                src={file.thumbnail || file.url}
                alt={file.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              getFileIcon(file.type)
            )}
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{file.name}</span>
              <Badge variant="outline" className="text-xs">
                {file.type}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </div>
            
            {file.status === 'uploading' && (
              <div className="mt-2">
                <Progress value={file.uploadProgress} className="h-1" />
                <div className="text-xs text-muted-foreground mt-1">
                  Uploading... {file.uploadProgress}%
                </div>
              </div>
            )}
            
            {file.status === 'error' && (
              <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                <AlertCircle className="w-3 h-3" />
                Upload failed
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {file.status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFileSelection(file.id)}
                className="h-8 w-8 p-0"
              >
                {isSelected ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <div className="w-4 h-4 border-2 border-muted-foreground rounded" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFile(file.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">From URL</TabsTrigger>
          <TabsTrigger value="stock">Stock Images</TabsTrigger>
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary/50 hover:bg-muted/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drag and drop files here</h3>
            <p className="text-muted-foreground mb-4">
              or click to select files from your computer
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {fileTypes.map(({ type, label, accept, description }) => (
                <div key={type}>
                  <input
                    type="file"
                    accept={accept}
                    multiple
                    onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                    className="hidden"
                    id={`file-${type}`}
                  />
                  <label htmlFor={`file-${type}`}>
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        {React.createElement(fileTypes.find(ft => ft.type === type)?.icon || Upload, { className: "w-4 h-4 mr-2" })}
                        {label}
                      </span>
                    </Button>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Supported formats: Images (JPG, PNG, GIF), Videos (MP4, MOV), Audio (MP3, WAV), Documents (PDF, DOC)
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Import from URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
              />
              <Button
                onClick={handleUrlImport}
                disabled={!urlInput.trim() || isUrlLoading}
              >
                {isUrlLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            💡 You can import media from any publicly accessible URL
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stock-search">Search Stock Images</Label>
            <div className="flex gap-2">
              <Input
                id="stock-search"
                placeholder="Search for images..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStockImages()}
              />
              <Button
                onClick={searchStockImages}
                disabled={!stockSearchQuery.trim() || isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {stockImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {stockImages.map(image => (
                <div
                  key={image.id}
                  className="group cursor-pointer rounded-lg overflow-hidden border hover:border-primary/50 transition-colors"
                  onClick={() => handleStockImageSelect(image)}
                >
                  <div className="aspect-video relative">
                    <img
                      src={image.thumbnail}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm">{image.title}</div>
                    <div className="text-xs text-muted-foreground">by {image.author}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="text-center py-8">
            <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">AI Image Generation</h3>
            <p className="text-muted-foreground mb-4">
              Generate custom images with AI (Coming Soon)
            </p>
            <Button disabled>
              <Palette className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Uploaded Files ({uploadedFiles.length})</Label>
            {selectedFiles.length > 0 && (
              <Badge variant="secondary">
                {selectedFiles.length} selected
              </Badge>
            )}
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map(renderUploadedFile)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onComplete}
          className="flex-1"
        >
          Cancel
        </Button>
        
        {uploadedFiles.filter(f => f.status === 'completed').length > 0 && (
          <Button
            onClick={() => {
              // Process uploaded files
              console.log('Using uploaded files:', uploadedFiles.filter(f => f.status === 'completed'))
              onComplete()
            }}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Use Files ({uploadedFiles.filter(f => f.status === 'completed').length})
          </Button>
        )}
      </div>
    </div>
  )
}