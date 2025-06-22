'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Label } from '@bulkit/ui/components/ui/label'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
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
  Sparkles,
  Lightbulb,
  TrendingUp,
  Target,
  Calendar,
  Hash,
  RefreshCw,
  Copy,
  Heart,
  MessageSquare,
  Share2,
  Loader2,
  Wand2,
  Filter,
  Clock,
  Users,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

interface ContentIdeaGeneratorProps {
  conversationId: string
  onComplete: () => void
}

const contentTypes = [
  { id: 'educational', label: 'Educational', icon: Lightbulb, description: 'How-to, tips, tutorials' },
  { id: 'entertaining', label: 'Entertaining', icon: Heart, description: 'Fun, humor, stories' },
  { id: 'promotional', label: 'Promotional', icon: TrendingUp, description: 'Products, services, offers' },
  { id: 'inspirational', label: 'Inspirational', icon: Target, description: 'Motivation, quotes, success' },
  { id: 'trending', label: 'Trending', icon: Hash, description: 'Current events, viral topics' },
  { id: 'behind-scenes', label: 'Behind the Scenes', icon: Users, description: 'Process, team, workplace' },
]

const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube']

const industries = [
  'Technology', 'Fashion', 'Food & Restaurant', 'Fitness & Health', 
  'Travel', 'Business', 'Education', 'Entertainment', 'Real Estate', 'Finance'
]

interface ContentIdea {
  id: string
  title: string
  description: string
  contentType: string
  platform: string
  hashtags: string[]
  estimatedEngagement: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  trending: boolean
}

