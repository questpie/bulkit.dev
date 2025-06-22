'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Label } from '@bulkit/ui/components/ui/label'
import { Switch } from '@bulkit/ui/components/ui/switch'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@bulkit/ui/components/ui/card'
import { 
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  CheckSquare,
  FileText,
  AlertTriangle,
  Clock,
  Settings,
  Check,
  X,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

import { 
  useChatNotifications, 
  useChatSounds, 
  useTypingIndicatorsEnabled 
} from '../chat.atoms'
import { useBrowserNotifications } from '../_hooks/use-browser-notifications'

export function NotificationSettings() {
  const [chatNotificationsEnabled, setChatNotificationsEnabled] = useChatNotifications()
  const [chatSoundsEnabled, setChatSoundsEnabled] = useChatSounds()
  const [typingIndicatorsEnabled, setTypingIndicatorsEnabled] = useTypingIndicatorsEnabled()
  
  const browserNotifications = useBrowserNotifications()
  
  // Local state for notification preferences
  const [preferences, setPreferences] = useState({
    // Notification types
    newMessages: true,
    agentReplies: true,
    taskReminders: true,
    contentReady: true,
    systemAlerts: true,
    mentions: true,
    
    // Delivery methods
    browserNotifications: true,
    emailDigests: false,
    pushNotifications: true,
    
    // Timing
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    weekendsOnly: false,
    
    // Frequency
    instantNotifications: true,
    digestFrequency: 'daily', // never, hourly, daily, weekly
    
    // Channels
    chatNotifications: true,
    taskNotifications: true,
    contentNotifications: true,
    systemNotifications: true,
  })

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleTestNotification = async () => {
    if (browserNotifications.permission !== 'granted') {
      const permission = await browserNotifications.requestPermission()
      if (permission !== 'granted') {
        return
      }
    }

    browserNotifications.showChatNotification({
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings are working correctly.',
      urgent: false,
    })
  }

  const handleSaveSettings = () => {
    // Save preferences to backend/local storage
    console.log('Saving notification preferences:', preferences)
    // Show success feedback
  }

  const notificationTypes = [
    {
      id: 'newMessages',
      title: 'New Messages',
      description: 'When you receive new chat messages',
      icon: MessageSquare,
      key: 'newMessages' as const,
    },
    {
      id: 'agentReplies',
      title: 'AI Agent Replies',
      description: 'When AI agents respond to your messages',
      icon: MessageSquare,
      key: 'agentReplies' as const,
    },
    {
      id: 'taskReminders',
      title: 'Task Reminders',
      description: 'When tasks are due or overdue',
      icon: CheckSquare,
      key: 'taskReminders' as const,
    },
    {
      id: 'contentReady',
      title: 'Content Ready',
      description: 'When content is ready for review or published',
      icon: FileText,
      key: 'contentReady' as const,
    },
    {
      id: 'systemAlerts',
      title: 'System Alerts',
      description: 'Important system notifications and updates',
      icon: AlertTriangle,
      key: 'systemAlerts' as const,
    },
    {
      id: 'mentions',
      title: 'Mentions',
      description: 'When someone mentions you in chat',
      icon: Bell,
      key: 'mentions' as const,
    },
  ]

  const deliveryMethods = [
    {
      id: 'browserNotifications',
      title: 'Browser Notifications',
      description: 'Desktop notifications in your browser',
      icon: Monitor,
      key: 'browserNotifications' as const,
      status: browserNotifications.permission,
    },
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Mobile push notifications',
      icon: Smartphone,
      key: 'pushNotifications' as const,
    },
    {
      id: 'emailDigests',
      title: 'Email Digests',
      description: 'Summary emails of your notifications',
      icon: Mail,
      key: 'emailDigests' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notification Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Quick Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Settings</CardTitle>
          <CardDescription>
            Main notification controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">All Notifications</Label>
              <div className="text-xs text-muted-foreground">
                Enable or disable all notifications
              </div>
            </div>
            <Switch
              checked={chatNotificationsEnabled}
              onCheckedChange={setChatNotificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Sound Effects</Label>
              <div className="text-xs text-muted-foreground">
                Play sounds for notifications
              </div>
            </div>
            <div className="flex items-center gap-2">
              {chatSoundsEnabled ? (
                <Volume2 className="w-4 h-4 text-green-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
              <Switch
                checked={chatSoundsEnabled}
                onCheckedChange={setChatSoundsEnabled}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Typing Indicators</Label>
              <div className="text-xs text-muted-foreground">
                Show when others are typing
              </div>
            </div>
            <Switch
              checked={typingIndicatorsEnabled}
              onCheckedChange={setTypingIndicatorsEnabled}
            />
          </div>

          <div className="pt-2 border-t">
            <Button
              onClick={handleTestNotification}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map(type => {
            const Icon = type.icon
            return (
              <div key={type.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{type.title}</Label>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.key]}
                  onCheckedChange={(checked) => handlePreferenceChange(type.key, checked)}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Methods</CardTitle>
          <CardDescription>
            How you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryMethods.map(method => {
            const Icon = method.icon
            const isEnabled = preferences[method.key]
            
            return (
              <div key={method.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{method.title}</Label>
                      {method.status && (
                        <Badge 
                          variant={method.status === 'granted' ? 'default' : 'secondary'}
                          className="text-xs h-4"
                        >
                          {method.status === 'granted' ? (
                            <>
                              <Check className="w-2 h-2 mr-1" />
                              Enabled
                            </>
                          ) : method.status === 'denied' ? (
                            <>
                              <X className="w-2 h-2 mr-1" />
                              Blocked
                            </>
                          ) : (
                            'Not Set'
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {method.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {method.id === 'browserNotifications' && method.status === 'denied' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={browserNotifications.requestPermission}
                      className="text-xs h-7"
                    >
                      Enable
                    </Button>
                  )}
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange(method.key, checked)}
                    disabled={method.id === 'browserNotifications' && method.status === 'denied'}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
          <CardDescription>
            When you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <div className="text-xs text-muted-foreground">
                Disable notifications during specific hours
              </div>
            </div>
            <Switch
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => handlePreferenceChange('quietHoursEnabled', checked)}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Select
                  value={preferences.quietHoursStart}
                  onValueChange={(value) => handlePreferenceChange('quietHoursStart', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">End Time</Label>
                <Select
                  value={preferences.quietHoursEnd}
                  onValueChange={(value) => handlePreferenceChange('quietHoursEnd', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Email Digest Frequency</Label>
              <Select
                value={preferences.digestFrequency}
                onValueChange={(value) => handlePreferenceChange('digestFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button onClick={handleSaveSettings} className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setPreferences({
            newMessages: true,
            agentReplies: true,
            taskReminders: true,
            contentReady: true,
            systemAlerts: true,
            mentions: true,
            browserNotifications: true,
            emailDigests: false,
            pushNotifications: true,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            weekendsOnly: false,
            instantNotifications: true,
            digestFrequency: 'daily',
            chatNotifications: true,
            taskNotifications: true,
            contentNotifications: true,
            systemNotifications: true,
          })}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}