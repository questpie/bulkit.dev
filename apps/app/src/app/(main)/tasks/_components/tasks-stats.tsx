'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@bulkit/ui/components/ui/card'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Progress } from '@bulkit/ui/components/ui/progress'
import { CheckCircle, Clock, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { taskStatsQueryOptions } from '../tasks.queries'

export function TaskStats() {
  const statsQuery = useQuery(taskStatsQueryOptions())

  // Use mock data as fallback while loading or on error
  const stats = statsQuery.data || {
    total: 0,
    byStatus: { todo: 0, in_progress: 0, review: 0, done: 0, blocked: 0 },
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    overdue: 0,
    completedThisWeek: 0,
    averageCompletionTime: 0,
  }

  const completionRate = stats.total > 0 ? ((stats.byStatus.done || 0) / stats.total) * 100 : 0
  const inProgressTasks = (stats.byStatus.in_progress || 0) + (stats.byStatus.review || 0)

  if (statsQuery.isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <Card key={`skeleton-${i}`}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='h-4 w-20 bg-gray-200 rounded animate-pulse' />
              <div className='h-4 w-4 bg-gray-200 rounded animate-pulse' />
            </CardHeader>
            <CardContent>
              <div className='h-8 w-16 bg-gray-200 rounded animate-pulse mb-2' />
              <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* Total Tasks */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Tasks</CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.total}</div>
          <div className='flex items-center space-x-2 mt-2'>
            <Badge variant='secondary' className='text-xs'>
              {stats.byStatus.todo || 0} To Do
            </Badge>
            <Badge variant='secondary' className='text-xs'>
              {inProgressTasks} Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Completion Rate</CardTitle>
          <CheckCircle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className='mt-2' />
          <p className='text-xs text-muted-foreground mt-2'>
            {stats.byStatus.done || 0} of {stats.total} tasks completed
          </p>
        </CardContent>
      </Card>

      {/* Overdue Tasks */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Overdue Tasks</CardTitle>
          <AlertTriangle className='h-4 w-4 text-red-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-red-600'>{stats.overdue}</div>
          <div className='flex items-center space-x-2 mt-2'>
            <Badge variant='destructive' className='text-xs'>
              {stats.byPriority.critical || 0} Critical
            </Badge>
            <Badge variant='secondary' className='text-xs'>
              {stats.byPriority.high || 0} High
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Performance */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>This Week</CardTitle>
          <TrendingUp className='h-4 w-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>{stats.completedThisWeek}</div>
          <p className='text-xs text-muted-foreground'>Tasks completed</p>
          <div className='flex items-center mt-2'>
            <Clock className='h-3 w-3 text-muted-foreground mr-1' />
            <span className='text-xs text-muted-foreground'>
              Avg. {stats.averageCompletionTime} days
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
