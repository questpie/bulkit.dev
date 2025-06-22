'use client'

import { useState, useEffect } from 'react'
import { Button } from '@bulkit/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/card'
import { Input } from '@bulkit/ui/input'
import { Label } from '@bulkit/ui/label'
import { Textarea } from '@bulkit/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/select'
import { Badge } from '@bulkit/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/tabs'
import { Switch } from '@bulkit/ui/switch'
import { Separator } from '@bulkit/ui/separator'
import { ScrollArea } from '@bulkit/ui/scroll-area'
import { 
  Wand2, 
  Lightbulb, 
  Target, 
  Shuffle, 
  Copy, 
  Save, 
  Star,
  BookOpen,
  Zap,
  Palette,
  Camera,
  Brush,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react'
import { cn } from '@bulkit/ui/utils'

interface PromptTemplate {
  id: string
  name: string
  category: string
  template: string
  variables: string[]
  description: string
  example: string
  tags: string[]
}

interface PromptEnhancement {
  type: 'style' | 'quality' | 'composition' | 'lighting' | 'mood' | 'technical'
  label: string
  options: string[]
}

interface PromptAnalysis {
  score: number
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
  improvedPrompt: string
}

interface PromptEngineeringToolsProps {
  onAnalyzePrompt?: (prompt: string) => Promise<PromptAnalysis>
  onSaveTemplate?: (template: Omit<PromptTemplate, 'id'>) => Promise<void>
  onEnhancePrompt?: (prompt: string, enhancements: string[]) => Promise<string>
  className?: string
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    name: 'Product Photography',
    category: 'Photography',
    template: '{product} on {background}, {lighting} lighting, {style} style, {quality}',
    variables: ['product', 'background', 'lighting', 'style', 'quality'],
    description: 'Professional product photography template',
    example: 'Modern wireless headphones on white background, studio lighting, minimalist style, high quality',
    tags: ['product', 'photography', 'commercial']
  },
  {
    id: '2',
    name: 'Portrait Photography',
    category: 'Photography',
    template: '{subject} portrait, {age} {gender}, {expression}, {lighting}, {background}, {style}',
    variables: ['subject', 'age', 'gender', 'expression', 'lighting', 'background', 'style'],
    description: 'Professional portrait photography template',
    example: 'Professional headshot, 30-year-old woman, confident smile, soft lighting, blurred office background, corporate style',
    tags: ['portrait', 'people', 'professional']
  },
  {
    id: '3',
    name: 'Digital Art',
    category: 'Art',
    template: '{subject} in {art_style} style, {color_palette}, {mood}, {composition}, {quality}',
    variables: ['subject', 'art_style', 'color_palette', 'mood', 'composition', 'quality'],
    description: 'Digital artwork creation template',
    example: 'Fantasy dragon in digital painting style, vibrant blues and purples, epic mood, dynamic composition, ultra detailed',
    tags: ['art', 'digital', 'fantasy']
  },
  {
    id: '4',
    name: 'Logo Design',
    category: 'Design',
    template: '{company_type} logo, {style}, {colors}, {elements}, vector graphics, {background}',
    variables: ['company_type', 'style', 'colors', 'elements', 'background'],
    description: 'Logo design template for branding',
    example: 'Tech startup logo, modern minimalist, blue and white, geometric elements, vector graphics, transparent background',
    tags: ['logo', 'branding', 'vector']
  },
  {
    id: '5',
    name: 'Architecture',
    category: 'Architecture',
    template: '{building_type}, {architectural_style}, {time_of_day}, {weather}, {perspective}, {quality}',
    variables: ['building_type', 'architectural_style', 'time_of_day', 'weather', 'perspective', 'quality'],
    description: 'Architectural visualization template',
    example: 'Modern house, contemporary minimalist style, golden hour, clear sky, exterior perspective, photorealistic',
    tags: ['architecture', 'building', 'exterior']
  }
]

