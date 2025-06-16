'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, X, Plus } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@bulkit/ui/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@bulkit/ui/components/ui/popover'
import { Button } from '@bulkit/ui/components/ui/button'
import { Badge } from '@bulkit/ui/components/ui/badge'
import type { Label } from '@bulkit/shared/modules/labels/labels.schemas'
import { labelsQueryOptions } from '@bulkit/app/app/(main)/labels/labels.queries'
import { CreateLabelDialog } from '@bulkit/app/app/(main)/labels/_components/create-label-dialog'

interface LabelSelectorProps {
  selectedLabels: Label[]
  onLabelsChange: (labels: Label[]) => void
  placeholder?: string
  maxLabels?: number
  disabled?: boolean
}

export function LabelSelector({
  selectedLabels,
  onLabelsChange,
  placeholder = 'Select labels...',
  maxLabels,
  disabled = false,
}: LabelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: labelsData } = useQuery(labelsQueryOptions())
  const availableLabels = labelsData?.data || []

  const selectedLabelIds = new Set(selectedLabels.map((label) => label.id))

  const handleLabelToggle = (label: Label) => {
    if (selectedLabelIds.has(label.id)) {
      // Remove label
      onLabelsChange(selectedLabels.filter((l) => l.id !== label.id))
    } else {
      // Add label (if not at max)
      if (!maxLabels || selectedLabels.length < maxLabels) {
        onLabelsChange([...selectedLabels, label])
      }
    }
  }

  const handleRemoveLabel = (labelId: string) => {
    onLabelsChange(selectedLabels.filter((l) => l.id !== labelId))
  }

  const canAddMore = !maxLabels || selectedLabels.length < maxLabels

  return (
    <div className='space-y-2'>
      {/* Selected Labels Display */}
      {selectedLabels.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {selectedLabels.map((label) => (
            <Badge
              key={label.id}
              variant='secondary'
              className='text-xs'
              style={{
                borderColor: label.color,
                color: label.color,
                backgroundColor: `${label.color}15`,
              }}
            >
              {label.name}
              {!disabled && (
                <X
                  className='ml-1 h-3 w-3 cursor-pointer hover:bg-gray-200 rounded'
                  onClick={() => handleRemoveLabel(label.id)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Label Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            aria-expanded={open}
            className='w-full justify-start'
            disabled={disabled || (!canAddMore && selectedLabels.length > 0)}
          >
            {selectedLabels.length === 0
              ? placeholder
              : `${selectedLabels.length} label${selectedLabels.length > 1 ? 's' : ''} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Search labels...' className='h-9' />
            <CommandList>
              <CommandEmpty>
                <div className='text-center py-4'>
                  <p className='text-sm text-gray-500 mb-2'>No labels found</p>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setCreateDialogOpen(true)
                      setOpen(false)
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Create new label
                  </Button>
                </div>
              </CommandEmpty>

              <CommandGroup>
                {availableLabels.map((label) => {
                  const isSelected = selectedLabelIds.has(label.id)
                  const isDisabled = !isSelected && !canAddMore

                  return (
                    <CommandItem
                      key={label.id}
                      value={label.name}
                      onSelect={() => {
                        if (!isDisabled) {
                          handleLabelToggle(label)
                        }
                      }}
                      className={isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    >
                      <div className='flex items-center space-x-2 flex-1'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: label.color }}
                        />
                        <span className='flex-1'>{label.name}</span>
                        {isSelected && <Check className='h-4 w-4' />}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Create new label option */}
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setCreateDialogOpen(true)
                    setOpen(false)
                  }}
                  className='cursor-pointer border-t'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Create new label
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Label Dialog */}
      <CreateLabelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLabelCreated={(newLabel: Label) => {
          if (canAddMore) {
            onLabelsChange([...selectedLabels, newLabel])
          }
        }}
      />
    </div>
  )
}
