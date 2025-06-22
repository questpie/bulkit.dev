'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/card'
import { Button } from '@bulkit/ui/button'
import { Badge } from '@bulkit/ui/badge'
import { Progress } from '@bulkit/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@bulkit/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Clock, 
  Image, 
  Video, 
  Download,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Users,
  Globe
} from 'lucide-react'
import { cn } from '@bulkit/ui/utils'

interface UsageMetrics {
  totalGenerations: number
  totalCost: number
  totalCreditsUsed: number
  averageCostPerGeneration: number
  mostUsedProvider: string
  mostUsedCapability: string
  generationsByType: {
    image: number
    video: number
  }
  generationsByProvider: Record<string, number>
  generationsByCapability: Record<string, number>
  costByProvider: Record<string, number>
  costByCapability: Record<string, number>
  dailyStats: Array<{
    date: string
    generations: number
    cost: number
  }>
  monthlyStats: Array<{
    month: string
    generations: number
    cost: number
  }>
}

interface CostForecast {
  currentUsage: number
  projectedMonthly: number
  budgetLimit?: number
  recommendations: string[]
  savingsOpportunities: Array<{
    description: string
    potentialSavings: number
  }>
}

interface PerformanceMetrics {
  averageGenerationTime: number
  successRate: number
  failureReasons: Record<string, number>
  qualityScores: {
    average: number
    byProvider: Record<string, number>
  }
  userSatisfaction: number
}

interface UsageAnalyticsProps {
  organizationId: string
  timeframe: '7d' | '30d' | '90d' | '1y'
  onTimeframeChange: (timeframe: '7d' | '30d' | '90d' | '1y') => void
  className?: string
}

