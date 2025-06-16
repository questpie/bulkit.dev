'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bulkit/ui/components/ui/dialog'
import { Button } from '@bulkit/ui/components/ui/button'
import { Input } from '@bulkit/ui/components/ui/input'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { CreateLabelSchema } from '@bulkit/shared/modules/labels/labels.schemas'
import { useCreateLabelMutation } from '../labels.queries'
import type { CreateLabelInput, Label } from '@bulkit/shared/modules/labels/labels.schemas'

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
  '#6b7280', // gray
]

interface CreateLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLabelCreated?: (label: Label) => void
}

export function CreateLabelDialog({ open, onOpenChange, onLabelCreated }: CreateLabelDialogProps) {
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const createLabelMutation = useCreateLabelMutation()

  const form = useForm<CreateLabelInput>({
    resolver: typeboxResolver(CreateLabelSchema),
    defaultValues: {
      name: '',
      color: PRESET_COLORS[0],
      description: '',
    },
  })

  const handleSubmit = async (data: CreateLabelInput) => {
    try {
      const newLabel = await createLabelMutation.mutateAsync({
        ...data,
        color: selectedColor || PRESET_COLORS[0]!,
      })

      onLabelCreated?.(newLabel)
      onOpenChange(false)
      form.reset()
      setSelectedColor(PRESET_COLORS[0])
    } catch (error) {
      // Error handling is done in the mutation
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
    setSelectedColor(PRESET_COLORS[0])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create New Label</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            {/* Name */}
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder='Label name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Picker */}
            <div className='space-y-2'>
              <FormLabel>Color *</FormLabel>
              <div className='flex flex-wrap gap-2'>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type='button'
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      selectedColor === color
                        ? 'border-gray-900 ring-2 ring-gray-300'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>

              {/* Custom color input */}
              <div className='flex items-center space-x-2 mt-2'>
                <input
                  type='color'
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className='w-8 h-8 rounded border border-gray-300 cursor-pointer'
                />
                <Input
                  type='text'
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder='#000000'
                  className={{ wrapper: 'font-mono text-sm' }}
                />
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Optional description' rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className='p-3 bg-gray-50 rounded-lg'>
              <p className='text-sm text-gray-600 mb-2'>Preview:</p>
              <div
                className='inline-flex items-center px-2 py-1 rounded text-sm border'
                style={{
                  borderColor: selectedColor,
                  color: selectedColor,
                  backgroundColor: `${selectedColor}15`,
                }}
              >
                {form.watch('name') || 'Label name'}
              </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-2 pt-4'>
              <Button type='button' variant='outline' onClick={handleCancel}>
                Cancel
              </Button>
              <Button type='submit' disabled={createLabelMutation.isPending}>
                {createLabelMutation.isPending ? 'Creating...' : 'Create Label'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
