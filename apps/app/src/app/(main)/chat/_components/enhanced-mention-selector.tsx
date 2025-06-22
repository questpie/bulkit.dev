'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@bulkit/ui/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@bulkit/ui/components/ui/avatar'
import { 
  Search, 
  AtSign,
  Bot,
  User,
  Users,
  Crown,
  Sparkles,
  Clock,
  Hash,
  Star,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import type { ChatAgent, Mention } from '@bulkit/shared/modules/chat/chat.schemas'
import { agentsQueryOptions, searchUsersQueryOptions, searchTeamsQueryOptions } from '../chat.queries'

interface EnhancedMentionSelectorProps {
  onSelectAgent: (mention: Mention) => void
  onSelectUser: (mention: Mention) => void
  className?: string
}

type MentionType = 'agents' | 'users' | 'teams'

interface UserMention {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  isOnline?: boolean
  lastSeen?: string
}

interface TeamMention {
  id: string
  name: string
  description?: string
  memberCount: number
  avatar?: string
}

export function EnhancedMentionSelector({ 
  onSelectAgent, 
  onSelectUser, 
  className 
}: EnhancedMentionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<MentionType>('agents')

  // Query for AI agents
  const agentsQuery = useQuery(agentsQueryOptions())
  
  // Query for users
  const usersQuery = useQuery(searchUsersQueryOptions(searchQuery))
  
  // Query for teams
  const teamsQuery = useQuery(searchTeamsQueryOptions(searchQuery))

  // Filter agents by search
  const filteredAgents = (agentsQuery.data || []).filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get filtered users from query
  const filteredUsers = usersQuery.data || []

  // Get filtered teams from query
  const filteredTeams = teamsQuery.data || []

  const handleSelectAgent = (agent: ChatAgent) => {
    const mention: Mention = {
      id: agent.id,
      type: 'agent',
      name: agent.name,
      startIndex: 0,
      endIndex: 0,
    }
    onSelectAgent(mention)
  }

  const handleSelectUser = (user: UserMention) => {
    const mention: Mention = {
      id: user.id,
      type: 'user',
      name: user.name,
      startIndex: 0,
      endIndex: 0,
    }
    onSelectUser(mention)
  }

  const handleSelectTeam = (team: TeamMention) => {
    const mention: Mention = {
      id: team.id,
      type: 'user', // Teams are treated as user mentions for now
      name: team.name,
      startIndex: 0,
      endIndex: 0,
    }
    onSelectUser(mention)
  }

  const renderAgent = (agent: ChatAgent) => {
    const agentTypeColors = {
      coordinator: 'bg-blue-500',
      post_management: 'bg-green-500',
      analytics: 'bg-purple-500',
      content_creation: 'bg-orange-500',
      scheduling: 'bg-indigo-500',
      research: 'bg-pink-500',
      task_management: 'bg-teal-500',
    }

    const colorClass = agentTypeColors[agent.agentType] || 'bg-gray-500'

    return (
      <Button
        key={agent.id}
        variant="ghost"
        onClick={() => handleSelectAgent(agent)}
        className="w-full p-3 h-auto justify-start hover:bg-muted/50"
      >
        <div className="flex items-center gap-3 w-full">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
            <Bot className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{agent.name}</span>
              <Badge variant="secondary" className="text-xs h-4 flex items-center gap-1">
                <Sparkles className="w-2 h-2" />
                AI
              </Badge>
              {agent.isActive && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </div>
            
            {agent.description && (
              <div className="text-xs text-muted-foreground truncate">{agent.description}</div>
            )}
            
            <div className="text-xs text-muted-foreground mt-1">
              {agent.capabilities.slice(0, 2).join(', ')}
              {agent.capabilities.length > 2 && ` +${agent.capabilities.length - 2} more`}
            </div>
          </div>
        </div>
      </Button>
    )
  }

  const renderUser = (user: UserMention) => {
    return (
      <Button
        key={user.id}
        variant="ghost"
        onClick={() => handleSelectUser(user)}
        className="w-full p-3 h-auto justify-start hover:bg-muted/50"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{user.name}</span>
              {user.role && (
                <Badge 
                  variant={user.role === 'Admin' ? 'default' : 'outline'} 
                  className="text-xs h-4"
                >
                  {user.role === 'Admin' && <Crown className="w-2 h-2 mr-1" />}
                  {user.role}
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            
            {!user.isOnline && user.lastSeen && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3" />
                <span>Last seen {user.lastSeen}</span>
              </div>
            )}
          </div>

          {user.isOnline && (
            <Badge variant="secondary" className="text-xs h-4">
              Online
            </Badge>
          )}
        </div>
      </Button>
    )
  }

  const renderTeam = (team: TeamMention) => {
    return (
      <Button
        key={team.id}
        variant="ghost"
        onClick={() => handleSelectTeam(team)}
        className="w-full p-3 h-auto justify-start hover:bg-muted/50"
      >
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{team.name}</span>
              <Badge variant="outline" className="text-xs h-4">
                {team.memberCount} members
              </Badge>
            </div>
            
            {team.description && (
              <div className="text-xs text-muted-foreground truncate">{team.description}</div>
            )}
          </div>
        </div>
      </Button>
    )
  }

  const tabCounts = {
    agents: filteredAgents.length,
    users: filteredUsers.length,
    teams: filteredTeams.length,
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2 mb-3">
          <AtSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Mention Someone</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents, users, or teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
            autoFocus
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MentionType)}>
        <TabsList className="w-full grid grid-cols-3 h-10 p-1 m-0">
          <TabsTrigger value="agents" className="text-xs">
            Agents ({tabCounts.agents})
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            Users ({tabCounts.users})
          </TabsTrigger>
          <TabsTrigger value="teams" className="text-xs">
            Teams ({tabCounts.teams})
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="m-0">
          <ScrollArea className="h-64">
            <div className="p-1">
              {filteredAgents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {searchQuery ? 'No agents found' : 'No agents available'}
                  </div>
                  {searchQuery && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Try a different search term
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredAgents.map(renderAgent)}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="m-0">
          <ScrollArea className="h-64">
            <div className="p-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {searchQuery ? 'No users found' : 'Start typing to search users'}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map(renderUser)}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="m-0">
          <ScrollArea className="h-64">
            <div className="p-1">
              {filteredTeams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {searchQuery ? 'No teams found' : 'Start typing to search teams'}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTeams.map(renderTeam)}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Help text */}
      <div className="p-3 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground">
          💡 Mention people to notify them or reference AI agents for specialized help.
        </div>
      </div>
    </div>
  )
}