import { ChatAnthropic } from '@langchain/anthropic'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages'
import type { DynamicStructuredTool } from '@langchain/core/tools'
import {
  Annotation,
  Command,
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

import { injectApiKeyManager, type ApiKeyManager } from '@bulkit/api/common/api-key.manager'
import type { AITextProvider } from '@bulkit/api/db/db.schema'
import { ioc } from '@bulkit/api/ioc'
import type { AgentContext } from './langchain-coordinator.service'
import type { AgentDefinition } from '@bulkit/api/modules/chat/services/agents/utils/create-agent'
import { getAgentsMap } from '@bulkit/api/modules/chat/services/agents'

// Extended state for multi-agent context
const MultiAgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    // Different types are allowed for updates
    reducer: (left: BaseMessage[], right: BaseMessage | BaseMessage[]) => {
      if (Array.isArray(right)) {
        return left.concat(right)
      }
      return left.concat([right])
    },
    default: () => [] as BaseMessage[],
  }),
  context: Annotation<AgentContext>({
    reducer: (a: AgentContext, b: Partial<AgentContext>) => ({ ...a, ...b }),
    default: () => ({}) as AgentContext,
  }),
  provider: Annotation<AITextProvider>({
    reducer: (a: AITextProvider, b: AITextProvider) => b,
    default: () => ({}) as AITextProvider,
  }),
  currentAgent: Annotation<string>({
    reducer: (a: string, b: string) => b,
    default: () => '',
  }),
})

export class LangGraphAgentService {
  private modelCache: Map<string, BaseChatModel> = new Map()
  private agentGraphCache: Map<string, any> = new Map()

  constructor(private readonly apiKeyManager: ApiKeyManager) {}

  /**
   * Creates a summary node for comment responses
   */
  private createSummaryNode() {
    return async (state: typeof MultiAgentStateAnnotation.State) => {
      const model = await this.getChatModel(state.provider)

      // Get all messages from the conversation
      const messages = state.messages

      // Build summary prompt
      const summaryPrompt = new SystemMessage(`
You are a summary agent. Your job is to create a concise, helpful response based on what the agents have done.

Instructions:
- Review all the actions taken by the agents
- Create a brief, user-friendly summary of what was accomplished
- If tools were used, mention what was done but keep it simple
- If no tools were used, just provide a helpful response to the original comment
- Be conversational and helpful
- Don't mention agent names or technical details
- Keep the response under 200 words
`)

      const summaryMessages = [summaryPrompt, ...messages]
      const response = await model.invoke(summaryMessages)

      return new Command({
        goto: END,
        update: {
          messages: new AIMessage({
            content: response.content,
            name: 'summary',
          }),
        },
      })
    }
  }

  /**
   * Creates a supervisor node that coordinates agent routing decisions
   */
  private createSupervisorNode(agentDefinitions: AgentDefinition[]) {
    return async (state: typeof MultiAgentStateAnnotation.State) => {
      const model = await this.getChatModel(state.provider)
      const availableAgents = agentDefinitions.map((a) => a.agentType)

      // Define supervisor routing schema
      const supervisorSchema = z.object({
        nextAgent: z
          .enum(['__end__', ...availableAgents] as const)
          .describe('Which agent should handle this request next, or __end__ to finish'),
        reasoning: z.string().describe('Brief reasoning for this routing decision'),
        priority: z.enum(['high', 'medium', 'low']).describe('Priority level for this task'),
      })

      // Build dynamic agent descriptions from factories
      const agentDescriptions = agentDefinitions
        .map((agent) => `- ${agent.agentType}: ${agent.description}`)
        .join('\n')

      // Build supervisor system prompt with context
      let supervisorSystemPrompt = [
        'You are a supervisor coordinating a team of specialized agents.',
        'Your role is to analyze user requests and route them to the most appropriate agent.',
        '',
        `Available agents: ${availableAgents.join(', ')}`,
        '',
        'Agent capabilities:',
        agentDescriptions,
        '',
        'Routing Guidelines:',
        '- Route to the most specialized agent for the task',
        '- Use coordinator for complex multi-step tasks',
        '- Use __end__ only when the conversation is clearly finished',
        '- Consider the current conversation context',
      ].join('\n')

      // Add context information to supervisor
      if (state.context.pageContext) {
        supervisorSystemPrompt += `\n\nCurrent page context: User is on ${state.context.pageContext.path}`
        if (state.context.pageContext.entityType && state.context.pageContext.entityId) {
          supervisorSystemPrompt += ` viewing ${state.context.pageContext.entityType} ${state.context.pageContext.entityId}`
        }
      }

      // Add referenced entities
      if (state.context.referencedEntities.length > 0) {
        supervisorSystemPrompt += '\n\nReferenced entities in this conversation:'
        for (const ref of state.context.referencedEntities) {
          supervisorSystemPrompt += `\n- ${ref.type}: ${ref.title} (${ref.id})`
        }
      }

      const supervisorPrompt = new SystemMessage(supervisorSystemPrompt)

      const messages = [supervisorPrompt, ...state.messages]
      const supervisorModel = model.withStructuredOutput(supervisorSchema, {
        name: 'supervisor_routing',
      })

      const decision = await supervisorModel.invoke(messages)

      return new Command({
        goto: decision.nextAgent,
        update: {
          currentAgent: decision.nextAgent,
          // Add supervisor reasoning to context for debugging
          context: {
            ...state.context,
            lastSupervisorDecision: decision,
          },
        },
      })
    }
  }

