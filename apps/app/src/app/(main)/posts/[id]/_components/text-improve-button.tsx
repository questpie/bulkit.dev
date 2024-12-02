import { apiClient } from '@bulkit/app/api/api.client'
import { useAppSettings } from '@bulkit/app/app/_components/app-settings-provider'
import { Button } from '@bulkit/ui/components/ui/button'
import { Label } from '@bulkit/ui/components/ui/label'
import {
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverTrigger,
} from '@bulkit/ui/components/ui/responsive-popover'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { cn } from '@bulkit/ui/lib'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { PiSparkle } from 'react-icons/pi'

type TextImproveButtonProps = {
  fieldValue: string
  onValueChange: (value: string) => void
  className?: string
}

const QUICK_PROMPTS = [
  'Fix grammar and spelling',
  'Make it more concise',
  'Fix the tone and phrasing',
  'Add hashtags',
]

export function TextImproveButton(props: TextImproveButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')

  const appSettings = useAppSettings()

  const improveMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiClient.ai.improve.post({
        text: props.fieldValue,
        prompt,
      })
      if (res.error) throw new Error(res.error.value.message)
      return res.data
    },
    onSuccess: (data) => {
      props.onValueChange(data.text)
      setIsOpen(false)
      setPrompt('')
      toast.success('Text improved')
    },
    onError: (error) => {
      toast.error('Failed to improve text', {
        description: error.message,
      })
    },
  })

  if (!appSettings.aiCapabilities.includes('general-purpose')) return null

  return (
    <ResponsivePopover open={isOpen} onOpenChange={setIsOpen}>
      <ResponsivePopoverTrigger asChild>
        <Button
          size='icon'
          variant='ghost'
          className={cn('absolute right-2 bottom-2 rounded-full', props.className)}
        >
          <PiSparkle className='h-4 w-4' />
        </Button>
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent className='w-80'>
        <div className='flex flex-col gap-4'>
          <div className='space-y-2'>
            <h4 className='font-medium leading-none'>Improve Text</h4>
            <p className='text-sm text-muted-foreground'>Select a quick prompt or enter your own</p>
          </div>

          <div className='flex flex-wrap gap-2'>
            {QUICK_PROMPTS.map((quickPrompt) => (
              <Button
                key={quickPrompt}
                size='sm'
                variant='outline'
                onClick={() => {
                  setPrompt(quickPrompt)
                  improveMutation.mutate(quickPrompt)
                }}
              >
                {quickPrompt}
              </Button>
            ))}
          </div>

          <div className='space-y-2'>
            <Label>Custom Prompt</Label>
            <Textarea
              placeholder='Enter your improvement instructions...'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={() => improveMutation.mutate(prompt)}
            disabled={!prompt}
            isLoading={improveMutation.isPending}
          >
            Apply Changes
          </Button>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  )
}