export function ContentIdeaGenerator({ conversationId, onComplete }: ContentIdeaGeneratorProps) {
  const [selectedType, setSelectedType] = useState('educational')
  const [selectedPlatform, setSelectedPlatform] = useState('instagram')
  const [industry, setIndustry] = useState('')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([])

  const generateIdeas = async () => {
    setIsGenerating(true)
    
    try {
      // Mock idea generation - would integrate with actual AI service
      const mockIdeas: ContentIdea[] = [
        {
          id: '1',
          title: '5 Common Social Media Mistakes to Avoid',
          description: 'Create an educational carousel post highlighting the most frequent mistakes businesses make on social media and how to fix them.',
          contentType: 'educational',
          platform: selectedPlatform,
          hashtags: ['socialmediatips', 'digitalmarketing', 'businesstips', 'contentcreator'],
          estimatedEngagement: 'high',
          difficulty: 'easy',
          trending: false,
        },
        {
          id: '2',
          title: 'Behind the Scenes: Our Content Creation Process',
          description: 'Show your audience how you create content from ideation to publication. Include time-lapse videos, tools used, and team collaboration.',
          contentType: 'behind-scenes',
          platform: selectedPlatform,
          hashtags: ['behindthescenes', 'contentcreation', 'process', 'team'],
          estimatedEngagement: 'medium',
          difficulty: 'medium',
          trending: true,
        },
        {
          id: '3',
          title: 'Quick Win: 60-Second Marketing Tip',
          description: 'Share a bite-sized marketing insight that your audience can implement immediately. Perfect for short-form video content.',
          contentType: 'educational',
          platform: selectedPlatform,
          hashtags: ['quicktip', 'marketing', 'businessgrowth', 'entrepreneur'],
          estimatedEngagement: 'high',
          difficulty: 'easy',
          trending: false,
        },
        {
          id: '4',
          title: 'Customer Success Story Spotlight',
          description: 'Feature a customer who achieved great results using your product/service. Include before/after, testimonials, and transformation.',
          contentType: 'promotional',
          platform: selectedPlatform,
          hashtags: ['success', 'testimonial', 'transformation', 'results'],
          estimatedEngagement: 'medium',
          difficulty: 'medium',
          trending: false,
        },
        {
          id: '5',
          title: 'Trending Topic: AI in Content Creation',
          description: 'Share your perspective on how AI is changing content creation. Include pros, cons, and practical applications.',
          contentType: 'trending',
          platform: selectedPlatform,
          hashtags: ['AI', 'contentcreation', 'trending', 'future', 'technology'],
          estimatedEngagement: 'high',
          difficulty: 'hard',
          trending: true,
        },
      ]
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIdeas(mockIdeas)
    } catch (error) {
      console.error('Failed to generate ideas:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleIdeaSelect = (ideaId: string) => {
    setSelectedIdeas(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    )
  }

  const copyIdeaToClipboard = (idea: ContentIdea) => {
    const text = `${idea.title}\n\n${idea.description}\n\nHashtags: ${idea.hashtags.map(tag => `#${tag}`).join(' ')}`
    navigator.clipboard.writeText(text)
  }

  const createPostFromIdea = (idea: ContentIdea) => {
    // This would integrate with the QuickPostCreator
    console.log('Creating post from idea:', idea)
    onComplete()
  }

  const renderIdeaCard = (idea: ContentIdea) => {
    const isSelected = selectedIdeas.includes(idea.id)
    const typeInfo = contentTypes.find(t => t.id === idea.contentType)
    
    return (
      <div
        key={idea.id}
        className={cn(
          "p-4 border rounded-lg cursor-pointer transition-all",
          "hover:shadow-md hover:border-primary/30",
          isSelected && "border-primary bg-primary/5"
        )}
        onClick={() => handleIdeaSelect(idea.id)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{idea.title}</h4>
                {idea.trending && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {idea.description}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {typeInfo?.label}
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                idea.estimatedEngagement === 'high' ? 'bg-green-500' :
                idea.estimatedEngagement === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
              )} />
              {idea.estimatedEngagement} engagement
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {idea.difficulty} to create
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1">
            {idea.hashtags.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {idea.hashtags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{idea.hashtags.length - 4} more
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                copyIdeaToClipboard(idea)
              }}
              className="flex-1"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                createPostFromIdea(idea)
              }}
              className="flex-1"
            >
              <Wand2 className="w-3 h-3 mr-1" />
              Create Post
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Ideas</TabsTrigger>
          <TabsTrigger value="results">Results ({ideas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Content Type Selection */}
          <div className="space-y-3">
            <Label>Content Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map(type => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type.id)}
                    className="h-auto p-3 flex items-center gap-3 text-left"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Platform and Industry */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Industry (Optional)</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(ind => (
                    <SelectItem key={ind} value={ind.toLowerCase()}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic and Audience */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Specific Topic (Optional)</Label>
              <Input
                id="topic"
                placeholder="e.g., social media analytics, content planning..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience (Optional)</Label>
              <Input
                id="audience"
                placeholder="e.g., small business owners, content creators..."
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateIdeas}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating Ideas...' : 'Generate Content Ideas'}
          </Button>

          {/* Current Settings Preview */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-medium mb-1">Generation Settings:</div>
            <div className="text-muted-foreground space-y-1">
              <div>• Content Type: {contentTypes.find(t => t.id === selectedType)?.label}</div>
              <div>• Platform: {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</div>
              {industry && <div>• Industry: {industry}</div>}
              {topic && <div>• Topic: {topic}</div>}
              {audience && <div>• Audience: {audience}</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {ideas.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Ideas Generated Yet</h3>
              <p className="text-muted-foreground mb-4">
                Switch to the Generate tab to create content ideas with AI
              </p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Generated Ideas</h3>
                  <Badge variant="secondary">{ideas.length} ideas</Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateIdeas}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Ideas Grid */}
              <div className="space-y-3">
                {ideas.map(renderIdeaCard)}
              </div>

              {/* Bulk Actions */}
              {selectedIdeas.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedIdeas.length} idea{selectedIdeas.length === 1 ? '' : 's'} selected
                  </span>
                  <Button size="sm" variant="outline">
                    <Copy className="w-4 h-4 mr-1" />
                    Copy All
                  </Button>
                  <Button size="sm">
                    <Wand2 className="w-4 h-4 mr-1" />
                    Create Posts
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onComplete}
          className="flex-1"
        >
          Close
        </Button>
        
        {ideas.length > 0 && (
          <Button
            onClick={() => {
              // Save ideas to conversation context or user workspace
              console.log('Saving ideas to workspace')
              onComplete()
            }}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save to Workspace
          </Button>
        )}
      </div>
    </div>
  )
}