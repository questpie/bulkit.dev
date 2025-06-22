'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Label } from '@bulkit/ui/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/components/ui/select'
import { Target, Lightbulb, Copy, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'react-icons/lu'

interface AIPromptOptimizerProps {
  conversationId: string
  onComplete: () => void
}

interface PromptAnalysis {
  score: number
  suggestions: string[]
  optimizedPrompt: string
  improvements: {
    clarity: number
    specificity: number
    creativity: number
    effectiveness: number
  }
}

export function AIPromptOptimizer({ conversationId, onComplete }: AIPromptOptimizerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [contentType, setContentType] = useState('image')
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)

  const handleAnalyze = async () => {
    if (!originalPrompt.trim()) return

    setIsAnalyzing(true)
    try {
      // This would call your prompt optimization API
      const response = await fetch('/api/ai/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: originalPrompt,
          contentType,
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setAnalysis(result.data)
      } else {
        // Mock analysis for demo
        setAnalysis({
          score: 75,
          suggestions: [
            'Add more specific visual details (lighting, camera angle, style)',
            'Include negative prompts to avoid unwanted elements',
            'Specify the desired mood or atmosphere',
            'Consider adding technical specifications (resolution, aspect ratio)',
            'Use more descriptive adjectives for better results'
          ],
          optimizedPrompt: `${originalPrompt}, professional photography, high quality, detailed, cinematic lighting, sharp focus, vibrant colors, trending on artstation`,
          improvements: {
            clarity: 85,
            specificity: 80,
            creativity: 70,
            effectiveness: 90
          }
        })
      }
    } catch (error) {
      console.error('Prompt analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopyOptimized = () => {
    if (analysis?.optimizedPrompt) {
      navigator.clipboard.writeText(analysis.optimizedPrompt)
    }
  }

  const handleUseOptimized = () => {
    if (analysis?.optimizedPrompt) {
      setOriginalPrompt(analysis.optimizedPrompt)
      setAnalysis(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="optimize" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="optimize" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Optimize
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Tips & Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image Generation</SelectItem>
                  <SelectItem value="video">Video Generation</SelectItem>
                  <SelectItem value="style_transfer">Style Transfer</SelectItem>
                  <SelectItem value="image_edit">Image Editing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Your Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt to analyze and optimize..."
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              className="min-h-24"
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!originalPrompt.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Prompt...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analyze & Optimize
              </>
            )}
          </Button>

          {analysis && (
            <div className="space-y-4">
              {/* Analysis Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Prompt Analysis
                    <Badge variant={getScoreBadge(analysis.score)}>
                      Score: {analysis.score}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Clarity</span>
                        <span className={getScoreColor(analysis.improvements.clarity)}>
                          {analysis.improvements.clarity}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Specificity</span>
                        <span className={getScoreColor(analysis.improvements.specificity)}>
                          {analysis.improvements.specificity}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Creativity</span>
                        <span className={getScoreColor(analysis.improvements.creativity)}>
                          {analysis.improvements.creativity}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Effectiveness</span>
                        <span className={getScoreColor(analysis.improvements.effectiveness)}>
                          {analysis.improvements.effectiveness}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Improvement Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Optimized Prompt */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Optimized Prompt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{analysis.optimizedPrompt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopyOptimized}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button size="sm" onClick={handleUseOptimized}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Use This Prompt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Best Practices for AI Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Be Specific</p>
                      <p className="text-xs text-muted-foreground">
                        Include details about style, lighting, colors, and composition
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Use Quality Keywords</p>
                      <p className="text-xs text-muted-foreground">
                        Add terms like "high quality", "detailed", "professional photography"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Set the Mood</p>
                      <p className="text-xs text-muted-foreground">
                        Describe the atmosphere: "serene", "dramatic", "playful", "mysterious"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Use Negative Prompts</p>
                      <p className="text-xs text-muted-foreground">
                        Specify what you don't want to avoid unwanted elements
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Example Optimizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Before:</p>
                    <p className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                      "A cat sitting"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-1">After:</p>
                    <p className="text-sm p-2 bg-green-50 border border-green-200 rounded">
                      "A fluffy orange tabby cat sitting on a windowsill, golden hour lighting, professional pet photography, high detail, shallow depth of field"
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Before:</p>
                    <p className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                      "Mountain landscape"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-1">After:</p>
                    <p className="text-sm p-2 bg-green-50 border border-green-200 rounded">
                      "Majestic snow-capped mountain range at sunrise, dramatic clouds, reflection in alpine lake, cinematic landscape photography, ultra-high resolution"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onComplete}>
          Close
        </Button>
      </div>
    </div>
  )
}