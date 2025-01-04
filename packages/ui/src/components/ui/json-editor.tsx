'use client'

import Editor from 'react-simple-code-editor'
import Prism, { highlight, languages, type Grammar } from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism-tomorrow.css'

import { cn } from '@bulkit/ui/lib'
import { forwardRef } from 'react'

// Ensure JSON grammar is loaded and properly typed
const jsonGrammar = languages.json || Prism.languages.json
if (!jsonGrammar) {
  throw new Error('Prism JSON grammar not loaded')
}
languages.json = jsonGrammar as Grammar

export type JsonEditorProps = {
  value: string
  onChange: (value: string) => void
  onValidate?: (isValid: boolean) => void
  placeholder?: string
  className?: string
  minHeight?: number | string
  maxHeight?: number | string
}

export const JsonEditor = forwardRef<HTMLDivElement, JsonEditorProps>((props, ref) => {
  const {
    value,
    onChange,
    onValidate,
    placeholder,
    className,
    minHeight = 100,
    maxHeight = 300,
  } = props

  const isValidJson = () => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-md border bg-background text-sm shadow-sm',
        !isValidJson() ? 'border-destructive' : 'border-input',
        className
      )}
    >
      <Editor
        value={value}
        onValueChange={(code) => {
          onChange(code)
          onValidate?.(isValidJson())
        }}
        onKeyDown={(e) => {
          // Handle tab key to insert spaces instead of changing focus
          if (e.key === 'Tab') {
            e.preventDefault()
            const target = e.target as HTMLTextAreaElement
            const start = target.selectionStart
            const end = target.selectionEnd

            // Insert 2 spaces at cursor position
            const newValue = value.substring(0, start) + '  ' + value.substring(end)
            onChange(newValue)

            // Move cursor after the inserted spaces
            setTimeout(() => {
              target.selectionStart = target.selectionEnd = start + 2
            }, 0)
          }
        }}
        highlight={(code) => highlight(code, languages.json as Grammar, 'json')}
        padding={12}
        style={{
          fontFamily: 'var(--font-mono)',
          minHeight,
          maxHeight,
          overflow: 'auto',
        }}
        placeholder={placeholder}
        className={cn('placeholder:text-muted-foreground', !isValidJson() && 'text-destructive')}
      />
    </div>
  )
})
