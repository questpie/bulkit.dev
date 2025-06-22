'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/components/ui/select'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Slider } from '@bulkit/ui/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { Camera, Sparkles, Loader2, Download, Copy } from 'react-icons/lu'

interface AIImageGeneratorProps {
  conversationId: string
  onComplete: () => void
}

export function AIImageGenerator({ conversationId, onComplete }: AIImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    prompt: '',
    negativePrompt: '',
    aspectRatio: '1:1',
    quality: 'high',
    style: '',
    guidance: [7.5],
    steps: [30],
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // This would call your AI generation API
      const response = await fetch('/api/ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.prompt,
          negativePrompt: formData.negativePrompt,
          aspectRatio: formData.aspectRatio,
          quality: formData.quality,
          style: formData.style,
          guidance: formData.guidance[0],
          steps: formData.steps[0],
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setGeneratedImage(result.data.image.url)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEstimateCost = async () => {
    try {
      const response = await fetch('/api/ai/image/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          prompt: formData.prompt,
          params: {
            quality: formData.quality,
            aspectRatio: formData.aspectRatio,
          },
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setEstimatedCost(result.data.estimate.estimate)
      }
    } catch (error) {
      console.error('Cost estimation failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Image Description *</Label>
            <Textarea
              id="prompt"
              placeholder="A beautiful sunset over a mountain lake with reflections..."
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              className="min-h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select value={formData.aspectRatio} onValueChange={(value) => setFormData(prev => ({ ...prev, aspectRatio: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="4:3">Standard (4:3)</SelectItem>
                  <SelectItem value="3:4">Tall (3:4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={formData.quality} onValueChange={(value) => setFormData(prev => ({ ...prev, quality: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="ultra">Ultra Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Style (Optional)</Label>
            <Input
              id="style"
              placeholder="photographic, artistic, cartoon, anime..."
              value={formData.style}
              onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="negativePrompt">Negative Prompt</Label>
            <Textarea
              id="negativePrompt"
              placeholder="What to avoid in the image..."
              value={formData.negativePrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, negativePrompt: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Guidance Scale: {formData.guidance[0]}</Label>
            <Slider
              value={formData.guidance}
              onValueChange={(value) => setFormData(prev => ({ ...prev, guidance: value }))}
              max={20}
              min={1}
              step={0.5}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Higher values follow the prompt more closely
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inference Steps: {formData.steps[0]}</Label>
            <Slider
              value={formData.steps}
              onValueChange={(value) => setFormData(prev => ({ ...prev, steps: value }))}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              More steps = higher quality, longer generation time
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Cost Estimation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cost Estimation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleEstimateCost}>
              Estimate Cost
            </Button>
            {estimatedCost && (
              <Badge variant="secondary">
                ~${estimatedCost.toFixed(4)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Image Display */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <img 
                src={generatedImage} 
                alt="Generated image" 
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={handleGenerate} 
          disabled={!formData.prompt || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onComplete}>
          Close
        </Button>
      </div>
    </div>
  )
}