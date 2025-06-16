'use client'

import React, { forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Mention } from '@tiptap/extension-mention'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Button } from './button'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Highlighter as HighlightIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@bulkit/ui/lib'

export type RichTextEditorRef = {
  getEditor: () => Editor | null
  getHTML: () => string
  getJSON: () => object
  getText: () => string
  setContent: (content: string) => void
  focus: () => void
  blur: () => void
}

export type MentionItem = {
  id: string
  label: string
  type: 'task' | 'post' | 'user'
}

type RichTextEditorProps = {
  content?: string
  placeholder?: string
  editable?: boolean
  className?: string
  showToolbar?: boolean
  onChange?: (content: string) => void
  onUpdate?: (editor: Editor) => void
  mentions?: {
    items: MentionItem[]
    onSearch?: (query: string) => MentionItem[]
  }
  extensions?: any[]
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content = '',
      placeholder = 'Start typing...',
      editable = true,
      className,
      showToolbar = true,
      onChange,
      onUpdate,
      mentions,
      extensions = [],
    },
    ref
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline cursor-pointer',
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        ...(mentions
          ? [
              Mention.configure({
                HTMLAttributes: {
                  class: 'mention bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-medium',
                },
                suggestion: {
                  items: ({ query }) => {
                    if (mentions.onSearch) {
                      return mentions.onSearch(query)
                    }
                    return mentions.items
                      .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
                      .slice(0, 10)
                  },
                },
              }),
            ]
          : []),
        ...extensions,
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        onChange?.(html)
        onUpdate?.(editor)
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none',
            'min-h-[200px] p-4 border-0',
            className
          ),
        },
      },
    })

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
      getHTML: () => editor?.getHTML() || '',
      getJSON: () => editor?.getJSON() || {},
      getText: () => editor?.getText() || '',
      setContent: (content: string) => editor?.commands.setContent(content),
      focus: () => editor?.commands.focus(),
      blur: () => editor?.commands.blur(),
    }))

    if (!editor) {
      return null
    }

    return (
      <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
        {showToolbar && (
          <div className='flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            >
              <Bold className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            >
              <Italic className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'bg-gray-200' : ''}
            >
              <Strikethrough className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'bg-gray-200' : ''}
            >
              <Code className='h-4 w-4' />
            </Button>

            <div className='w-px h-6 bg-gray-300 mx-1' />

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'bg-gray-200' : ''}
            >
              <HighlightIcon className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                const url = window.prompt('Enter URL:')
                if (url) {
                  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                }
              }}
              className={editor.isActive('link') ? 'bg-gray-200' : ''}
            >
              <LinkIcon className='h-4 w-4' />
            </Button>

            <div className='w-px h-6 bg-gray-300 mx-1' />

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            >
              <List className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            >
              <ListOrdered className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
            >
              <Quote className='h-4 w-4' />
            </Button>

            <div className='w-px h-6 bg-gray-300 mx-1' />

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
            >
              <Undo className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
            >
              <Redo className='h-4 w-4' />
            </Button>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'
