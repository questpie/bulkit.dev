import type { DynamicStructuredTool } from '@langchain/core/tools'
import type { AgentContext } from '../../langchain-coordinator.service'

export interface AgentDefinition {
  agentType: string
  name: string
  description: string
  capabilities: string[]
  tools: DynamicStructuredTool[]
  systemPrompt: string
}

export type AgentFactory = (agentContext: AgentContext) => AgentDefinition

/**
 * Creates an agent definition for the given agent type
 */
export function createAgent(
  type: string,
  factory: (agentContext: AgentContext) => Omit<AgentDefinition, 'agentType'>
): {
  type: string
  factory: AgentFactory
} {
  return {
    type,
    factory: (agentContext: AgentContext) =>
      ({
        agentType: type,
        ...factory(agentContext),
      }) as AgentDefinition,
  }
}
