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
import { Switch } from '@bulkit/ui/components/ui/switch'
import { Video, Image, Loader2, Download, Copy, Upload } from 'react-icons/lu'

interface AIVideoGeneratorProps {
  conversationId: string
  onComplete: () => void
}

export function AIVideoGenerator({ conversationId, onComplete }: AIVideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [isImageToVideo, setIsImageToVideo] = useState(false)
  
  const [formData, setFormData] = useState({
    prompt: '',
    imageUrl: '',
    duration: [5],
    resolution: '1080p',
    aspectRatio: '16:9',
    motionLevel: 'medium',
    style: '',
    fps: [24],
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.prompt,
          imageUrl: isImageToVideo ? formData.imageUrl : undefined,
          duration: formData.duration[0],
          resolution: formData.resolution,
          aspectRatio: formData.aspectRatio,
          motionLevel: formData.motionLevel,
          style: formData.style,
          fps: formData.fps[0],
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setGeneratedVideo(result.data.video.url)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEstimateCost = async () => {
    try {
      const response = await fetch('/api/ai/video/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          prompt: formData.prompt,
          params: {
            duration: formData.duration[0],
            resolution: formData.resolution,
            motionLevel: formData.motionLevel,
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
            <Video className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Video Type Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Generation Type</Label>
                  <div className="text-sm text-muted-foreground">
                    {isImageToVideo ? 'Animate an existing image' : 'Generate video from text'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Text-to-Video</span>
                  <Switch 
                    checked={isImageToVideo}
                    onCheckedChange={setIsImageToVideo}
                  />
                  <span className="text-sm">Image-to-Video</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="prompt">Video Description *</Label>
            <Textarea
              id="prompt"
              placeholder={isImageToVideo ? 
                "Describe how the image should be animated..." : 
                "A serene forest scene with gentle wind moving through trees..."
              }
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              className="min-h-20"
            />
          </div>

          {isImageToVideo && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Source Image URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration: {formData.duration[0]}s</Label>
              <Slider
                value={formData.duration}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                max={60}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={formData.resolution} onValueChange={(value) => setFormData(prev => ({ ...prev, resolution: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="4k">4K Ultra HD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select value={formData.aspectRatio} onValueChange={(value) => setFormData(prev => ({ ...prev, aspectRatio: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="4:3">Standard (4:3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motionLevel">Motion Level</Label>
              <Select value={formData.motionLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, motionLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Motion</SelectItem>
                  <SelectItem value="medium">Medium Motion</SelectItem>
                  <SelectItem value="high">High Motion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Input
              id="style"
              placeholder="cinematic, documentary, artistic, animated..."
              value={formData.style}
              onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Frame Rate: {formData.fps[0]} FPS</Label>
            <Slider
              value={formData.fps}
              onValueChange={(value) => setFormData(prev => ({ ...prev, fps: value }))}
              max={60}
              min={12}
              step={6}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Higher frame rates create smoother motion
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Cost Estimation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cost Estimation</CardTitle>
          <CardDescription>
            Video generation costs vary by duration and quality
          </CardDescription>
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

      {/* Generated Video Display */}
      {generatedVideo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generated Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <video 
                src={generatedVideo} 
                controls 
                className="w-full rounded-lg border"
                style={{ maxHeight: '400px' }}
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
          disabled={!formData.prompt || (isImageToVideo && !formData.imageUrl) || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Generate Video
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