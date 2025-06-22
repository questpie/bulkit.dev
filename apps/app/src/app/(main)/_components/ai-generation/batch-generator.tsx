'use client'

import { useState, useEffect } from 'react'
import { Button } from '@bulkit/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/card'
import { Input } from '@bulkit/ui/input'
import { Label } from '@bulkit/ui/label'
import { Textarea } from '@bulkit/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/select'
import { Badge } from '@bulkit/ui/badge'
import { Progress } from '@bulkit/ui/progress'
import { Separator } from '@bulkit/ui/separator'
import { 
  Layers3, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Trash2,
  Plus,
  Minus,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react'
import { cn } from '@bulkit/ui/utils'

interface BatchSession {
  id: string
  name: string
  description?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  totalJobs: number
  completedJobs: number
  failedJobs: number
  inProgressJobs: number
  pendingJobs: number
  estimatedTimeRemaining: number
  totalCost: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

interface BatchJob {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  resultUrl?: string
  cost: number
  errorMessage?: string
  createdAt: Date
  completedAt?: Date
}

interface BatchGeneratorProps {
  onCreateSession: (config: any) => Promise<BatchSession>
  onCancelSession: (sessionId: string) => Promise<void>
  onRetryFailed: (sessionId: string) => Promise<void>
  onDownloadResults: (sessionId: string) => Promise<void>
  className?: string
}

const BATCH_TEMPLATES = [
  {
    name: 'Product Variations',
    description: 'Generate multiple variations of a product',
    prompts: [
      'Modern minimalist chair, white background, product photography',
      'Modern minimalist chair, black background, studio lighting',
      'Modern minimalist chair, natural setting, lifestyle photography',
      'Modern minimalist chair, close-up detail shot',
    ]
  },
  {
    name: 'Social Media Pack',
    description: 'Create a complete social media content pack',
    prompts: [
      'Instagram post design, modern aesthetic, bright colors',
      'Story template, minimalist design, call to action',
      'LinkedIn banner, professional look, corporate branding',
      'Twitter header, engaging visual, brand colors',
    ]
  },
  {
    name: 'Logo Concepts',
    description: 'Multiple logo design concepts',
    prompts: [
      'Modern tech company logo, minimalist, blue and white',
      'Creative agency logo, colorful, artistic elements',
      'Finance company logo, professional, trustworthy design',
      'Startup logo, innovative, geometric shapes',
    ]
  }
]

export function BatchGenerator({ 
  onCreateSession, 
  onCancelSession, 
  onRetryFailed, 
  onDownloadResults, 
  className 
}: BatchGeneratorProps) {
  const [sessionName, setSessionName] = useState('')
  const [sessionDescription, setSessionDescription] = useState('')
  const [prompts, setPrompts] = useState<string[]>([''])
  const [baseParams, setBaseParams] = useState({
    style: '',
    quality: 'high',
    aspectRatio: '1:1',
    provider: ''
  })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [activeSessions, setActiveSessions] = useState<BatchSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [sessionJobs, setSessionJobs] = useState<BatchJob[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const addPrompt = () => {
    setPrompts([...prompts, ''])
  }

  const removePrompt = (index: number) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter((_, i) => i !== index))
    }
  }

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts]
    newPrompts[index] = value
    setPrompts(newPrompts)
  }

  const applyTemplate = (templateName: string) => {
    const template = BATCH_TEMPLATES.find(t => t.name === templateName)
    if (template) {
      setSessionName(template.name)
      setSessionDescription(template.description)
      setPrompts(template.prompts)
      setSelectedTemplate(templateName)
    }
  }

  const createBatchSession = async () => {
    if (!sessionName.trim() || prompts.filter(p => p.trim()).length === 0) {
      return
    }

    setIsCreating(true)
    try {
      const config = {
        name: sessionName,
        description: sessionDescription,
        prompts: prompts.filter(p => p.trim()),
        baseParams,
        type: 'image',
        priority: 'medium',
        maxConcurrent: 3,
      }

      const session = await onCreateSession(config)
      setActiveSessions(prev => [session, ...prev])
      
      // Reset form
      setSessionName('')
      setSessionDescription('')
      setPrompts([''])
      setSelectedTemplate('')
    } catch (error) {
      console.error('Failed to create batch session:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const cancelSession = async (sessionId: string) => {
    try {
      await onCancelSession(sessionId)
      setActiveSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled' }
            : session
        )
      )
    } catch (error) {
      console.error('Failed to cancel session:', error)
    }
  }

  const retryFailedJobs = async (sessionId: string) => {
    try {
      await onRetryFailed(sessionId)
      // Update session status
      setActiveSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'processing' }
            : session
        )
      )
    } catch (error) {
      console.error('Failed to retry failed jobs:', error)
    }
  }

  const downloadResults = async (sessionId: string) => {
    try {
      await onDownloadResults(sessionId)
    } catch (error) {
      console.error('Failed to download results:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <Square className="h-4 w-4 text-muted-foreground" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-muted'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-muted'
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const validPrompts = prompts.filter(p => p.trim()).length
  const estimatedCost = validPrompts * 0.08 // Rough estimate

  return (
    <div className={cn('w-full max-w-6xl mx-auto space-y-6', className)}>
      {/* Create New Batch Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5" />
            Batch Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Templates */}
          <div>
            <Label>Quick Start Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {BATCH_TEMPLATES.map((template) => (
                <Card 
                  key={template.name}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted',
                    selectedTemplate === template.name && 'ring-2 ring-primary'
                  )}
                  onClick={() => applyTemplate(template.name)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {template.prompts.length} prompts
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Session Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  placeholder="e.g., Product Photography Batch"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="session-description">Description (Optional)</Label>
                <Textarea
                  id="session-description"
                  placeholder="Describe this batch generation session..."
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base-style">Base Style</Label>
                  <Select value={baseParams.style} onValueChange={(value) => setBaseParams(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photorealistic">Photorealistic</SelectItem>
                      <SelectItem value="artistic">Artistic</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="base-quality">Quality</Label>
                  <Select value={baseParams.quality} onValueChange={(value) => setBaseParams(prev => ({ ...prev, quality: value }))}>
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
              </div>
            </div>

            {/* Prompts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Prompts ({validPrompts})</Label>
                <Button size="sm" variant="outline" onClick={addPrompt}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prompts.map((prompt, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      placeholder={`Prompt ${index + 1}...`}
                      value={prompt}
                      onChange={(e) => updatePrompt(index, e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    {prompts.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePrompt(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Est. ${estimatedCost.toFixed(2)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{Math.ceil(validPrompts * 0.5)} min
                  </Badge>
                </div>

                <Button 
                  onClick={createBatchSession}
                  disabled={!sessionName.trim() || validPrompts === 0 || isCreating}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Batch ({validPrompts} prompts)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <Card key={session.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{session.name}</h3>
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className="ml-1 capitalize">{session.status}</span>
                          </Badge>
                        </div>
                        {session.description && (
                          <p className="text-sm text-muted-foreground">{session.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {session.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelSession(session.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {session.status === 'failed' && session.failedJobs > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryFailedJobs(session.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {session.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadResults(session.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveSessions(prev => prev.filter(s => s.id !== session.id))
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress: {session.completedJobs} / {session.totalJobs}</span>
                        <span>{Math.round((session.completedJobs / session.totalJobs) * 100)}%</span>
                      </div>
                      
                      <Progress 
                        value={(session.completedJobs / session.totalJobs) * 100} 
                        className="h-2"
                      />

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{session.completedJobs}</div>
                          <div className="text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{session.inProgressJobs}</div>
                          <div className="text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">{session.pendingJobs}</div>
                          <div className="text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{session.failedJobs}</div>
                          <div className="text-muted-foreground">Failed</div>
                        </div>
                      </div>

                      {session.status === 'processing' && session.estimatedTimeRemaining > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Est. time remaining: {formatTimeRemaining(session.estimatedTimeRemaining)}</span>
                          <span>Total cost: ${session.totalCost.toFixed(2)}</span>
                        </div>
                      )}
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