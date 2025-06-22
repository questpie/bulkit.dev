'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { Input } from '@bulkit/ui/components/ui/input'
import { LuBot, LuUser, LuSparkles, LuSearch, LuAtSign } from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { ChatAgent, Mention } from '@bulkit/shared/modules/chat/chat.schemas'

interface MentionSelectorProps {
  agents: ChatAgent[]
  onSelect: (mention: Mention) => void
}

export function MentionSelector({ agents, onSelect }: MentionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter agents by search query
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectAgent = (agent: ChatAgent) => {
    const mention: Mention = {
      id: agent.id,
      type: 'agent',
      name: agent.name,
      startIndex: 0, // Will be set by parent component
      endIndex: 0, // Will be set by parent component
    }
    onSelect(mention)
  }

  const agentTypeColors = {
    coordinator: 'bg-blue-500',
    post_management: 'bg-green-500',
    analytics: 'bg-purple-500',
    content_creation: 'bg-orange-500',
    scheduling: 'bg-indigo-500',
    research: 'bg-pink-500',
    task_management: 'bg-teal-500',
  }

  const agentTypeLabels = {
    coordinator: 'Coordinator',
    post_management: 'Post Manager',
    analytics: 'Analytics',
    content_creation: 'Content Creator',
    scheduling: 'Scheduler',
    research: 'Researcher',
    task_management: 'Task Manager',
  }

  const renderAgent = (agent: ChatAgent) => {
    const colorClass = agentTypeColors[agent.agentType] || 'bg-gray-500'
    const typeLabel = agentTypeLabels[agent.agentType] || agent.agentType

    return (
      <Button
        key={agent.id}
        variant='ghost'
        onClick={() => handleSelectAgent(agent)}
        className='w-full p-3 h-auto justify-start hover:bg-muted/50'
      >
        <div className='flex items-center gap-3 w-full'>
          {/* Agent Icon */}
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              colorClass
            )}
          >
            <LuBot className='w-4 h-4 text-white' />
          </div>

          {/* Agent Info */}
          <div className='flex-1 min-w-0 text-left'>
            <div className='flex items-center gap-2 mb-1'>
              <span className='font-medium text-sm truncate'>{agent.name}</span>
              <Badge variant='secondary' className='text-xs h-4 flex items-center gap-1'>
                <LuSparkles className='w-2 h-2' />
                AI
              </Badge>
            </div>

            {agent.description && (
              <div className='text-xs text-muted-foreground truncate'>{agent.description}</div>
            )}

            <div className='text-xs text-muted-foreground mt-1'>
              {typeLabel} • {agent.capabilities.slice(0, 2).join(', ')}
              {agent.capabilities.length > 2 && ` +${agent.capabilities.length - 2} more`}
            </div>
          </div>

          {/* Active indicator */}
          {agent.isActive && <div className='w-2 h-2 bg-green-500 rounded-full flex-shrink-0' />}
        </div>
      </Button>
    )
  }

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='p-3 border-b'>
        <div className='flex items-center gap-2 mb-2'>
          <LuAtSign className='w-4 h-4 text-muted-foreground' />
          <span className='text-sm font-medium'>Mention AI Agent</span>
        </div>

        <div className='relative'>
          <LuSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search agents...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={{ wrapper: 'pl-9 h-8' }}
            autoFocus
          />
        </div>
      </div>

      {/* Agents List */}
      <ScrollArea className='h-64'>
        <div className='p-1'>
          {filteredAgents.length === 0 ? (
            <div className='text-center py-8'>
              <LuBot className='w-8 h-8 text-muted-foreground mx-auto mb-2' />
              <div className='text-sm text-muted-foreground'>
                {searchQuery ? 'No agents found' : 'No agents available'}
              </div>
              {searchQuery && (
                <div className='text-xs text-muted-foreground mt-1'>
                  Try a different search term
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-1'>{filteredAgents.map(renderAgent)}</div>
          )}
        </div>
      </ScrollArea>

      {/* Help text */}
      <div className='p-3 border-t bg-muted/30'>
        <div className='text-xs text-muted-foreground'>
          💡 Mention agents to get specialized help with posts, analytics, tasks, and more.
        </div>
      </div>
    </div>
  )
}