const ENHANCEMENT_CATEGORIES: PromptEnhancement[] = [
  {
    type: 'style',
    label: 'Art Style',
    options: [
      'photorealistic', 'hyperrealistic', 'cinematic', 'digital art', 'oil painting',
      'watercolor', 'pencil sketch', 'vector art', 'anime', 'cartoon', 'minimalist',
      'abstract', 'surreal', 'impressionist', 'art nouveau', 'pop art'
    ]
  },
  {
    type: 'quality',
    label: 'Quality & Detail',
    options: [
      'ultra detailed', 'highly detailed', 'intricate details', '8K resolution',
      'professional quality', 'award winning', 'masterpiece', 'sharp focus',
      'crystal clear', 'HD', '4K', 'ultra HD', 'best quality'
    ]
  },
  {
    type: 'composition',
    label: 'Composition',
    options: [
      'rule of thirds', 'centered composition', 'dynamic composition',
      'symmetrical', 'asymmetrical', 'close-up', 'wide shot', 'medium shot',
      'bird\'s eye view', 'low angle', 'high angle', 'dutch angle'
    ]
  },
  {
    type: 'lighting',
    label: 'Lighting',
    options: [
      'natural lighting', 'studio lighting', 'soft lighting', 'dramatic lighting',
      'golden hour', 'blue hour', 'sunset', 'sunrise', 'neon lighting',
      'volumetric lighting', 'rim lighting', 'backlighting', 'side lighting'
    ]
  },
  {
    type: 'mood',
    label: 'Mood & Atmosphere',
    options: [
      'peaceful', 'energetic', 'mysterious', 'dramatic', 'romantic', 'futuristic',
      'nostalgic', 'cozy', 'elegant', 'bold', 'serene', 'intense', 'playful'
    ]
  },
  {
    type: 'technical',
    label: 'Technical Settings',
    options: [
      'shallow depth of field', 'deep focus', 'bokeh', 'long exposure',
      'macro photography', 'wide angle lens', 'telephoto lens', 'fisheye',
      'tilt-shift', 'HDR', 'black and white', 'sepia tone', 'color grading'
    ]
  }
]

const STYLE_KEYWORDS = {
  Photography: ['professional', 'commercial', 'editorial', 'lifestyle', 'documentary'],
  Art: ['abstract', 'realistic', 'impressionist', 'surreal', 'contemporary'],
  Design: ['modern', 'minimalist', 'vintage', 'corporate', 'creative'],
  Architecture: ['contemporary', 'traditional', 'futuristic', 'industrial', 'residential']
}

