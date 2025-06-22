'use client'

import type { CommentMention } from '@bulkit/shared/modules/comments/comments.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import { cn } from '@bulkit/ui/lib'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Link } from '@tiptap/extension-link'
import { Mention } from '@tiptap/extension-mention'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { forwardRef, useCallback, useImperativeHandle } from 'react'
import { PiTextB, PiTextItalic, PiCode, PiLink } from 'react-icons/pi'
import { suggestion } from './mention-suggestion'

interface RichTextEditorProps {
  content?: string
  placeholder?: string
  onUpdate?: (content: string, mentions: CommentMention[]) => void
  onSubmit?: () => void
  maxLength?: number
  className?: string
  editable?: boolean
  autoFocus?: boolean
}

export interface RichTextEditorRef {
  getContent: () => string
  getMentions: () => CommentMention[]
  setContent: (content: string) => void
  clear: () => void
  focus: () => void
  insertMention: (mention: CommentMention) => void
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content = '',
      placeholder = 'Write a comment...',
      onUpdate,
      onSubmit,
      maxLength = 10000,
      className,
      editable = true,
      autoFocus = false,
    },
    ref
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: {
            HTMLAttributes: {
              class: 'bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm font-mono',
            },
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        CharacterCount.configure({
          limit: maxLength,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
          },
        }),
        Typography,
        Mention.configure({
          HTMLAttributes: {
            class: 'mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium',
          },
          renderHTML({ options, node }) {
            const mentionType = node.attrs.mentionType || 'user'
            const mentionIcon = getMentionIcon(mentionType)

            return [
              'span',
              {
                ...options.HTMLAttributes,
                'data-type': 'mention',
                'data-id': node.attrs.id,
                'data-mention-type': mentionType,
                'data-label': node.attrs.label,
              },
              `${mentionIcon}@${node.attrs.label}`,
            ]
          },
          suggestion: suggestion,
        }),
      ],
      content,
      editable,
      autofocus: autoFocus,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        const mentions = extractMentionsFromEditor(editor)
        onUpdate?.(html, mentions)
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none focus:outline-none',
            'min-h-[80px] px-3 py-2',
            className
          ),
        },
        handleKeyDown: (view, event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            onSubmit?.()
            return true
          }
          return false
        },
      },
    })

    const extractMentionsFromEditor = useCallback((editor: any): CommentMention[] => {
      const mentions: CommentMention[] = []
      const doc = editor.state.doc

      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'mention') {
          const mentionType = node.attrs.mentionType || 'user'
          const mention: CommentMention = {
            type: mentionType,
            id: node.attrs.id,
            name: node.attrs.label,
            startIndex: pos,
            endIndex: pos + node.nodeSize,
          } as CommentMention

          // Add type-specific properties
          if (mentionType === 'user' && node.attrs.email) {
            ;(mention as any).email = node.attrs.email
          } else if (mentionType === 'agent' && node.attrs.capabilities) {
            ;(mention as any).capabilities = node.attrs.capabilities
          } else if (mentionType === 'post' && node.attrs.entityType) {
            ;(mention as any).entityType = node.attrs.entityType
          } else if (mentionType === 'media') {
            if (node.attrs.resourceType) (mention as any).resourceType = node.attrs.resourceType
            if (node.attrs.url) (mention as any).url = node.attrs.url
          }

          mentions.push(mention)
        }
      })

      return mentions
    }, [])

    const getMentionIcon = (type: string) => {
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

    const insertMention = useCallback(
      (mention: CommentMention) => {
        if (!editor) return

        const mentionNode = {
          type: 'mention',
          attrs: {
            id: mention.id,
            label: mention.name,
            mentionType: mention.type,
            ...(mention.type === 'user' && 'email' in mention && { email: mention.email }),
            ...(mention.type === 'agent' &&
              'capabilities' in mention && { capabilities: mention.capabilities }),
            ...(mention.type === 'post' &&
              'entityType' in mention && { entityType: mention.entityType }),
            ...(mention.type === 'media' && {
              ...('resourceType' in mention && { resourceType: mention.resourceType }),
              ...('url' in mention && { url: mention.url }),
            }),
          },
        }

        editor.chain().focus().insertContent(mentionNode).run()
      },
      [editor]
    )

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || '',
      getMentions: () => (editor ? extractMentionsFromEditor(editor) : []),
      setContent: (content: string) => editor?.commands.setContent(content),
      clear: () => editor?.commands.clearContent(),
      focus: () => editor?.commands.focus(),
      insertMention,
    }))

    const toggleBold = () => editor?.chain().focus().toggleBold().run()
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
    const toggleCode = () => editor?.chain().focus().toggleCode().run()

    const addLink = () => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor?.chain().focus().setLink({ href: url }).run()
      }
    }

    if (!editor) {
      return null
    }

    const characterCount = editor.storage.characterCount.characters()
    const isNearLimit = characterCount > maxLength * 0.8

    return (
      <div className='border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'>
        {/* Toolbar */}
        {editable && (
          <div className='flex items-center justify-between border-b border-border px-3 py-2'>
            <div className='flex items-center space-x-1'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className={cn(
                  'h-8 px-2',
                  editor.isActive('bold') && 'bg-accent text-accent-foreground'
                )}
                onClick={toggleBold}
              >
                <PiTextB className='h-4 w-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className={cn(
                  'h-8 px-2',
                  editor.isActive('italic') && 'bg-accent text-accent-foreground'
                )}
                onClick={toggleItalic}
              >
                <PiTextItalic className='h-4 w-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className={cn(
                  'h-8 px-2',
                  editor.isActive('code') && 'bg-accent text-accent-foreground'
                )}
                onClick={toggleCode}
              >
                <PiCode className='h-4 w-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-8 px-2'
                onClick={addLink}
              >
                <PiLink className='h-4 w-4' />
              </Button>
            </div>

            {/* Character Count */}
            <div
              className={cn(
                'text-xs text-muted-foreground',
                isNearLimit && 'text-yellow-600',
                characterCount >= maxLength && 'text-red-600'
              )}
            >
              {characterCount}/{maxLength}
            </div>
          </div>
        )}

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className={cn('min-h-[80px]', !editable && 'cursor-default')}
        />
      </div>
    )
  }
)
