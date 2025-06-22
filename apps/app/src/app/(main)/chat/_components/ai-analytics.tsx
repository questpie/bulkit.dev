'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bulkit/ui/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Button } from '@bulkit/ui/components/ui/button'
import { Progress } from '@bulkit/ui/components/ui/progress'
import {
  LuBarChart3,
  LuTrendingUp,
  LuDollarSign,
  LuClock,
  LuImage,
  LuVideo,
  LuZap,
  LuDownload,
} from 'react-icons/lu'

interface AIAnalyticsProps {
  conversationId: string
  onComplete: () => void
}

interface UsageStats {
  totalGenerations: number
  totalCost: number
  avgCostPerGeneration: number
  topProvider: string
  generationsByType: {
    images: number
    videos: number
    edits: number
  }
  costByProvider: {
    [key: string]: number
  }
  recentActivity: Array<{
    id: string
    type: string
    provider: string
    cost: number
    timestamp: string
    prompt: string
  }>
}

export function AIAnalytics({ conversationId, onComplete }: AIAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d')
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      // This would call your analytics API
      const response = await fetch(`/api/ai/analytics?timeRange=${timeRange}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        // Mock data for demo
        setStats({
          totalGenerations: 156,
          totalCost: 23.45,
          avgCostPerGeneration: 0.15,
          topProvider: 'Google Imagen',
          generationsByType: {
            images: 120,
            videos: 25,
            edits: 11,
          },
          costByProvider: {
            'Google Imagen': 12.3,
            'OpenAI GPT-Image-1': 8.95,
            'Google Veo': 2.2,
          },
          recentActivity: [
            {
              id: '1',
              type: 'image',
              provider: 'Google Imagen',
              cost: 0.12,
              timestamp: '2024-01-15T10:30:00Z',
              prompt: 'A serene mountain landscape with a lake',
            },
            {
              id: '2',
              type: 'video',
              provider: 'Google Veo',
              cost: 0.45,
              timestamp: '2024-01-15T09:15:00Z',
              prompt: 'Sunrise over a city skyline',
            },
            {
              id: '3',
              type: 'edit',
              provider: 'OpenAI GPT-Image-1',
              cost: 0.08,
              timestamp: '2024-01-15T08:45:00Z',
              prompt: 'Remove background from product photo',
            },
          ],
        })
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !stats) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <BarChart3 className='w-8 h-8 mx-auto mb-2 animate-pulse' />
          <div className='text-sm text-muted-foreground'>Loading analytics...</div>
        </div>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image
      case 'video':
        return Video
      case 'edit':
        return Zap
      default:
        return BarChart3
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium'>AI Usage Analytics</h3>
          <p className='text-sm text-muted-foreground'>
            Track your AI generation costs and usage patterns
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className='w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1d'>Last 24h</SelectItem>
            <SelectItem value='7d'>Last 7 days</SelectItem>
            <SelectItem value='30d'>Last 30 days</SelectItem>
            <SelectItem value='90d'>Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='providers'>Providers</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          {/* Key Metrics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center'>
                  <BarChart3 className='h-4 w-4 text-muted-foreground' />
                  <div className='ml-2'>
                    <p className='text-xs font-medium text-muted-foreground'>Total Generations</p>
                    <p className='text-2xl font-bold'>{stats.totalGenerations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center'>
                  <DollarSign className='h-4 w-4 text-muted-foreground' />
                  <div className='ml-2'>
                    <p className='text-xs font-medium text-muted-foreground'>Total Cost</p>
                    <p className='text-2xl font-bold'>{formatCurrency(stats.totalCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center'>
                  <TrendingUp className='h-4 w-4 text-muted-foreground' />
                  <div className='ml-2'>
                    <p className='text-xs font-medium text-muted-foreground'>Avg Cost/Gen</p>
                    <p className='text-2xl font-bold'>
                      {formatCurrency(stats.avgCostPerGeneration)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center'>
                  <Zap className='h-4 w-4 text-muted-foreground' />
                  <div className='ml-2'>
                    <p className='text-xs font-medium text-muted-foreground'>Top Provider</p>
                    <p className='text-sm font-bold'>{stats.topProvider}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generation Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Generation Types</CardTitle>
              <CardDescription>Breakdown by content type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Image className='w-4 h-4' />
                    <span className='text-sm'>Images</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Progress
                      value={(stats.generationsByType.images / stats.totalGenerations) * 100}
                      className='w-20'
                    />
                    <span className='text-sm font-medium w-8'>
                      {stats.generationsByType.images}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Video className='w-4 h-4' />
                    <span className='text-sm'>Videos</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Progress
                      value={(stats.generationsByType.videos / stats.totalGenerations) * 100}
                      className='w-20'
                    />
                    <span className='text-sm font-medium w-8'>
                      {stats.generationsByType.videos}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Zap className='w-4 h-4' />
                    <span className='text-sm'>Edits</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Progress
                      value={(stats.generationsByType.edits / stats.totalGenerations) * 100}
                      className='w-20'
                    />
                    <span className='text-sm font-medium w-8'>{stats.generationsByType.edits}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='providers' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Cost by Provider</CardTitle>
              <CardDescription>How much you've spent on each AI provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {Object.entries(stats.costByProvider)
                  .sort(([, a], [, b]) => b - a)
                  .map(([provider, cost]) => (
                    <div key={provider} className='flex items-center justify-between'>
                      <span className='text-sm'>{provider}</span>
                      <div className='flex items-center gap-3'>
                        <Progress value={(cost / stats.totalCost) * 100} className='w-24' />
                        <span className='text-sm font-medium w-16 text-right'>
                          {formatCurrency(cost)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Provider Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center gap-2 mb-1'>
                    <TrendingUp className='w-4 h-4 text-green-600' />
                    <span className='text-sm font-medium text-green-800'>Most Cost-Effective</span>
                  </div>
                  <p className='text-xs text-green-700'>
                    Google Imagen provides the best value for high-quality image generation
                  </p>
                </div>

                <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Video className='w-4 h-4 text-blue-600' />
                    <span className='text-sm font-medium text-blue-800'>Video Generation</span>
                  </div>
                  <p className='text-xs text-blue-700'>
                    Google Veo is currently your only video provider - consider usage optimization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='activity' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Recent Activity</CardTitle>
              <CardDescription>Your latest AI generations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {stats.recentActivity.map((activity) => {
                  const Icon = getTypeIcon(activity.type)
                  return (
                    <div
                      key={activity.id}
                      className='flex items-center gap-3 p-3 border rounded-lg'
                    >
                      <Icon className='w-5 h-5 text-muted-foreground' />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Badge variant='outline' className='text-xs'>
                            {activity.type}
                          </Badge>
                          <span className='text-xs text-muted-foreground'>{activity.provider}</span>
                        </div>
                        <p className='text-sm truncate'>{activity.prompt}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-medium'>{formatCurrency(activity.cost)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className='flex gap-3'>
        <Button variant='outline' className='flex-1'>
          <Download className='w-4 h-4 mr-2' />
          Export Report
        </Button>
        <Button variant='outline' onClick={onComplete}>
          Close
        </Button>
      </div>
    </div>
  )
}
