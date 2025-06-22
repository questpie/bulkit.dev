import { postManagementAgent } from '@bulkit/api/modules/chat/services/agents/post-management.agent'
import { knowledgeManagement } from '@bulkit/api/modules/chat/services/agents/research.agent'
import { taskManagementAgent } from '@bulkit/api/modules/chat/services/agents/task-management.agent'
import type { AgentFactory } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import { webScrapingAgent } from '@bulkit/api/modules/chat/services/agents/web-scraping.agent'

const allAgents = [postManagementAgent, knowledgeManagement, taskManagementAgent, webScrapingAgent]

export const getAgentsMap = () => {
  return allAgents.reduce(
    (acc, agent) => {
      acc[agent.type] = agent.factory
      return acc
    },
    {} as Record<string, AgentFactory>
  )
}
