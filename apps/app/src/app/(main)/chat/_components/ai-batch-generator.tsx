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
import { Progress } from '@bulkit/ui/components/ui/progress'
import { Zap, Image, Video, Plus, Trash2, Loader2, Play, Pause, Download } from 'react-icons/lu'

interface AIBatchGeneratorProps {
  conversationId: string
  onComplete: () => void
}

interface BatchJob {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  error?: string
}

export function AIBatchGenerator({ conversationId, onComplete }: AIBatchGeneratorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchSession, setBatchSession] = useState<any>(null)
  const [jobs, setJobs] = useState<BatchJob[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'image',
    prompts: [''],
    priority: 'medium',
    maxConcurrent: [3],
    baseParams: {
      quality: 'high',
      aspectRatio: '1:1',
    },
  })

  const addPrompt = () => {
    setFormData(prev => ({
      ...prev,
      prompts: [...prev.prompts, '']
    }))
  }

  const removePrompt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prompts: prev.prompts.filter((_, i) => i !== index)
    }))
  }

  const updatePrompt = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      prompts: prev.prompts.map((prompt, i) => i === index ? value : prompt)
    }))
  }

  const handleStartBatch = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/ai/image/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          prompts: formData.prompts.filter(p => p.trim()),
          baseParams: formData.baseParams,
          priority: formData.priority,
          maxConcurrent: formData.maxConcurrent[0],
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setBatchSession(result.data.batchSession)
        // Initialize jobs from prompts
        setJobs(formData.prompts.filter(p => p.trim()).map((prompt, i) => ({
          id: `job-${i}`,
          prompt,
          status: 'pending' as const,
        })))
        
        // Start polling for progress
        pollProgress(result.data.batchSession.id)
      }
    } catch (error) {
      console.error('Batch generation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const pollProgress = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/ai/image/batch/${sessionId}`)
        const result = await response.json()
        
        if (result.success) {
          setBatchSession(result.data)
          // Update job statuses based on batch progress
          // This would be implemented based on your batch service response structure
        }
      } catch (error) {
        console.error('Failed to poll progress:', error)
      }
    }

    // Poll every 2 seconds
    const interval = setInterval(poll, 2000)
    
    // Stop polling when done (you'd implement this based on batch status)
    setTimeout(() => clearInterval(interval), 60000) // Stop after 1 minute for demo
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500'
      case 'processing': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const completedJobs = jobs.filter(job => job.status === 'completed').length
  const totalJobs = jobs.length
  const progress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0

  return (
    <div className="space-y-6">
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2" disabled={!batchSession}>
            <Play className="w-4 h-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!batchSession}>
            <Download className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Batch Name *</Label>
              <Input
                id="name"
                placeholder="Social media pack #1"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Images
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Videos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Prompts ({formData.prompts.filter(p => p.trim()).length})</Label>
              <Button size="sm" variant="outline" onClick={addPrompt}>
                <Plus className="w-4 h-4 mr-2" />
                Add Prompt
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.prompts.map((prompt, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder={`${formData.type === 'image' ? 'Image' : 'Video'} prompt ${index + 1}...`}
                      value={prompt}
                      onChange={(e) => updatePrompt(index, e.target.value)}
                      className="min-h-12"
                    />
                  </div>
                  {formData.prompts.length > 1 && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removePrompt(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Concurrent: {formData.maxConcurrent[0]}</Label>
              <Slider
                value={formData.maxConcurrent}
                onValueChange={(value) => setFormData(prev => ({ ...prev, maxConcurrent: value }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {formData.type === 'image' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Base Parameters</CardTitle>
                <CardDescription>Applied to all generated images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select 
                      value={formData.baseParams.quality} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        baseParams: { ...prev.baseParams, quality: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="ultra">Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select 
                      value={formData.baseParams.aspectRatio} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        baseParams: { ...prev.baseParams, aspectRatio: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                        <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {batchSession && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Batch Progress
                    <Badge variant={batchSession.status === 'completed' ? 'default' : 'secondary'}>
                      {batchSession.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Progress value={progress} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{completedJobs} of {totalJobs} completed</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Individual Jobs</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobs.map((job, index) => (
                    <Card key={job.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Job {index + 1}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {job.prompt}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {job.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {jobs.filter(job => job.status === 'completed' && job.result).map((job, index) => (
              <Card key={job.id}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {formData.type === 'image' ? (
                      <img 
                        src={job.result} 
                        alt={`Generated ${index + 1}`}
                        className="w-full rounded-lg border"
                      />
                    ) : (
                      <video 
                        src={job.result} 
                        controls 
                        className="w-full rounded-lg border"
                      />
                    )}
                    <div className="text-xs text-muted-foreground truncate">
                      {job.prompt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!batchSession ? (
          <Button 
            onClick={handleStartBatch} 
            disabled={!formData.name || formData.prompts.filter(p => p.trim()).length === 0 || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Batch...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Batch Generation
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" className="flex-1" disabled>
            <Pause className="w-4 h-4 mr-2" />
            Batch Running
          </Button>
        )}
        <Button variant="outline" onClick={onComplete}>
          Close
        </Button>
      </div>
    </div>
  )
}