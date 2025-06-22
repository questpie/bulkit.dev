'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Label } from '@bulkit/ui/components/ui/label'
import { Switch } from '@bulkit/ui/components/ui/switch'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@bulkit/ui/components/ui/tabs'
import { 
  FileText,
  Image,
  Video,
  Calendar,
  Sparkles,
  Hash,
  Send,
  Save,
  Loader2,
  X,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

interface QuickPostCreatorProps {
  conversationId: string
  onComplete: () => void
}

const postTypes = [
  { id: 'regular', label: 'Regular Post', icon: FileText, description: 'Text with optional media' },
  { id: 'reel', label: 'Reel/Video', icon: Video, description: 'Short video content' },
  { id: 'story', label: 'Story', icon: Image, description: 'Temporary visual content' },
]

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
]

export function QuickPostCreator({ conversationId, onComplete }: QuickPostCreatorProps) {
  const [postType, setPostType] = useState('regular')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [hashtags, setHashtags] = useState<string[]>([])
  const [newHashtag, setNewHashtag] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleAddHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags(prev => [...prev, newHashtag.trim()])
      setNewHashtag('')
    }
  }

  const handleRemoveHashtag = (hashtag: string) => {
    setHashtags(prev => prev.filter(h => h !== hashtag))
  }

  const generateAISuggestions = async () => {
    // Mock AI suggestions - would integrate with actual AI service
    const suggestions = [
      'Add a compelling hook in the first line',
      'Include a call-to-action',
      'Consider adding relevant trending hashtags',
      'Mention your target audience directly',
      'Add an engaging question to boost comments',
    ]
    setAiSuggestions(suggestions)
  }

  const improveContentWithAI = async () => {
    if (!content.trim()) return
    
    // Mock AI improvement - would integrate with actual AI service
    const improvedContent = content + '\n\n✨ What do you think? Share your thoughts below! 👇'
    setContent(improvedContent)
  }

  const handleCreate = async () => {
    setIsCreating(true)
    
    try {
      // Create post data
      const postData = {
        type: postType,
        title: title || undefined,
        content,
        platforms: selectedPlatforms,
        hashtags,
        scheduledAt: isScheduled && scheduleDate && scheduleTime 
          ? new Date(`${scheduleDate}T${scheduleTime}`)
          : undefined,
        status: isScheduled ? 'scheduled' : 'draft',
      }

      // Mock API call - would integrate with actual post creation service
      console.log('Creating post:', postData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onComplete()
    } catch (error) {
      console.error('Failed to create post:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const canCreate = content.trim() && selectedPlatforms.length > 0

  return (
    <div className="space-y-6">
      {/* Post Type Selection */}
      <div className="space-y-3">
        <Label>Post Type</Label>
        <div className="grid grid-cols-3 gap-3">
          {postTypes.map(type => {
            const Icon = type.icon
            return (
              <Button
                key={type.id}
                variant={postType === type.id ? 'default' : 'outline'}
                onClick={() => setPostType(type.id)}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <Icon className="w-5 h-5" />
                <div className="text-center">
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <Label>Platforms</Label>
        <div className="flex flex-wrap gap-2">
          {platforms.map(platform => {
            const Icon = platform.icon
            const isSelected = selectedPlatforms.includes(platform.id)
            
            return (
              <Button
                key={platform.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePlatformToggle(platform.id)}
                className="flex items-center gap-2"
              >
                <div className={cn("w-4 h-4 rounded flex items-center justify-center", 
                  isSelected ? 'bg-white/20' : platform.color
                )}>
                  <Icon className={cn("w-3 h-3", isSelected ? 'text-white' : 'text-white')} />
                </div>
                {platform.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Content Creation */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {postType !== 'regular' && (
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="ai-assist"
                    checked={useAI}
                    onCheckedChange={setUseAI}
                  />
                  <Label htmlFor="ai-assist" className="text-xs">AI Assist</Label>
                </div>
                {useAI && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={improveContentWithAI}
                    disabled={!content.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Improve
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              id="content"
              placeholder="What's on your mind? Share your thoughts, experiences, or ideas..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 resize-none"
              maxLength={2200}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{content.length}/2200 characters</span>
              {selectedPlatforms.includes('twitter') && content.length > 280 && (
                <Badge variant="destructive" className="text-xs">
                  Too long for X/Twitter
                </Badge>
              )}
            </div>
          </div>

          {useAI && aiSuggestions.length === 0 && content.length > 50 && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateAISuggestions}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get AI Suggestions
            </Button>
          )}

          {aiSuggestions.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Suggestions
              </div>
              <div className="space-y-1">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <div className="space-y-2">
            <Label>Add Hashtags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter hashtag..."
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddHashtag}
                disabled={!newHashtag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {hashtags.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Hashtags ({hashtags.length})</Label>
              <div className="flex flex-wrap gap-2">
                {hashtags.map(hashtag => (
                  <Badge
                    key={hashtag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    #{hashtag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHashtag(hashtag)}
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // Mock hashtag generation
              const suggestions = ['socialmedia', 'contentcreator', 'marketing', 'digitalmarketing']
              setHashtags(prev => [...prev, ...suggestions.filter(tag => !prev.includes(tag))])
            }}
          >
            <Hash className="w-4 h-4 mr-2" />
            Generate Hashtags with AI
          </Button>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="schedule"
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
            />
            <Label htmlFor="schedule">Schedule for later</Label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {!isScheduled && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Post will be created as a draft. You can publish it immediately or schedule it later.
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onComplete}
          disabled={isCreating}
          className="flex-1"
        >
          Cancel
        </Button>
        
        <Button
          variant="outline"
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="flex-1"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Draft
        </Button>

        <Button
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="flex-1"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isScheduled ? (
            <Calendar className="w-4 h-4 mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isScheduled ? 'Schedule' : 'Create'} Post
        </Button>
      </div>
    </div>
  )
}