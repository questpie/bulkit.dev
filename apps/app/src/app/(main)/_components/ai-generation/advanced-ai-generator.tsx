'use client'

import { useState, useEffect } from 'react'
import { Button } from '@bulkit/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/card'
import { Input } from '@bulkit/ui/input'
import { Label } from '@bulkit/ui/label'
import { Textarea } from '@bulkit/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/select'
import { Slider } from '@bulkit/ui/slider'
import { Badge } from '@bulkit/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/tabs'
import { Switch } from '@bulkit/ui/switch'
import { Separator } from '@bulkit/ui/separator'
import { Progress } from '@bulkit/ui/progress'
import { 
  Sparkles, 
  ImageIcon, 
  VideoIcon, 
  Wand2, 
  Settings, 
  Palette, 
  Zap,
  Clock,
  DollarSign,
  Download,
  Trash2,
  RefreshCw,
  Copy,
  Heart,
  Share2
} from 'lucide-react'
import { cn } from '@bulkit/ui/utils'

interface GenerationJob {
  id: string
  type: 'image' | 'video'
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  resultUrl?: string
  cost: number
  provider: string
  model: string
  parameters: Record<string, any>
  createdAt: Date
  completedAt?: Date
}

interface ProviderConfig {
  id: string
  name: string
  models: Array<{
    id: string
    name: string
    capabilities: string[]
    pricing: number
  }>
  capabilities: string[]
  maxResolution: { width: number; height: number }
  supportedStyles: string[]
}

interface AdvancedAIGeneratorProps {
  providers: ProviderConfig[]
  onGenerate: (params: any) => Promise<any>
  onSaveToLibrary: (result: any) => Promise<void>
  className?: string
}

const ASPECT_RATIOS = [
  { label: 'Square', value: '1:1', width: 1024, height: 1024 },
  { label: 'Landscape', value: '16:9', width: 1792, height: 1024 },
  { label: 'Portrait', value: '9:16', width: 1024, height: 1792 },
  { label: 'Photo', value: '4:3', width: 1536, height: 1152 },
  { label: 'Portrait Photo', value: '3:4', width: 1152, height: 1536 },
]

const QUALITY_LEVELS = [
  { label: 'Standard', value: 'standard', multiplier: 1.0, description: 'Good quality, fast generation' },
  { label: 'High', value: 'high', multiplier: 1.5, description: 'Better quality, moderate speed' },
  { label: 'Ultra', value: 'ultra', multiplier: 2.0, description: 'Best quality, slower generation' },
]

const STYLE_PRESETS = [
  'Photorealistic', 'Artistic', 'Digital Art', 'Illustration', 'Cartoon', 'Anime',
  'Oil Painting', 'Watercolor', 'Pencil Sketch', 'Cinematic', 'Portrait', 'Landscape',
  'Abstract', 'Minimalist', 'Vintage', 'Modern', 'Fantasy', 'Sci-Fi'
]