export function UsageAnalytics({ 
  organizationId, 
  timeframe, 
  onTimeframeChange, 
  className 
}: UsageAnalyticsProps) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null)
  const [forecast, setForecast] = useState<CostForecast | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock metrics data
      const mockMetrics: UsageMetrics = {
        totalGenerations: 1247,
        totalCost: 89.42,
        totalCreditsUsed: 894,
        averageCostPerGeneration: 0.072,
        mostUsedProvider: 'OpenAI GPT-Image-1',
        mostUsedCapability: 'text-to-image',
        generationsByType: {
          image: 1156,
          video: 91
        },
        generationsByProvider: {
          'OpenAI GPT-Image-1': 523,
          'Google Imagen': 398,
          'OpenAI DALL-E': 234,
          'Replicate': 92
        },
        generationsByCapability: {
          'text-to-image': 687,
          'image-edit': 234,
          'image-variation': 156,
          'text-to-video': 91,
          'style-transfer': 79
        },
        costByProvider: {
          'OpenAI GPT-Image-1': 41.84,
          'Google Imagen': 23.76,
          'OpenAI DALL-E': 15.68,
          'Replicate': 8.14
        },
        costByCapability: {
          'text-to-image': 38.42,
          'image-edit': 21.34,
          'text-to-video': 18.20,
          'image-variation': 7.80,
          'style-transfer': 3.66
        },
        dailyStats: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          generations: Math.floor(Math.random() * 50) + 10,
          cost: (Math.random() * 5) + 1
        })).reverse(),
        monthlyStats: [
          { month: 'Jan', generations: 856, cost: 67.23 },
          { month: 'Feb', generations: 1123, cost: 78.45 },
          { month: 'Mar', generations: 1247, cost: 89.42 }
        ]
      }

      const mockForecast: CostForecast = {
        currentUsage: 89.42,
        projectedMonthly: 267.18,
        budgetLimit: 500,
        recommendations: [
          'Consider using Google Imagen for basic text-to-image tasks (30% cost reduction)',
          'Batch similar generations to reduce per-unit costs',
          'Use lower quality settings for draft iterations'
        ],
        savingsOpportunities: [
          { description: 'Switch 40% of basic generations to Google Imagen', potentialSavings: 12.50 },
          { description: 'Implement batch processing for repeated tasks', potentialSavings: 8.90 },
          { description: 'Use progressive quality (draft → final)', potentialSavings: 15.20 }
        ]
      }

      const mockPerformance: PerformanceMetrics = {
        averageGenerationTime: 24.5,
        successRate: 94.2,
        failureReasons: {
          'Rate limit exceeded': 28,
          'Invalid parameters': 15,
          'Provider timeout': 12,
          'Insufficient credits': 8,
          'Content policy violation': 5
        },
        qualityScores: {
          average: 4.3,
          byProvider: {
            'OpenAI GPT-Image-1': 4.6,
            'Google Imagen': 4.4,
            'OpenAI DALL-E': 4.1,
            'Replicate': 3.8
          }
        },
        userSatisfaction: 4.2
      }

      setMetrics(mockMetrics)
      setForecast(mockForecast)
      setPerformance(mockPerformance)
      setIsLoading(false)
    }

    loadAnalytics()
  }, [organizationId, timeframe])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (isLoading || !metrics || !forecast || !performance) {
    return (
      <div className={cn('w-full max-w-6xl mx-auto space-y-6', className)}>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-6xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage Analytics</h2>
          <p className="text-muted-foreground">Track your AI generation usage and costs</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Generations</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalGenerations)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +23% from last period
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Avg {formatCurrency(metrics.averageCostPerGeneration)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{performance.successRate}%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  High reliability
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Generation Time</p>
                <p className="text-2xl font-bold">{performance.averageGenerationTime}s</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Fast performance
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generation Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generation Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          <span className="text-sm">Images</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatNumber(metrics.generationsByType.image)}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((metrics.generationsByType.image / metrics.totalGenerations) * 100)}%
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={(metrics.generationsByType.image / metrics.totalGenerations) * 100} 
                        className="h-2"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <span className="text-sm">Videos</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatNumber(metrics.generationsByType.video)}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((metrics.generationsByType.video / metrics.totalGenerations) * 100)}%
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={(metrics.generationsByType.video / metrics.totalGenerations) * 100} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Top Providers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Usage by Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics.generationsByProvider)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 4)
                        .map(([provider, count]) => (
                        <div key={provider} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {provider}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatNumber(count)}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((count / metrics.totalGenerations) * 100)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Capabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Popular Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics.generationsByCapability)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([capability, count]) => (
                        <div key={capability} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{capability.replace('-', ' ')}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatNumber(count)}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((count / metrics.totalGenerations) * 100)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quality Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Average</span>
                        <Badge variant="default">{performance.qualityScores.average}/5</Badge>
                      </div>
                      
                      {Object.entries(performance.qualityScores.byProvider).map(([provider, score]) => (
                        <div key={provider} className="flex items-center justify-between">
                          <span className="text-sm">{provider}</span>
                          <Badge variant="outline">{score}/5</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cost Analysis Tab */}
            <TabsContent value="costs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost by Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(metrics.costByProvider)
                        .sort(([,a], [,b]) => b - a)
                        .map(([provider, cost]) => (
                        <div key={provider}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">{provider}</span>
                            <span className="text-sm font-medium">{formatCurrency(cost)}</span>
                          </div>
                          <Progress 
                            value={(cost / metrics.totalCost) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round((cost / metrics.totalCost) * 100)}% of total cost
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost by Capability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(metrics.costByCapability)
                        .sort(([,a], [,b]) => b - a)
                        .map(([capability, cost]) => (
                        <div key={capability}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm capitalize">{capability.replace('-', ' ')}</span>
                            <span className="text-sm font-medium">{formatCurrency(cost)}</span>
                          </div>
                          <Progress 
                            value={(cost / metrics.totalCost) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round((cost / metrics.totalCost) * 100)}% of total cost
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Success Rate Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{performance.successRate}%</p>
                        <p className="text-sm text-muted-foreground">Overall Success Rate</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Common Failure Reasons:</p>
                        {Object.entries(performance.failureReasons)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([reason, count]) => (
                          <div key={reason} className="flex items-center justify-between">
                            <span className="text-sm">{reason}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Average Generation Time</span>
                          <span className="text-sm font-medium">{performance.averageGenerationTime}s</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">25% faster than industry average</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">User Satisfaction</span>
                          <span className="text-sm font-medium">{performance.userSatisfaction}/5</span>
                        </div>
                        <Progress value={(performance.userSatisfaction / 5) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">Based on user ratings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Forecast Tab */}
            <TabsContent value="forecast" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Current Month Usage</span>
                          <span className="text-sm font-medium">{formatCurrency(forecast.currentUsage)}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Projected Monthly</span>
                          <span className="text-sm font-medium">{formatCurrency(forecast.projectedMonthly)}</span>
                        </div>
                        {forecast.budgetLimit && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Budget Limit</span>
                              <span className="text-sm font-medium">{formatCurrency(forecast.budgetLimit)}</span>
                            </div>
                            <Progress 
                              value={(forecast.projectedMonthly / forecast.budgetLimit) * 100} 
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round((forecast.projectedMonthly / forecast.budgetLimit) * 100)}% of budget
                            </p>
                          </>
                        )}
                      </div>

                      {forecast.projectedMonthly > (forecast.budgetLimit || Infinity) && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-700">
                            Projected usage exceeds budget limit
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Optimization Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Potential Savings:</p>
                        {forecast.savingsOpportunities.map((opportunity, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg mb-2">
                            <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-green-700">{opportunity.description}</p>
                              <p className="text-xs text-green-600 font-medium">
                                Save {formatCurrency(opportunity.potentialSavings)}/month
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Recommendations:</p>
                        <ul className="space-y-2">
                          {forecast.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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