  /**
   * Creates a specialized agent node that always returns to supervisor
   */
  private createAgentNode(agentDefinition: AgentDefinition) {
    return async (state: typeof MultiAgentStateAnnotation.State) => {
      const model = await this.getChatModel(state.provider)
      const modelWithTools =
        agentDefinition.tools.length > 0 && model.bindTools
          ? model.bindTools(agentDefinition.tools)
          : model

      // Build enriched system message with context
      const enrichedSystemPrompt = this.buildSystemPrompt(agentDefinition, state.context)
      const systemMessage = new SystemMessage(
        [
          enrichedSystemPrompt,
          '\n\nAgent Instructions:',
          '- Focus on executing your specialized tasks',
          '- Provide complete and helpful responses',
          '- You will return to the supervisor after completing your task',
          '- Do not mention other agents or routing decisions to the user',
        ].join('\n')
      )

      const messages = [systemMessage, ...state.messages]

      // Execute agent task
      const response = await modelWithTools.invoke(messages)

      // Handle tool calls if present
      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolNode = new ToolNode(agentDefinition.tools)
        const toolResults = await toolNode.invoke({
          messages: [...messages, response],
        })

        // Always return to supervisor after tool execution
        return new Command({
          goto: 'supervisor',
          update: {
            messages: [response, ...toolResults.messages],
            currentAgent: 'supervisor',
          },
        })
      }

      // No tool calls - return response and go back to supervisor
      const agentResponse = new AIMessage({
        content: response.content,
        name: agentDefinition.agentType,
      })

      return new Command({
        goto: 'supervisor',
        update: {
          messages: agentResponse,
          currentAgent: 'supervisor',
        },
      })
    }
  }

  /**
   * Creates a multi-agent supervisor pattern graph
   */
  async createMultiAgentGraph(provider: AITextProvider, context: AgentContext) {
    const cacheKey = `supervisor-${provider.id}`

    if (this.agentGraphCache.has(cacheKey)) {
      return this.agentGraphCache.get(cacheKey)
    }

    const agentDefinitions = this.getAgentDefinitions(context)

    const graph = new StateGraph(MultiAgentStateAnnotation)

    // Add supervisor node
    const supervisorNode = this.createSupervisorNode(agentDefinitions)
    graph.addNode('supervisor', supervisorNode, {
      ends: [...agentDefinitions.map((a) => a.agentType), END],
    })

    // Add each agent as a node that returns to supervisor
    for (const agentDefinition of agentDefinitions) {
      const agentNode = this.createAgentNode(agentDefinition)
      graph.addNode(agentDefinition.agentType, agentNode, {
        ends: ['supervisor'],
      })
    }

    // Set entry point to supervisor
    graph.addEdge(START, 'supervisor' as any)

    const compiledGraph = graph.compile()
    this.agentGraphCache.set(cacheKey, compiledGraph)

    return compiledGraph
  }

  /**
   * Creates a comment conversation graph with summary node
   */
  async createCommentConversationGraph(provider: AITextProvider, context: AgentContext) {
    const cacheKey = `comment-${provider.id}`

    if (this.agentGraphCache.has(cacheKey)) {
      return this.agentGraphCache.get(cacheKey)
    }

    const agentDefinitions = this.getAgentDefinitions(context)

    const graph = new StateGraph(MultiAgentStateAnnotation)

    // Add supervisor node - can route to agents or summary
    const supervisorNode = this.createSupervisorNode(agentDefinitions)
    graph.addNode('supervisor', supervisorNode, {
      ends: [...agentDefinitions.map((a) => a.agentType), 'summary'],
    })

    // Add summary node as final step
    const summaryNode = this.createSummaryNode()
    graph.addNode('summary', summaryNode, {
      ends: [END],
    })

    // Add each agent as a node that returns to supervisor
    for (const agentDefinition of agentDefinitions) {
      const agentNode = this.createAgentNode(agentDefinition)
      graph.addNode(agentDefinition.agentType, agentNode, {
        ends: ['supervisor'],
      })
    }

    // Set entry point to supervisor
    graph.addEdge(START, 'supervisor' as any)

    const compiledGraph = graph.compile()
    this.agentGraphCache.set(cacheKey, compiledGraph)

    return compiledGraph
  }

  /**
   * Run multi-agent conversation
   */
  async runMultiAgentConversation(
    userMessage: string,
    context: AgentContext,
    provider: AITextProvider
  ) {
    const graph = await this.createMultiAgentGraph(provider, context)

    const initialState = {
      messages: [new HumanMessage(userMessage)],
      context,
      provider,
      currentAgent: 'supervisor',
    }

    const result = await graph.invoke(initialState as any)
    const lastMessage = result.messages[result.messages.length - 1]

    return {
      text: lastMessage.content as string,
      toolCalls: lastMessage.tool_calls || [],
      messages: result.messages,
      finalAgent: result.currentAgent,
    }
  }

  private getAgentDefinitions(context: AgentContext) {
    const agentMap = getAgentsMap()
    return Object.values(agentMap)
      .map((factory) => {
        return factory(context)
      })
      .filter(Boolean) as AgentDefinition[]
  }

  private buildSystemPrompt(agent: AgentDefinition, context: AgentContext): string {
    let prompt = agent.systemPrompt

    // Add context information
    if (context.pageContext) {
      prompt += `\n\nCurrent page context: User is on ${context.pageContext.path}`
      if (context.pageContext.entityType && context.pageContext.entityId) {
        prompt += ` viewing ${context.pageContext.entityType} ${context.pageContext.entityId}`
      }
    }

    // Add referenced entities
    if (context.referencedEntities.length > 0) {
      prompt += '\n\nReferenced entities in this conversation:'
      for (const ref of context.referencedEntities) {
        prompt += `\n- ${ref.type}: ${ref.title} (${ref.id})`
      }
    }

    // Add available capabilities
    prompt += `\n\nYour capabilities: ${agent.capabilities.join(', ')}`

    // Add tool usage instructions
    prompt +=
      '\n\nYou have access to tools to help users. Use them when appropriate to provide comprehensive assistance.'

    return prompt
  }

  /**
   * Stream multi-agent conversation
   */
  async streamMultiAgentConversation(
    userMessage: string,
    context: AgentContext,
    provider: AITextProvider
  ) {
    const graph = await this.createMultiAgentGraph(provider, context)

    const initialState = {
      messages: [new HumanMessage(userMessage)],
      context,
      provider,
      currentAgent: 'supervisor',
    }

    const stream = await graph.stream(initialState, {
      streamMode: 'values',
    })

    return {
      stream: this.createMultiAgentResponseStream(stream),
    }
  }

  /**
   * Run comment conversation with summary
   */
  async runCommentConversation(
    userMessage: string,
    context: AgentContext,
    provider: AITextProvider
  ) {
    const graph = await this.createCommentConversationGraph(provider, context)

    const initialState = {
      messages: [new HumanMessage(userMessage)],
      context,
      provider,
      currentAgent: 'supervisor',
    }

    const result = await graph.invoke(initialState as any)
    const lastMessage = result.messages[result.messages.length - 1]

    return {
      text: lastMessage.content as string,
      toolCalls: lastMessage.tool_calls || [],
      messages: result.messages,
      finalAgent: result.currentAgent,
    }
  }

  private async *createMultiAgentResponseStream(stream: any) {
    let lastContent = ''
    let currentAgent = ''

    for await (const state of stream) {
      if (state.messages && state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1]

        if (lastMessage?.content && lastMessage.content !== lastContent) {
          const newContent = lastMessage.content.slice(lastContent.length)
          lastContent = lastMessage.content
          currentAgent = state.currentAgent || currentAgent

          yield {
            content: newContent,
            fullContent: lastContent,
            currentAgent,
            isComplete: false,
          }
        }
      }
    }

    yield {
      content: '',
      fullContent: lastContent,
      currentAgent,
      isComplete: true,
    }
  }

  private async getChatModel(provider: AITextProvider): Promise<BaseChatModel> {
    if (this.modelCache.has(provider.id)) {
      return this.modelCache.get(provider.id)!
    }

    let model: BaseChatModel

    switch (provider.name) {
      case 'openai': {
        const openaiApiKey = await this.apiKeyManager.decrypt(provider.apiKey)
        model = new ChatOpenAI({
          apiKey: openaiApiKey,
          model: provider.model,
        })
        break
      }
      case 'anthropic': {
        const anthropicApiKey = await this.apiKeyManager.decrypt(provider.apiKey)
        model = new ChatAnthropic({
          apiKey: anthropicApiKey,
          model: provider.model,
        })
        break
      }

      default:
        throw new Error(`Unsupported provider: ${provider.name}`)
    }

    this.modelCache.set(provider.id, model)
    return model
  }
}

export const injectLangGraphAgentService = ioc.register('langGraphAgentService', (ioc) => {
  const { apiKeyManager } = ioc.resolve([injectApiKeyManager])
  return new LangGraphAgentService(apiKeyManager)
})
