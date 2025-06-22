'use client'

import { useState } from 'react'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { Badge } from '@bulkit/ui/components/ui/badge'
import { Label } from '@bulkit/ui/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { 
  CheckSquare,
  Clock,
  Flag,
  User,
  Calendar,
  Tag,
  Plus,
  Save,
  Loader2,
  AlertCircle,
  Target,
  X,
} from 'react-icons/lu'
import { cn } from '@bulkit/ui/lib'

interface QuickTaskCreatorProps {
  conversationId: string
  onComplete: () => void
}

const priorities = [
  { id: 'low', label: 'Low', color: 'bg-gray-500', description: 'Can wait' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-500', description: 'Normal priority' },
  { id: 'high', label: 'High', color: 'bg-orange-500', description: 'Important' },
  { id: 'critical', label: 'Critical', color: 'bg-red-500', description: 'Urgent' },
]

const taskTypes = [
  { id: 'content', label: 'Content Task', icon: CheckSquare, description: 'Create or edit content' },
  { id: 'review', label: 'Review Task', icon: Target, description: 'Review and approve content' },
  { id: 'reminder', label: 'Reminder', icon: Clock, description: 'Simple reminder or deadline' },
  { id: 'meeting', label: 'Meeting', icon: User, description: 'Schedule a meeting or call' },
]

export function QuickTaskCreator({ conversationId, onComplete }: QuickTaskCreatorProps) {
  const [taskType, setTaskType] = useState('content')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [assignee, setAssignee] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()])
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (label: string) => {
    setLabels(prev => prev.filter(l => l !== label))
  }

  const generateTaskTitle = () => {
    const templates = {
      content: [
        'Create social media post about',
        'Write blog article on',
        'Design graphics for',
        'Edit video content for',
      ],
      review: [
        'Review and approve',
        'Proofread content for',
        'Check compliance of',
        'Quality check for',
      ],
      reminder: [
        'Follow up on',
        'Check status of',
        'Remind about',
        'Schedule review for',
      ],
      meeting: [
        'Schedule meeting about',
        'Call client regarding',
        'Team sync on',
        'Review session for',
      ],
    }
    
    const typeTemplates = templates[taskType as keyof typeof templates]
    const randomTemplate = typeTemplates[Math.floor(Math.random() * typeTemplates.length)]
    setTitle(randomTemplate + ' ')
  }

  const handleCreate = async () => {
    setIsCreating(true)
    
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        type: taskType,
        dueDate: dueDate && dueTime ? new Date(`${dueDate}T${dueTime}`) : 
                 dueDate ? new Date(dueDate) : undefined,
        assignee: assignee || undefined,
        labels,
        status: 'todo',
        conversationId, // Link to chat conversation
      }

      // Mock API call - would integrate with actual task creation service
      console.log('Creating task:', taskData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onComplete()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const canCreate = title.trim()

  const selectedPriority = priorities.find(p => p.id === priority)
  const selectedTaskType = taskTypes.find(t => t.id === taskType)

  return (
    <div className="space-y-6">
      {/* Task Type Selection */}
      <div className="space-y-3">
        <Label>Task Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {taskTypes.map(type => {
            const Icon = type.icon
            return (
              <Button
                key={type.id}
                variant={taskType === type.id ? 'default' : 'outline'}
                onClick={() => setTaskType(type.id)}
                className="h-auto p-3 flex flex-col items-center gap-2"
              >
                <Icon className="w-5 h-5" />
                <div className="text-center">
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Task Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Task Title</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateTaskTitle}
            className="text-xs"
          >
            <Target className="w-3 h-3 mr-1" />
            Generate
          </Button>
        </div>
        <Input
          id="title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Task Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Add more details about this task..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-20 resize-none"
          rows={3}
        />
      </div>

      {/* Priority and Assignment Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", selectedPriority?.color)} />
                  {selectedPriority?.label}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {priorities.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", p.color)} />
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignee">Assign To (Optional)</Label>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              <SelectItem value="me">Assign to me</SelectItem>
              <SelectItem value="team">Team member</SelectItem>
              <SelectItem value="ai">AI Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Due Date (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-1">
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={!dueDate}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              setDueDate(today)
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setDueDate(tomorrow.toISOString().split('T')[0])
            }}
          >
            Tomorrow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextWeek = new Date()
              nextWeek.setDate(nextWeek.getDate() + 7)
              setDueDate(nextWeek.toISOString().split('T')[0])
            }}
          >
            Next Week
          </Button>
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-3">
        <Label>Labels (Optional)</Label>
        
        <div className="flex gap-2">
          <Input
            placeholder="Add label..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddLabel}
            disabled={!newLabel.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {labels.map(label => (
              <Badge
                key={label}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLabel(label)}
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-1">
          {['urgent', 'content', 'review', 'meeting'].map(quickLabel => (
            <Button
              key={quickLabel}
              variant="outline"
              size="sm"
              onClick={() => {
                if (!labels.includes(quickLabel)) {
                  setLabels(prev => [...prev, quickLabel])
                }
              }}
              disabled={labels.includes(quickLabel)}
              className="text-xs"
            >
              + {quickLabel}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {canCreate && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Task Preview
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{title}</span>
              <div className={cn("w-2 h-2 rounded-full", selectedPriority?.color)} />
              <Badge variant="outline" className="text-xs">
                {selectedPriority?.label}
              </Badge>
            </div>
            
            {description && (
              <div className="text-muted-foreground">{description}</div>
            )}
            
            {dueDate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Due: {new Date(dueDate).toLocaleDateString()}
                {dueTime && ` at ${dueTime}`}
              </div>
            )}
            
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {labels.map(label => (
                  <Badge key={label} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onComplete}
          disabled={isCreating}
          className="flex-1"
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleCreate}
          disabled={!canCreate || isCreating}
          className="flex-1"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Create Task
        </Button>
      </div>
    </div>
  )
}