export function PromptEngineeringTools({ 
  onAnalyzePrompt, 
  onSaveTemplate, 
  onEnhancePrompt, 
  className 
}: PromptEngineeringToolsProps) {
  const [activeTab, setActiveTab] = useState('builder')
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [builtPrompt, setBuiltPrompt] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedEnhancements, setSelectedEnhancements] = useState<Record<string, string[]>>({})
  const [promptAnalysis, setPromptAnalysis] = useState<PromptAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<PromptTemplate[]>(PROMPT_TEMPLATES)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '',
    template: '',
    description: '',
    example: '',
    tags: [] as string[]
  })

  // Build prompt from template
  useEffect(() => {
    if (selectedTemplate) {
      let prompt = selectedTemplate.template
      selectedTemplate.variables.forEach(variable => {
        const value = templateVariables[variable] || `[${variable}]`
        prompt = prompt.replace(`{${variable}}`, value)
      })
      setBuiltPrompt(prompt)
    }
  }, [selectedTemplate, templateVariables])

  const selectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setTemplateVariables({})
  }

  const updateVariable = (variable: string, value: string) => {
    setTemplateVariables(prev => ({ ...prev, [variable]: value }))
  }

  const toggleEnhancement = (category: string, option: string) => {
    setSelectedEnhancements(prev => {
      const current = prev[category] || []
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option]
      return { ...prev, [category]: updated }
    })
  }

  const applyEnhancements = async () => {
    const basePrompt = builtPrompt || customPrompt
    if (!basePrompt.trim()) return

    setIsEnhancing(true)
    try {
      const allEnhancements = Object.values(selectedEnhancements).flat()
      if (onEnhancePrompt) {
        const enhanced = await onEnhancePrompt(basePrompt, allEnhancements)
        setCustomPrompt(enhanced)
      } else {
        // Fallback: manually apply enhancements
        const enhancementText = allEnhancements.join(', ')
        const enhanced = `${basePrompt}, ${enhancementText}`
        setCustomPrompt(enhanced)
      }
    } catch (error) {
      console.error('Enhancement failed:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const analyzePrompt = async () => {
    const prompt = customPrompt || builtPrompt
    if (!prompt.trim()) return

    setIsAnalyzing(true)
    try {
      if (onAnalyzePrompt) {
        const analysis = await onAnalyzePrompt(prompt)
        setPromptAnalysis(analysis)
      } else {
        // Mock analysis
        const mockAnalysis: PromptAnalysis = {
          score: Math.floor(Math.random() * 30) + 70,
          suggestions: [
            'Add more specific lighting details',
            'Include camera angle information',
            'Specify the mood or atmosphere'
          ],
          strengths: [
            'Clear subject description',
            'Good style specification'
          ],
          weaknesses: [
            'Missing composition details',
            'Could use more technical parameters'
          ],
          improvedPrompt: `${prompt}, professional photography, rule of thirds, dramatic lighting, ultra detailed, 8K resolution`
        }
        setPromptAnalysis(mockAnalysis)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveCustomTemplate = async () => {
    if (!newTemplate.name || !newTemplate.template) return

    const template: Omit<PromptTemplate, 'id'> = {
      ...newTemplate,
      variables: extractVariables(newTemplate.template),
      tags: newTemplate.tags.length > 0 ? newTemplate.tags : ['custom']
    }

    try {
      if (onSaveTemplate) {
        await onSaveTemplate(template)
      }
      
      const templateWithId = { ...template, id: Date.now().toString() }
      setSavedTemplates(prev => [templateWithId, ...prev])
      
      // Reset form
      setNewTemplate({
        name: '',
        category: '',
        template: '',
        description: '',
        example: '',
        tags: []
      })
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const extractVariables = (template: string): string[] => {
    const matches = template.match(/\{([^}]+)\}/g)
    return matches ? matches.map(match => match.slice(1, -1)) : []
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const generateRandomPrompt = () => {
    const subjects = ['cat', 'robot', 'flower', 'castle', 'spaceship', 'portrait']
    const styles = ['photorealistic', 'digital art', 'oil painting', 'anime']
    const moods = ['dramatic', 'peaceful', 'mysterious', 'energetic']
    
    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    const style = styles[Math.floor(Math.random() * styles.length)]
    const mood = moods[Math.floor(Math.random() * moods.length)]
    
    setCustomPrompt(`${subject} in ${style} style, ${mood} atmosphere, highly detailed`)
  }

  return (
    <div className={cn('w-full max-w-6xl mx-auto space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Prompt Engineering Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Template Builder
              </TabsTrigger>
              <TabsTrigger value="enhancer" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enhancer
              </TabsTrigger>
              <TabsTrigger value="analyzer" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Analyzer
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Template Library
              </TabsTrigger>
            </TabsList>

            {/* Template Builder */}
            <TabsContent value="builder" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Choose a Template</Label>
                    <Button size="sm" variant="outline" onClick={generateRandomPrompt}>
                      <Shuffle className="h-4 w-4 mr-1" />
                      Random
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-64 border rounded-lg p-2">
                    <div className="space-y-2">
                      {Object.entries(
                        savedTemplates.reduce((acc, template) => {
                          if (!acc[template.category]) acc[template.category] = []
                          acc[template.category].push(template)
                          return acc
                        }, {} as Record<string, PromptTemplate[]>)
                      ).map(([category, templates]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
                          {templates.map((template) => (
                            <Card 
                              key={template.id} 
                              className={cn(
                                'cursor-pointer transition-colors hover:bg-muted p-3',
                                selectedTemplate?.id === template.id && 'ring-2 ring-primary'
                              )}
                              onClick={() => selectTemplate(template)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium text-sm">{template.name}</h5>
                                  <p className="text-xs text-muted-foreground">{template.description}</p>
                                  <div className="flex gap-1 mt-1">
                                    {template.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Template Variables */}
                <div className="space-y-4">
                  {selectedTemplate ? (
                    <>
                      <div>
                        <Label>Template Variables</Label>
                        <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable}>
                            <Label htmlFor={variable} className="capitalize">
                              {variable.replace('_', ' ')}
                            </Label>
                            <Input
                              id={variable}
                              placeholder={`Enter ${variable.replace('_', ' ')}`}
                              value={templateVariables[variable] || ''}
                              onChange={(e) => updateVariable(variable, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label>Example</Label>
                        <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          {selectedTemplate.example}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a template to start building your prompt</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Built Prompt */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label>Generated Prompt</Label>
                    <div className="relative">
                      <Textarea
                        value={builtPrompt}
                        onChange={(e) => setBuiltPrompt(e.target.value)}
                        rows={3}
                        className="pr-10"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(builtPrompt)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Prompt Enhancer */}
            <TabsContent value="enhancer" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Base Prompt */}
                <div className="space-y-4">
                  <div>
                    <Label>Base Prompt</Label>
                    <Textarea
                      placeholder="Enter your base prompt here..."
                      value={customPrompt || builtPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={applyEnhancements}
                    disabled={isEnhancing || (!customPrompt && !builtPrompt)}
                    className="w-full"
                  >
                    {isEnhancing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Apply Enhancements
                      </>
                    )}
                  </Button>
                </div>

                {/* Enhancement Categories */}
                <div className="lg:col-span-2">
                  <Label>Enhancement Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {ENHANCEMENT_CATEGORIES.map((category) => (
                      <Card key={category.type}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {category.type === 'style' && <Palette className="h-4 w-4" />}
                            {category.type === 'quality' && <Star className="h-4 w-4" />}
                            {category.type === 'composition' && <Camera className="h-4 w-4" />}
                            {category.type === 'lighting' && <Lightbulb className="h-4 w-4" />}
                            {category.type === 'mood' && <Sparkles className="h-4 w-4" />}
                            {category.type === 'technical' && <Settings className="h-4 w-4" />}
                            {category.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1">
                            {category.options.map((option) => (
                              <Badge
                                key={option}
                                variant={
                                  selectedEnhancements[category.type]?.includes(option)
                                    ? 'default'
                                    : 'outline'
                                }
                                className="cursor-pointer text-xs"
                                onClick={() => toggleEnhancement(category.type, option)}
                              >
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Prompt Analyzer */}
            <TabsContent value="analyzer" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Prompt to Analyze</Label>
                    <Textarea
                      placeholder="Enter your prompt for analysis..."
                      value={customPrompt || builtPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button 
                    onClick={analyzePrompt}
                    disabled={isAnalyzing || (!customPrompt && !builtPrompt)}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Analyze Prompt
                      </>
                    )}
                  </Button>
                </div>

                {/* Analysis Results */}
                <div className="space-y-4">
                  {promptAnalysis ? (
                    <>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-sm">
                            Prompt Score
                            <Badge variant={promptAnalysis.score >= 80 ? 'default' : promptAnalysis.score >= 60 ? 'secondary' : 'destructive'}>
                              {promptAnalysis.score}/100
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-green-600">Strengths</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-1">
                            {promptAnalysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-amber-600">Suggestions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-1">
                            {promptAnalysis.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Improved Version</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="relative">
                            <Textarea
                              value={promptAnalysis.improvedPrompt}
                              readOnly
                              rows={4}
                              className="pr-10"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(promptAnalysis.improvedPrompt)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Analyze your prompt to get detailed feedback and suggestions</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Template Library */}
            <TabsContent value="library" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create New Template */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Create New Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="template-name">Name</Label>
                        <Input
                          id="template-name"
                          placeholder="Template name"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-category">Category</Label>
                        <Input
                          id="template-category"
                          placeholder="e.g., Photography"
                          value={newTemplate.category}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="template-template">Template (use {variable} for variables)</Label>
                      <Textarea
                        id="template-template"
                        placeholder="e.g., {subject} in {style} style, {quality}"
                        value={newTemplate.template}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="template-description">Description</Label>
                      <Input
                        id="template-description"
                        placeholder="Brief description"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="template-example">Example</Label>
                      <Textarea
                        id="template-example"
                        placeholder="Example of the filled template"
                        value={newTemplate.example}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, example: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <Button 
                      onClick={saveCustomTemplate}
                      disabled={!newTemplate.name || !newTemplate.template}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Template
                    </Button>
                  </CardContent>
                </Card>

                {/* Template Library */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Template Library</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {savedTemplates.map((template) => (
                          <Card key={template.id} className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                                <p className="text-xs font-mono bg-muted p-2 rounded">{template.template}</p>
                                <div className="flex gap-1 mt-2">
                                  {template.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => selectTemplate(template)}
                                >
                                  Use
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(template.template)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}