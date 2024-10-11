'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { apiClient } from '@bulkit/app/api/api.client'
import ChannelPicker from '@bulkit/app/app/(main)/posts/[id]/_components/channel-picker'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-preview'
import {
  ResourceButtonUpload,
  ResourceDropzone,
} from '@bulkit/app/app/(main)/posts/[id]/_components/preview/resource-uploader'
import { PLATFORM_TO_NAME, type Platform } from '@bulkit/shared/constants/db.constants'
import {
  getPostSchemaFromType,
  PostDetailsSchema,
  type PostMediaSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { Alert, AlertDescription, AlertTitle } from '@bulkit/ui/components/ui/alert'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@bulkit/ui/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { useDebouncedValue } from '@bulkit/ui/hooks/use-debounce'
import { cn } from '@bulkit/ui/lib'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type, type Static } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import objectHash from 'object-hash'
import { useEffect, useRef } from 'react'
import {
  get,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
  type FieldPath,
} from 'react-hook-form'
import { LuChevronDown, LuPlus, LuTrash2 } from 'react-icons/lu'
import { PiDotsSixBold, PiDotsSixVerticalBold } from 'react-icons/pi'

type PostFormProviderProps = {
  children?: React.ReactNode
  className?: string
  defaultValues: Post
}

const calculateFormHash = (obj: object) => {
  return objectHash(obj, { excludeKeys: (key) => key === 'id' })
}

export function useIsPostLocked() {
  const form = useFormContext<Post>()

  const postStatus = useWatch({
    control: form.control,
    name: 'status',
  })

  // we can add additional conditions here
  return postStatus !== 'draft'
}

export function PostFormProvider(props: PostFormProviderProps) {
  const form = useForm<Post>({
    defaultValues: { ...props.defaultValues },
    resolver: typeboxResolver(
      Type.Composite([PostDetailsSchema, getPostSchemaFromType(props.defaultValues.type)])
    ),
  })

  const formTriggerRef = useRef<HTMLButtonElement>(null)
  const values = useWatch({
    control: form.control,
  })
  const debouncedValues = useDebouncedValue(values, 500)

  // AUTOSAVE functionality
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!formTriggerRef.current) return
    if (form.formState.isDirty) formTriggerRef.current.click()
  }, [calculateFormHash(debouncedValues)])

  const updateMutation = useMutation({
    mutationFn: apiClient.posts.index.put,
    onSuccess: (res) => {
      if (res.error) {
        if (res.error.status === 400) {
          toast.error('Failed to save post. Please check the form for errors.')
          for (const platform in res.error.value) {
            const platformErrors = res.error.value[platform as Platform]
            for (const error of platformErrors) {
              form.setError(error.path as FieldPath<Post>, {
                type: 'manual',
                message: `${PLATFORM_TO_NAME[platform as Platform]}: ${error.message}`,
              })
            }
          }
        }

        return
      }
      // form.reset(res.data)
      // router.refresh()
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    return toast.promise(updateMutation.mutateAsync(data), {
      loading: 'Saving post...',
      error: 'Failed to save post.',
    })
  })

  return (
    <Form {...form}>
      <form className={cn(props.className)} onSubmit={handleSubmit}>
        {props.children}

        <button type='submit' className='hidden' ref={formTriggerRef} />
      </form>
    </Form>
  )
}

export function PostCommonFields() {
  const form = useFormContext<Post>()

  const postType = useWatch({
    control: form.control,
    name: 'type',
  })

  const isPostLocked = useIsPostLocked()

  return (
    <div className='px-4 pb-4'>
      <FormField
        control={form.control}
        name='channels'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Channels to post to</FormLabel>

              <FormControl>
                <ChannelPicker
                  isDisabled={isPostLocked}
                  value={field.value}
                  onValueChange={field.onChange}
                  postType={postType}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )
        }}
      />
    </div>
  )
}

