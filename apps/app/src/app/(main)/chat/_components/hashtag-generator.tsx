'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Label } from '@bulkit/ui/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { 
  Hash,
  Copy,
  RefreshCw,
  Plus,
  X,
  TrendingUp,
  Target,
  Users,
  Loader2,
  Check,
  Save,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

interface HashtagGeneratorProps {
  conversationId: string
  onComplete: () => void
}

const platforms = [
  { id: 'instagram', name: 'Instagram', limit: 30, recommended: 'Use 5-15 hashtags for best reach' },
  { id: 'twitter', name: 'X (Twitter)', limit: 2, recommended: 'Use 1-2 hashtags max' },
  { id: 'linkedin', name: 'LinkedIn', limit: 5, recommended: 'Use 3-5 professional hashtags' },
  { id: 'facebook', name: 'Facebook', limit: 10, recommended: 'Use 2-5 hashtags sparingly' },
  { id: 'tiktok', name: 'TikTok', limit: 20, recommended: 'Use 3-8 trending hashtags' },
]

interface HashtagSuggestion {
  tag: string
  category: 'trending' | 'niche' | 'broad' | 'branded'
  difficulty: 'low' | 'medium' | 'high'
  volume: number
  description?: string
}

export function HashtagGenerator({ conversationId, onComplete }: HashtagGeneratorProps) {
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [niche, setNiche] = useState('')
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedPlatform = platforms.find(p => p.id === platform)!

  const generateHashtags = async () => {
    setIsGenerating(true)
    
    try {
      // Mock hashtag generation - would integrate with actual AI service
      const mockSuggestions: HashtagSuggestion[] = [
        // Trending hashtags
        { tag: 'socialmedia2024', category: 'trending', difficulty: 'high', volume: 1500000 },
        { tag: 'contentcreator', category: 'trending', difficulty: 'high', volume: 2800000 },
        { tag: 'digitalmarketing', category: 'trending', difficulty: 'high', volume: 3200000 },
        
        // Niche hashtags
        { tag: 'socialmediastrategy', category: 'niche', difficulty: 'medium', volume: 450000 },
        { tag: 'contentplanning', category: 'niche', difficulty: 'medium', volume: 320000 },
        { tag: 'brandstorytelling', category: 'niche', difficulty: 'medium', volume: 180000 },
        { tag: 'socialmediamanager', category: 'niche', difficulty: 'low', volume: 95000 },
        
        // Broad hashtags
        { tag: 'marketing', category: 'broad', difficulty: 'high', volume: 8500000 },
        { tag: 'business', category: 'broad', difficulty: 'high', volume: 12000000 },
        { tag: 'entrepreneur', category: 'broad', difficulty: 'high', volume: 4200000 },
        
        // Branded/specific
        { tag: 'smallbusiness', category: 'branded', difficulty: 'medium', volume: 2100000 },
        { tag: 'startuplife', category: 'branded', difficulty: 'medium', volume: 890000 },
        { tag: 'businesstips', category: 'branded', difficulty: 'low', volume: 540000 },
      ]
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSuggestions(mockSuggestions)
    } catch (error) {
      console.error('Failed to generate hashtags:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag))
    } else if (selectedTags.length < selectedPlatform.limit) {
      setSelectedTags(prev => [...prev, tag])
    }
  }

  const handleAddCustomTag = () => {
    const tag = customTag.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    if (tag && !selectedTags.includes(tag) && selectedTags.length < selectedPlatform.limit) {
      setSelectedTags(prev => [...prev, tag])
      setCustomTag('')
    }
  }

  const copyToClipboard = () => {
    const hashtagString = selectedTags.map(tag => `#${tag}`).join(' ')
    navigator.clipboard.writeText(hashtagString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getCategoryIcon = (category: HashtagSuggestion['category']) => {
    switch (category) {
      case 'trending': return <TrendingUp className="w-3 h-3" />
      case 'niche': return <Target className="w-3 h-3" />
      case 'broad': return <Users className="w-3 h-3" />
      case 'branded': return <Hash className="w-3 h-3" />
    }
  }

  const getCategoryColor = (category: HashtagSuggestion['category']) => {
    switch (category) {
      case 'trending': return 'bg-red-500'
      case 'niche': return 'bg-blue-500'
      case 'broad': return 'bg-green-500'
      case 'branded': return 'bg-purple-500'
    }
  }

  const getDifficultyColor = (difficulty: HashtagSuggestion['difficulty']) => {
    switch (difficulty) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`
    return volume.toString()
  }

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) acc[suggestion.category] = []
    acc[suggestion.category].push(suggestion)
    return acc
  }, {} as Record<string, HashtagSuggestion[]>)

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">Max {p.limit} hashtags</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="niche">Niche/Industry</Label>
            <Input
              id="niche"
              placeholder="e.g., fitness, food, tech"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content Description</Label>
          <Textarea
            id="content"
            placeholder="Describe your content to get better hashtag suggestions..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 resize-none"
            rows={3}
          />
        </div>

        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          {selectedPlatform.recommended}
        </div>

        <Button
          onClick={generateHashtags}
          disabled={isGenerating || !content.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Hash className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Hashtags'}
        </Button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Suggested Hashtags</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={generateHashtags}
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedSuggestions).map(([category, tags]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getCategoryColor(category as any))} />
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <Badge variant="outline" className="text-xs">{tags.length}</Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {tags.map(suggestion => {
                    const isSelected = selectedTags.includes(suggestion.tag)
                    const canSelect = isSelected || selectedTags.length < selectedPlatform.limit
                    
                    return (
                      <div
                        key={suggestion.tag}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all",
                          "hover:border-primary/30",
                          isSelected && "border-primary bg-primary/5",
                          !canSelect && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => canSelect && handleTagSelect(suggestion.tag)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(suggestion.category)}
                            <div>
                              <div className="font-medium text-sm">#{suggestion.tag}</div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className={getDifficultyColor(suggestion.difficulty)}>
                                  {suggestion.difficulty} difficulty
                                </span>
                                <span>{formatVolume(suggestion.volume)} posts</span>
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Hashtag Input */}
      <div className="space-y-2">
        <Label>Add Custom Hashtag</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">#</span>
            <Input
              placeholder="customhashtag"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
              className="pl-7"
              disabled={selectedTags.length >= selectedPlatform.limit}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim() || selectedTags.length >= selectedPlatform.limit}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Hashtags */}
      {selectedTags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Selected Hashtags ({selectedTags.length}/{selectedPlatform.limit})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                #{tag}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTagSelect(tag)}
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-1">Copy-ready hashtags:</div>
            <div className="text-sm text-muted-foreground break-words">
              {selectedTags.map(tag => `#${tag}`).join(' ')}
            </div>
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
          Close
        </Button>
        
        {selectedTags.length > 0 && (
          <Button
            onClick={() => {
              // Save hashtags to workspace or integrate with post creator
              console.log('Saving hashtags:', selectedTags)
              onComplete()
            }}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Hashtags
          </Button>
        )}
      </div>
    </div>
  )
}