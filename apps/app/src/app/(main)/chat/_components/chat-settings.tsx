'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Label } from '@bulkit/ui/components/ui/label'
import { Switch } from '@bulkit/ui/components/ui/switch'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { ScrollArea } from '@bulkit/ui/components/ui/scroll-area'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { 
  Settings, 
  Bot, 
  Bell, 
  Palette,
  Clock,
  Shield,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'react-icons/lu'
import { NotificationSettings } from './notification-settings'
import { cn } from '@bulkit/ui/lib'

import type { ChatAgent } from '@bulkit/shared/modules/chat/chat.schemas'
import { agentsQueryOptions } from '../chat.queries'
import { 
  useChatNotifications, 
  useChatSounds, 
  useChatTheme,
  useAutoScrollEnabled,
  useTypingIndicatorsEnabled,
} from '../chat.atoms'

interface ChatSettingsProps {
  agents?: ChatAgent[]
}

export function ChatSettings({ agents: propAgents }: ChatSettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'agents' | 'notifications' | 'appearance'>('general')
  const [showDangerZone, setShowDangerZone] = useState(false)
  
  const agentsQuery = useQuery(agentsQueryOptions())
  const agents = propAgents || agentsQuery.data || []

  // Settings atoms
  const [notificationsEnabled, setNotificationsEnabled] = useChatNotifications()
  const [soundsEnabled, setSoundsEnabled] = useChatSounds()
  const [theme, setTheme] = useChatTheme()
  const [autoScrollEnabled, setAutoScrollEnabled] = useAutoScrollEnabled()
  const [typingIndicatorsEnabled, setTypingIndicatorsEnabled] = useTypingIndicatorsEnabled()

  const handleSaveSettings = () => {
    // Settings are auto-saved via atoms, just show feedback
    // You could add a toast notification here
    console.log('Settings saved')
  }

  const handleResetSettings = () => {
    setNotificationsEnabled(true)
    setSoundsEnabled(true)
    setTheme('system')
    setAutoScrollEnabled(true)
    setTypingIndicatorsEnabled(true)
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Chat Behavior</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Auto-scroll to new messages</Label>
              <div className="text-xs text-muted-foreground">
                Automatically scroll to see new messages
              </div>
            </div>
            <Switch
              checked={autoScrollEnabled}
              onCheckedChange={setAutoScrollEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Show typing indicators</Label>
              <div className="text-xs text-muted-foreground">
                Show when agents are typing responses
              </div>
            </div>
            <Switch
              checked={typingIndicatorsEnabled}
              onCheckedChange={setTypingIndicatorsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Sound notifications</Label>
              <div className="text-xs text-muted-foreground">
                Play sounds for new messages and notifications
              </div>
            </div>
            <Switch
              checked={soundsEnabled}
              onCheckedChange={setSoundsEnabled}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Message Settings</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="message-retention" className="text-sm">Message History</Label>
            <div className="text-xs text-muted-foreground mb-2">
              How long to keep chat messages
            </div>
            <select 
              id="message-retention"
              className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
              defaultValue="forever"
            >
              <option value="1-week">1 Week</option>
              <option value="1-month">1 Month</option>
              <option value="3-months">3 Months</option>
              <option value="1-year">1 Year</option>
              <option value="forever">Forever</option>
            </select>
          </div>

          <div>
            <Label htmlFor="max-context" className="text-sm">Context Window</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Maximum messages to include in conversation context
            </div>
            <Input
              id="max-context"
              type="number"
              defaultValue="50"
              min="10"
              max="200"
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderAgentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Available Agents</h3>
        <div className="text-xs text-muted-foreground mb-4">
          Manage which AI agents are available in your conversations
        </div>
        
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  agent.isActive ? "bg-green-500" : "bg-gray-500"
                )}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                
                <div>
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.description}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {agent.capabilities.slice(0, 3).map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs h-4">
                        {cap}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs h-4">
                        +{agent.capabilities.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Switch
                checked={agent.isActive}
                onCheckedChange={(checked) => {
                  // Handle agent enable/disable
                  console.log(`Toggle agent ${agent.id}:`, checked)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Agent Behavior</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="response-style" className="text-sm">Response Style</Label>
            <div className="text-xs text-muted-foreground mb-2">
              How detailed should agent responses be
            </div>
            <select 
              id="response-style"
              className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md"
              defaultValue="balanced"
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Proactive suggestions</Label>
              <div className="text-xs text-muted-foreground">
                Allow agents to suggest actions and improvements
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Push Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Enable notifications</Label>
              <div className="text-xs text-muted-foreground">
                Receive notifications for new messages and updates
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Agent responses</Label>
              <div className="text-xs text-muted-foreground">
                Get notified when agents respond to your messages
              </div>
            </div>
            <Switch defaultChecked disabled={!notificationsEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Task updates</Label>
              <div className="text-xs text-muted-foreground">
                Notifications when tasks are completed or need attention
              </div>
            </div>
            <Switch defaultChecked disabled={!notificationsEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Post reviews</Label>
              <div className="text-xs text-muted-foreground">
                When posts are ready for review or published
              </div>
            </div>
            <Switch defaultChecked disabled={!notificationsEnabled} />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Notification Schedule</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Quiet hours</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Don't send notifications during these hours
            </div>
            <div className="flex gap-2 items-center">
              <Input type="time" defaultValue="22:00" className="w-24" />
              <span className="text-sm text-muted-foreground">to</span>
              <Input type="time" defaultValue="08:00" className="w-24" />
            </div>
          </div>

          <div>
            <Label className="text-sm">Notification frequency</Label>
            <div className="text-xs text-muted-foreground mb-2">
              How often to bundle notifications
            </div>
            <select className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md">
              <option value="instant">Instant</option>
              <option value="5min">Every 5 minutes</option>
              <option value="30min">Every 30 minutes</option>
              <option value="1hour">Hourly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Theme</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">Color theme</Label>
            <div className="text-xs text-muted-foreground mb-3">
              Choose your preferred appearance
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'system'].map((themeOption) => (
                <Button
                  key={themeOption}
                  variant={theme === themeOption ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(themeOption as any)}
                  className="h-16 flex flex-col gap-1"
                >
                  <div className={cn(
                    "w-4 h-4 rounded border",
                    themeOption === 'light' && "bg-white border-gray-300",
                    themeOption === 'dark' && "bg-gray-900 border-gray-700",
                    themeOption === 'system' && "bg-linear-to-r from-white to-gray-900 border-gray-500"
                  )} />
                  <span className="text-xs capitalize">{themeOption}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Message density</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Spacing between messages
            </div>
            <select className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md">
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div>
            <Label className="text-sm">Font size</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Text size in chat messages
            </div>
            <select className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-medium mb-3">Chat Layout</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Show timestamps</Label>
              <div className="text-xs text-muted-foreground">
                Display message timestamps
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Show agent avatars</Label>
              <div className="text-xs text-muted-foreground">
                Display avatars next to agent messages
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Compact mode</Label>
              <div className="text-xs text-muted-foreground">
                Reduce spacing and padding in the chat interface
              </div>
            </div>
            <Switch />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <NotificationSettings />
  )

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4" />
          <span className="font-medium">Chat Settings</span>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="h-8 text-xs"
              >
                <Icon className="w-3 h-3 mr-1" />
                {tab.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Settings content */}
      <ScrollArea className="flex-1 p-4">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'agents' && renderAgentSettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'appearance' && renderAppearanceSettings()}
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSettings}
              className="h-8 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>

          <Button
            onClick={handleSaveSettings}
            size="sm"
            className="h-8 text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Changes
          </Button>
        </div>

        {/* Danger zone toggle */}
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="h-6 text-xs text-muted-foreground hover:text-destructive"
          >
            <Shield className="w-3 h-3 mr-1" />
            {showDangerZone ? 'Hide' : 'Show'} Danger Zone
          </Button>

          {showDangerZone && (
            <div className="mt-2 p-3 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="text-sm font-medium text-destructive mb-2">Danger Zone</div>
              <div className="text-xs text-muted-foreground mb-3">
                These actions are irreversible. Proceed with caution.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All Messages
                </Button>
                {conversationId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete Conversation
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}