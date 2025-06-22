import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { ioc } from '@bulkit/api/ioc'
import { injectDatabase } from '@bulkit/api/db/db.client'
import type { AgentContext } from '../langchain-coordinator.service'
import { injectTasksService } from '@bulkit/api/modules/tasks/services/tasks.service'
import { createAgent } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import type { DynamicStructuredTool } from '@langchain/core/tools'

const createTaskManagementTools = (context: AgentContext): DynamicStructuredTool[] => [
  tool(
    async (input) => {
      try {
        const { tasksService, db } = ioc.resolve([injectTasksService, injectDatabase])

        const task = await tasksService.create(db, {
          organizationId: context.organizationId,
          createdByUserId: context.userId,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: input.status,
          assignedToUserId: input.assigneeId,
          dueDate: input.dueDate,
          labelIds: input.tags?.map(() => '') || [], // Convert tags to label IDs if needed
        })

        return JSON.stringify({
          success: true,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            status: task.status,
            assignedToUserId: task.assignedToUserId,
          },
          message: `Created task "${input.title}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to create task: ${errorMessage}`,
        })
      }
    },
    {
      name: 'create_task',
      description: 'Create a new task',
      schema: z.object({
        title: z.string().describe('Title of the task'),
        description: z.string().optional().describe('Description of the task'),
        priority: z
          .enum(['low', 'medium', 'high', 'critical'])
          .default('medium')
          .describe('Priority of the task'),
        status: z
          .enum(['todo', 'in_progress', 'review', 'done', 'blocked'])
          .default('todo')
          .describe('Status of the task'),
        assigneeId: z.string().optional().describe('ID of the user to assign the task to'),
        dueDate: z.string().optional().describe('Due date in ISO format'),
        tags: z.array(z.string()).optional().describe('Tags for the task'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { tasksService, db } = ioc.resolve([injectTasksService, injectDatabase])

        // Get the current task first
        const currentTask = await tasksService.getById(db, {
          taskId: input.taskId,
          organizationId: context.organizationId,
        })

        if (!currentTask) {
          throw new Error('Task not found')
        }

        // Update the task with new status
        const task = await tasksService.update(db, {
          id: input.taskId,
          status: input.status,
          createdByUserId: context.userId,
        })

        return JSON.stringify({
          success: true,
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
          },
          message: `Updated task status to "${input.status}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to update task status: ${errorMessage}`,
        })
      }
    },
    {
      name: 'update_task_status',
      description: 'Update the status of an existing task',
      schema: z.object({
        taskId: z.string().describe('ID of the task to update'),
        status: z
          .enum(['todo', 'in_progress', 'review', 'done', 'blocked'])
          .describe('New status for the task'),
        comment: z.string().optional().describe('Optional comment about the status change'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { tasksService, db } = ioc.resolve([injectTasksService, injectDatabase])

        const result = await tasksService.list(db, {
          organizationId: context.organizationId,
          filters: {
            status: input.status ? [input.status] : undefined,
            priority: input.priority ? [input.priority] : undefined,
            assignedToUserId: input.assigneeId,
          },
          limit: input.limit,
          offset: 0,
        })

        return JSON.stringify({
          success: true,
          tasks: result.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            assignedToUserId: task.assignedToUserId,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
          })),
          total: result.total,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to list tasks: ${errorMessage}`,
        })
      }
    },
    {
      name: 'list_tasks',
      description: 'List tasks with filtering options',
      schema: z.object({
        status: z
          .enum(['todo', 'in_progress', 'review', 'done', 'blocked'])
          .optional()
          .describe('Filter by status'),
        priority: z
          .enum(['low', 'medium', 'high', 'critical'])
          .optional()
          .describe('Filter by priority'),
        assigneeId: z.string().optional().describe('Filter by assigned user'),
        limit: z.number().min(1).max(50).default(10).describe('Maximum number of tasks to return'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { tasksService, db } = ioc.resolve([injectTasksService, injectDatabase])

        // Define campaign task templates
        const taskTemplates = [
          {
            title: `${input.campaignName} - Content Strategy`,
            description: 'Define content strategy and messaging for the campaign',
            priority: 'high' as const,
          },
          {
            title: `${input.campaignName} - Creative Assets`,
            description: 'Design and create visual assets for the campaign',
            priority: 'high' as const,
          },
          {
            title: `${input.campaignName} - Copy Writing`,
            description: 'Write compelling copy for all campaign materials',
            priority: 'medium' as const,
          },
          {
            title: `${input.campaignName} - Review & Approval`,
            description: 'Review all campaign materials for final approval',
            priority: 'high' as const,
          },
          {
            title: `${input.campaignName} - Launch Preparation`,
            description: 'Prepare and schedule campaign launch',
            priority: 'critical' as const,
          },
        ]

        const createdTasks = []

        for (let i = 0; i < taskTemplates.length; i++) {
          const template = taskTemplates[i]!
          const assigneeId = input.teamMembers?.[i % (input.teamMembers?.length || 1)]

          const task = await tasksService.create(db, {
            organizationId: context.organizationId,
            createdByUserId: context.userId,
            title: template.title,
            description: template.description,
            priority: template.priority,
            status: 'todo',
            assignedToUserId: assigneeId,
            dueDate: input.launchDate,
            labelIds: [input.campaignType, input.campaignName].filter(Boolean),
          })

          createdTasks.push({
            id: task.id,
            title: task.title,
            priority: task.priority,
            assignedToUserId: task.assignedToUserId,
          })
        }

        return JSON.stringify({
          success: true,
          tasks: createdTasks,
          message: `Created ${createdTasks.length} tasks for campaign "${input.campaignName}"`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to create campaign tasks: ${errorMessage}`,
        })
      }
    },
    {
      name: 'create_campaign_tasks',
      description: 'Create a set of tasks for a marketing campaign',
      schema: z.object({
        campaignName: z.string().describe('Name of the campaign'),
        campaignType: z.string().describe('Type of campaign (social, email, etc.)'),
        launchDate: z.string().optional().describe('Campaign launch date in ISO format'),
        teamMembers: z
          .array(z.string())
          .optional()
          .describe('IDs of team members to assign tasks to'),
      }),
    }
  ),

  tool(
    async (input) => {
      try {
        const { tasksService, db } = ioc.resolve([injectTasksService, injectDatabase])

        // Get all tasks for the organization
        const result = await tasksService.list(db, {
          organizationId: context.organizationId,
          filters: {
            assignedToUserId: input.teamMember,
          },
          limit: 1000,
          offset: 0,
        })

        const tasks = result.tasks

        // Calculate analytics
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t) => t.status === 'done').length
        const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
        const todoTasks = tasks.filter((t) => t.status === 'todo').length
        const blockedTasks = tasks.filter((t) => t.status === 'blocked').length

        // Group by priority
        const byPriority = tasks.reduce((acc: Record<string, number>, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1
          return acc
        }, {})

        // Calculate completion rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return JSON.stringify({
          success: true,
          analytics: {
            total: totalTasks,
            completed: completedTasks,
            inProgress: inProgressTasks,
            todo: todoTasks,
            blocked: blockedTasks,
            completionRate,
            byPriority,
          },
          message: `Task analytics for ${input.period} period`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return JSON.stringify({
          success: false,
          error: `Failed to get task analytics: ${errorMessage}`,
        })
      }
    },
    {
      name: 'get_task_analytics',
      description: 'Get analytics and insights about tasks',
      schema: z.object({
        period: z
          .enum(['week', 'month', 'quarter'])
          .default('month')
          .describe('Time period for analytics'),
        teamMember: z.string().optional().describe('Specific team member to analyze'),
      }),
    }
  ),
]

export const taskManagementAgent = createAgent('task_management', (context) => ({
  name: 'Task Manager',
  description: 'Creating and managing tasks, projects, campaigns, and workflow coordination',
  capabilities: [
    'task_creation',
    'project_management',
    'campaign_planning',
    'workflow_coordination',
    'task_analytics',
  ],
  systemPrompt: `You are a task management specialist focused on organizing and coordinating work.
Your expertise includes creating tasks, managing projects, and coordinating team workflows.

Key responsibilities:
- Create and organize tasks and projects
- Plan and manage campaigns with comprehensive task breakdowns
- Coordinate workflows and dependencies
- Track progress and deadlines
- Provide project management insights and analytics
- Assign tasks to appropriate team members

You help users stay organized and ensure nothing falls through the cracks.`,
  tools: createTaskManagementTools(context),
}))