export function AdvancedAIGenerator({ 
  providers, 
  onGenerate, 
  onSaveToLibrary, 
  className 
}: AdvancedAIGeneratorProps) {
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [quality, setQuality] = useState('high')
  const [guidance, setGuidance] = useState([7])
  const [steps, setSteps] = useState([20])
  const [seed, setSeed] = useState('')
  const [batchCount, setBatchCount] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(0)

  // Auto-select first provider and model
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      const defaultProvider = providers.find(p => p.name.includes('gpt-image-1')) || providers[0]
      setSelectedProvider(defaultProvider.id)
      if (defaultProvider.models.length > 0) {
        setSelectedModel(defaultProvider.models[0].id)
      }
    }
  }, [providers, selectedProvider])

  // Calculate estimated cost
  useEffect(() => {
    if (selectedProvider && selectedModel) {
      const provider = providers.find(p => p.id === selectedProvider)
      const model = provider?.models.find(m => m.id === selectedModel)
      if (model) {
        const qualityMultiplier = QUALITY_LEVELS.find(q => q.value === quality)?.multiplier || 1
        const baseCost = model.pricing * qualityMultiplier * batchCount
        setEstimatedCost(baseCost)
      }
    }
  }, [selectedProvider, selectedModel, quality, batchCount, providers])

  const currentProvider = providers.find(p => p.id === selectedProvider)
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel)
  const selectedAspectRatio = ASPECT_RATIOS.find(ar => ar.value === aspectRatio)

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedProvider || !selectedModel) return

    setIsGenerating(true)
    
    try {
      const params = {
        type: generationType,
        prompt,
        negativePrompt: negativePrompt || undefined,
        style: selectedStyle || undefined,
        width: selectedAspectRatio?.width,
        height: selectedAspectRatio?.height,
        quality,
        guidance: guidance[0],
        steps: steps[0],
        seed: seed || undefined,
        providerId: selectedProvider,
        model: selectedModel,
        count: batchCount,
      }

      // Create job entries
      const newJobs: GenerationJob[] = Array.from({ length: batchCount }, (_, i) => ({
        id: `job-${Date.now()}-${i}`,
        type: generationType,
        prompt,
        status: 'pending',
        progress: 0,
        cost: estimatedCost / batchCount,
        provider: currentProvider?.name || '',
        model: currentModel?.name || '',
        parameters: params,
        createdAt: new Date(),
      }))

      setGenerationJobs(prev => [...newJobs, ...prev])

      // Start generation
      for (const job of newJobs) {
        updateJobStatus(job.id, 'processing', 10)
        
        try {
          const result = await onGenerate({ ...params, count: 1 })
          updateJobStatus(job.id, 'completed', 100, result.url)
        } catch (error) {
          updateJobStatus(job.id, 'failed', 0)
        }
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const updateJobStatus = (jobId: string, status: GenerationJob['status'], progress: number, resultUrl?: string) => {
    setGenerationJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status, 
            progress, 
            resultUrl,
            completedAt: status === 'completed' ? new Date() : job.completedAt
          }
        : job
    ))
  }

  const handleSaveResult = async (job: GenerationJob) => {
    if (job.resultUrl) {
      await onSaveToLibrary({
        url: job.resultUrl,
        prompt: job.prompt,
        type: job.type,
        provider: job.provider,
        model: job.model,
      })
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
  }

  const handleRetryJob = async (job: GenerationJob) => {
    updateJobStatus(job.id, 'processing', 10)
    try {
      const result = await onGenerate(job.parameters)
      updateJobStatus(job.id, 'completed', 100, result.url)
    } catch (error) {
      updateJobStatus(job.id, 'failed', 0)
    }
  }

  const removeJob = (jobId: string) => {
    setGenerationJobs(prev => prev.filter(job => job.id !== jobId))
  }

  return (
    <div className={cn('w-full max-w-6xl mx-auto space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Advanced AI Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={generationType} onValueChange={(value) => setGenerationType(value as 'image' | 'video')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image Generation
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4" />
                Video Generation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Main Controls */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe what you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                    <Textarea
                      id="negative-prompt"
                      placeholder="What to avoid in the generation..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="provider">AI Provider</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentProvider?.models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Right Column - Parameters */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map((ratio) => (
                            <SelectItem key={ratio.value} value={ratio.value}>
                              {ratio.label} ({ratio.value})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quality">Quality</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALITY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="style">Style Preset</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_PRESETS.map((style) => (
                          <SelectItem key={style} value={style.toLowerCase()}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="advanced">Advanced Settings</Label>
                    <Switch
                      id="advanced"
                      checked={showAdvanced}
                      onCheckedChange={setShowAdvanced}
                    />
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div>
                        <Label>Guidance Scale: {guidance[0]}</Label>
                        <Slider
                          value={guidance}
                          onValueChange={setGuidance}
                          max={30}
                          min={1}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Steps: {steps[0]}</Label>
                        <Slider
                          value={steps}
                          onValueChange={setSteps}
                          max={100}
                          min={10}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="seed">Seed (Optional)</Label>
                        <Input
                          id="seed"
                          placeholder="Random seed for reproducible results"
                          value={seed}
                          onChange={(e) => setSeed(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="batch-count">Batch Count: {batchCount}</Label>
                        <Slider
                          value={[batchCount]}
                          onValueChange={([value]) => setBatchCount(value)}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Est. Cost: ${estimatedCost.toFixed(3)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{Math.ceil(batchCount * 30 / 60)} min
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate {batchCount > 1 ? `${batchCount} Images` : 'Image'}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <VideoIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Video Generation</h3>
                <p className="text-muted-foreground">
                  Video generation interface will be implemented here with Google Veo integration
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generation Results */}
      {generationJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Generation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generationJobs.map((job) => (
                <Card key={job.id} className="relative">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                      {job.status === 'completed' && job.resultUrl ? (
                        <img 
                          src={job.resultUrl} 
                          alt="Generated" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {job.status === 'processing' ? (
                            <div className="text-center">
                              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                              <Progress value={job.progress} className="w-20" />
                            </div>
                          ) : job.status === 'failed' ? (
                            <div className="text-center text-destructive">
                              <p className="text-sm">Failed</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Pending</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium truncate">{job.prompt}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{job.provider}</span>
                        <span>${job.cost.toFixed(3)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyPrompt(job.prompt)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRetryJob(job)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {job.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveResult(job)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeJob(job.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}