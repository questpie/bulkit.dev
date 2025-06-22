import { ReactRenderer } from '@tiptap/react'
import type { CommentMention } from '@bulkit/shared/modules/comments/comments.schemas'

interface MentionItem {
  id: string
  name: string
  type: 'user' | 'agent' | 'post' | 'media'
  email?: string
  capabilities?: string[]
  entityType?: string
  resourceType?: string
  url?: string
  description?: string
}

// Simple suggestion configuration for TipTap
export const suggestion = {
  items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
    // Mock data - replace with actual API calls
    const mockItems: MentionItem[] = [
      // Users
      {
        id: 'user-1',
        name: 'John Doe',
        type: 'user' as const,
        email: 'john@company.com',
        description: 'Frontend Developer',
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        type: 'user' as const,
        email: 'jane@company.com',
        description: 'UI/UX Designer',
      },
      // AI Agents
      {
        id: 'agent-1',
        name: 'Content Optimizer',
        type: 'agent' as const,
        capabilities: ['content-optimization', 'seo-analysis'],
        description: 'Helps optimize content',
      },
      {
        id: 'agent-2',
        name: 'Analytics Agent',
        type: 'agent' as const,
        capabilities: ['analytics', 'reporting'],
        description: 'Provides insights',
      },
      // Posts
      {
        id: 'post-1',
        name: 'My Amazing Post',
        type: 'post' as const,
        entityType: 'post',
        description: 'Social media post',
      },
      // Media
      {
        id: 'media-1',
        name: 'hero-banner.jpg',
        type: 'media' as const,
        resourceType: 'image',
        description: 'Hero banner image',
      },
    ]

    return mockItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
  },

  render: () => {
    let component: any
    let popup: any

    return {
      onStart: (props: any) => {
        component = document.createElement('div')
        component.className =
          'mention-suggestions bg-white border rounded-md shadow-lg p-2 max-h-60 overflow-y-auto'

        document.body.appendChild(component)

        const updateSuggestions = () => {
          component.innerHTML = ''

          props.items.forEach((item: MentionItem, index: number) => {
            const suggestion = document.createElement('div')
            suggestion.className = `mention-suggestion p-2 rounded cursor-pointer hover:bg-gray-100 ${
              index === props.selectedIndex ? 'bg-blue-50' : ''
            }`

            const icon = getMentionIcon(item.type)
            suggestion.innerHTML = `
              <div class="flex items-center space-x-2">
                <span class="text-sm">${icon}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm truncate">${item.name}</div>
                  ${item.description ? `<div class="text-xs text-gray-500 truncate">${item.description}</div>` : ''}
                </div>
              </div>
            `

            suggestion.addEventListener('click', () => {
              props.command({
                type: item.type,
                id: item.id,
                name: item.name,
                startIndex: 0,
                endIndex: 0,
                ...(item.email && { email: item.email }),
                ...(item.capabilities && { capabilities: item.capabilities }),
                ...(item.entityType && { entityType: item.entityType }),
                ...(item.resourceType && { resourceType: item.resourceType }),
                ...(item.url && { url: item.url }),
              } as CommentMention)
            })

            component.appendChild(suggestion)
          })
        }

        updateSuggestions()
        props.updateSuggestions = updateSuggestions
      },

      onUpdate(props: any) {
        if (props.updateSuggestions) {
          props.updateSuggestions()
        }
      },

      onKeyDown(props: any) {
        if (props.event.key === 'ArrowUp') {
          props.upHandler()
          return true
        }

        if (props.event.key === 'ArrowDown') {
          props.downHandler()
          return true
        }

        if (props.event.key === 'Enter') {
          props.enterHandler()
          return true
        }

        return false
      },

      onExit() {
        if (component) {
          document.body.removeChild(component)
        }
      },
    }
  },
}

function getMentionIcon(type: string) {
  switch (type) {
    case 'user':
      return '👤'
    case 'agent':
      return '🤖'
    case 'post':
      return '📝'
    case 'media':
      return '📎'
    default:
      return '@'
  }
}