export function RegularPostFields() {
  const form = useFormContext<Extract<Post, { type: 'post' }>>()
  const mediaArray = useFieldArray({
    control: form.control,
    name: 'media',
  })

  const isPostLocked = useIsPostLocked()

  const lastMediaOrder = mediaArray.fields[mediaArray.fields.length - 1]?.order ?? 1

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over?.id && active.id !== over?.id) {
      const oldIndex = mediaArray.fields.findIndex((item) => item.id === active.id)
      const newIndex = mediaArray.fields.findIndex((item) => item.id === over!.id)
      mediaArray.move(oldIndex, newIndex)
      for (let i = 0; i < mediaArray.fields.length; i++) {
        form.setValue(`media.${i}.order`, i + 1)
      }
    }
  }

  return (
    <div className='flex flex-col gap-4 w-full px-4'>
      <FormField
        control={form.control}
        name='text'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Post content</FormLabel>

              <FormControl>
                <Textarea
                  disabled={isPostLocked}
                  rows={10}
                  {...field}
                  placeholder='Write your post here'
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )
        }}
      />

      <p className='text-sm font-medium'>Post Media</p>
      <div className='flex w-full'>
        {mediaArray.fields.length < 10 && !isPostLocked && (
          <ResourceButtonUpload
            buttonProps={{
              disabled: isPostLocked,
            }}
            maxFiles={10 - mediaArray.fields.length}
            onUploaded={(resources) => {
              if (isPostLocked) return
              for (const resource of resources) {
                mediaArray.append({
                  id: nanoid(),
                  // id: resource.id, // we can just set the resource id as this doesn't matter, it just needs to be unique
                  order: lastMediaOrder + 1,
                  resource,
                })
              }
            }}
          />
        )}
      </div>
      {!!mediaArray.fields.length && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext disabled={isPostLocked} items={mediaArray.fields}>
            <div className='flex flex-row gap-4 flex-wrap w-full'>
              {mediaArray.fields.map((media, index) => {
                return (
                  <MediaItem
                    key={media.id}
                    onRemove={() => {
                      if (isPostLocked) return
                      let i = 0
                      for (const item of mediaArray.fields) {
                        if (i === index) {
                          continue
                        }
                        mediaArray.update(i, {
                          ...item,
                          order: i + 1,
                        })
                        i++
                      }
                      mediaArray.remove(index)
                    }}
                    media={media}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

function MediaItem(props: {
  media: Static<typeof PostMediaSchema>
  onRemove: () => void
}) {
  const isPostLocked = useIsPostLocked()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.media.id,
    disabled: isPostLocked,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className='relative group'>
      {!isPostLocked && (
        <div
          {...attributes}
          {...listeners}
          className='absolute w-full h-full z-10 p-1 flex items-center justify-center bg-black/50 rounded-lg  cursor-move opacity-0 group-hover:opacity-100 transition-opacity'
        >
          <PiDotsSixBold className='text-white' size={32} />
        </div>
      )}
      <ResourcePreview
        key={props.media.id}
        onRemove={!isPostLocked ? props.onRemove : undefined}
        resource={props.media.resource}
        className={cn('h-24 w-24', isDragging && 'opacity-50')}
      />
    </div>
  )
}
export function StoryPostFields() {
  const form = useFormContext<Extract<Post, { type: 'story' }>>()
  const isPostLocked = useIsPostLocked()

  return (
    <div className='flex flex-col gap-4 w-full px-4'>
      <FormField
        control={form.control}
        name='resource'
        render={({ field }) => {
          return (
            <FormItem className='w-full flex flex-col'>
              <FormLabel>Story Media</FormLabel>
              <FormMessage />
              {!field.value && (
                <ResourceDropzone
                  maxFiles={1}
                  disabled={isPostLocked}
                  onUploaded={(resources) => {
                    if (!isPostLocked) field.onChange(resources[0]!)
                  }}
                />
              )}
              {!!field.value && (
                <div className='flex flex-row gap-4 flex-wrap w-full'>
                  <ResourcePreview
                    className='h-24 w-24'
                    onRemove={
                      !isPostLocked
                        ? () => {
                            field.onChange(null)
                          }
                        : undefined
                    }
                    resource={field.value}
                  />
                </div>
              )}
            </FormItem>
          )
        }}
      />
    </div>
  )
}

export function ReelPostFields() {
  const form = useFormContext<Extract<Post, { type: 'reel' }>>()
  const isPostLocked = useIsPostLocked()

  return (
    <div className='flex flex-col gap-4 w-full px-4'>
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Reel description</FormLabel>

              <FormControl>
                <Textarea
                  disabled={isPostLocked}
                  rows={10}
                  {...field}
                  placeholder='Write your reel description here'
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )
        }}
      />
      <FormField
        control={form.control}
        name='resource'
        render={({ field }) => {
          return (
            <FormItem className='w-full flex flex-col'>
              <FormLabel>Reel Media</FormLabel>
              <FormMessage />
              {!field.value && (
                <ResourceDropzone
                  maxFiles={1}
                  disabled={isPostLocked}
                  allowedTypes={['video/*']}
                  onUploaded={(resources) => {
                    field.onChange(resources[0]!)
                  }}
                />
              )}
              {!!field.value && (
                <div className='flex flex-row gap-4 flex-wrap w-full'>
                  <ResourcePreview
                    className='h-24 w-24'
                    onRemove={
                      !isPostLocked
                        ? () => {
                            field.onChange(null)
                          }
                        : undefined
                    }
                    resource={field.value}
                  />
                </div>
              )}
            </FormItem>
          )
        }}
      />
    </div>
  )
}

export function ThreadPostFields() {
  const form = useFormContext<Extract<Post, { type: 'thread' }>>()

  const itemsArray = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const errors = form.formState.errors.items
  const isPostLocked = useIsPostLocked()

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = itemsArray.fields.findIndex((item) => item.id === active.id)
      const newIndex = itemsArray.fields.findIndex((item) => item.id === over?.id)
      itemsArray.move(oldIndex, newIndex)
      for (let i = 0; i < itemsArray.fields.length; i++) {
        form.setValue(`items.${i}.order`, i + 1)
      }
    }
  }

  const lastItemOrder = itemsArray.fields[itemsArray.fields.length - 1]?.order ?? 1

  return (
    <div className={cn('flex flex-col gap-6 w-full px-4')}>
      {!!errors && (
        <Alert variant='destructive'>
          <AlertTitle>Thread Items are Invalid</AlertTitle>
          <AlertDescription>
            {errors.message ?? 'Please fix the issues specified below'}
          </AlertDescription>
        </Alert>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext disabled={isPostLocked} items={itemsArray.fields}>
          {itemsArray.fields.map((item, index) => {
            return (
              <ThreadItem
                key={item.id}
                name={`items.${index}`}
                item={item}
                onRemove={
                  isPostLocked || itemsArray.fields.length <= 0
                    ? undefined
                    : () => {
                        let i = 0
                        for (const item of itemsArray.fields) {
                          if (i === index) continue
                          itemsArray.update(i, {
                            ...item,
                            order: i + 1,
                          })
                          i++
                        }

                        itemsArray.remove(index)
                      }
                }
                canDrag={itemsArray.fields.length > 1}
              />
            )
          })}
        </SortableContext>
      </DndContext>

      <div className='flex justify-end'>
        <Button
          variant='secondary'
          disabled={isPostLocked}
          onClick={() => {
            if (isPostLocked) return
            itemsArray.append({ text: '', order: lastItemOrder + 1, media: [], id: nanoid() })
          }}
        >
          <LuPlus /> Add Thread Item
        </Button>
      </div>
    </div>
  )
}

function ThreadItem(props: {
  item: Extract<Post, { type: 'thread' }>['items'][number]
  name: FieldPath<Extract<Post, { type: 'thread' }>>
  onRemove?: () => void
  canDrag?: boolean
}) {
  const form = useFormContext<Extract<Post, { type: 'thread' }>>()
  const mediaArray = useFieldArray({
    control: form.control,
    name: `${props.name}.media` as 'items.0.media',
  })

  const errors = get(form.formState.errors, props.name)

  const isPostLocked = useIsPostLocked()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.item.id,
    disabled: !props.canDrag || isPostLocked,
  })

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, scaleY: 1 } : null),
    transition,
  }

  const lastMediaOrder = mediaArray.fields[mediaArray.fields.length - 1]?.order ?? 1

  const sensors = useSensors(useSensor(PointerSensor))

  const handleMediaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over?.id && active.id !== over?.id) {
      const oldIndex = mediaArray.fields.findIndex((item) => item.id === active.id)
      const newIndex = mediaArray.fields.findIndex((item) => item.id === over!.id)
      mediaArray.move(oldIndex, newIndex)
      for (let i = 0; i < mediaArray.fields.length; i++) {
        form.setValue(`${props.name}.media.${i}.order` as any, i + 1)
      }
    }
  }

  return (
    <Collapsible className='group/collapsible'>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn('overflow-hidden touch-none', errors && 'border-destructive ')}
      >
        <div className='flex flex-row h-14'>
          <CollapsibleTrigger className='w-full flex-1'>
            <div
              className={cn(
                'flex flex-row h-full px-4 items-center gap-4 text-sm font-bold  rounded'
              )}
            >
              <LuChevronDown className='group-data-[state=open]/collapsible:rotate-180 transition-transform ease-in-out duration-200' />
              <span>Thread {props.item.order}</span>
            </div>
          </CollapsibleTrigger>
          {props.canDrag && (
            <div
              className={cn(
                'w-14 flex items-center h-full justify-center border-r border-border cursor-move hover:bg-accent'
              )}
              {...attributes}
              {...listeners}
            >
              <PiDotsSixVerticalBold />
            </div>
          )}
        </div>

        <CollapsibleContent asChild>
          <div className='p-4 flex flex-col gap-4 border-t border-border'>
            <FormField
              control={form.control}
              name={`${props.name}.text` as 'items.0.text'}
              render={({ field }) => {
                return (
                  <FormItem>
                    {/* <FormLabel>{props.item.order + 1}. Thread content</FormLabel> */}

                    <FormControl>
                      <Textarea
                        disabled={isPostLocked}
                        rows={10}
                        {...field}
                        placeholder='Write your thread here'
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <FormField
              control={form.control}
              name={`${props.name}.media` as 'items.0.media'}
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Post Media</FormLabel>

                    <FormControl>
                      <div className='flex flex-col gap-3'>
                        <div className='flex w-full'>
                          {mediaArray.fields.length < 10 && !isPostLocked && (
                            <ResourceButtonUpload
                              disabled={isPostLocked}
                              maxFiles={10 - mediaArray.fields.length}
                              onUploaded={(resources) => {
                                if (isPostLocked) return
                                for (const resource of resources) {
                                  mediaArray.append({
                                    id: nanoid(),
                                    // id: resource.id, // we can just set the resource id as this doesn't matter, it just needs to be unique
                                    order: lastMediaOrder + 1,
                                    resource,
                                  })
                                }
                              }}
                            />
                          )}
                        </div>
                        <FormMessage />

                        {!!mediaArray.fields.length && (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleMediaDragEnd}
                          >
                            <SortableContext disabled={isPostLocked} items={mediaArray.fields}>
                              <div className='flex flex-row gap-4 flex-wrap w-full'>
                                {mediaArray.fields.map((media, index) => {
                                  return (
                                    <MediaItem
                                      key={media.id}
                                      onRemove={() => {
                                        if (isPostLocked) return
                                        let i = 0
                                        for (const item of mediaArray.fields) {
                                          if (i === index) {
                                            continue
                                          }
                                          mediaArray.update(i, {
                                            ...item,
                                            order: i + 1,
                                          })
                                          i++
                                        }
                                        mediaArray.remove(index)
                                      }}
                                      media={media}
                                    />
                                  )
                                })}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )
              }}
            />

            <div className='flex justify-end pt-4'>
              {props.onRemove && (
                <Button
                  variant='outline'
                  disabled={isPostLocked}
                  onClick={() => {
                    if (isPostLocked) return
                    props.onRemove?.()
                  }}
                >
                  <LuTrash2 /> Remove
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
