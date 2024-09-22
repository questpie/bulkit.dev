'use client'

import type { Post } from '@bulkit/api/modules/posts/services/posts.service'
import { apiClient } from '@bulkit/app/api/api.client'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/resource-preview'
import {
  ResourceButtonUpload,
  ResourceDropzone,
} from '@bulkit/app/app/(main)/posts/[id]/resource-uploader'
import {
  getPostSchemaFromType,
  PostDetailsSchema,
  type PostMediaSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import { Card } from '@bulkit/ui/components/ui/card'
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
import { cn } from '@bulkit/ui/lib'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type, type Static } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useFormContext, type FieldPath } from 'react-hook-form'
import { LuPlus, LuTrash2 } from 'react-icons/lu'
import { PiDotsSixBold } from 'react-icons/pi'

type PostFormProviderProps = {
  children?: React.ReactNode
  className?: string
  defaultValues: Post
}

export function PostFormProvider(props: PostFormProviderProps) {
  const form = useForm<Post>({
    defaultValues: { ...props.defaultValues },
    resolver: typeboxResolver(
      Type.Composite([PostDetailsSchema, getPostSchemaFromType(props.defaultValues.type)])
    ),
  })

  const router = useRouter()
  const updateMutation = useMutation({
    mutationFn: apiClient.posts.index.put,
    onSuccess: (res) => {
      if (res.error) return
      form.reset(res.data)
      router.refresh()
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    return toast.promise(updateMutation.mutateAsync(data), {
      loading: 'Saving post...',
      success: 'Post saved!',
      error: 'Failed to save post.',
    })
  })

  return (
    <Form {...form}>
      <form className={cn(props.className)} onSubmit={handleSubmit}>
        {props.children}
      </form>
    </Form>
  )
}

export function RegularPostFields() {
  const form = useFormContext<Extract<Post, { type: 'post' }>>()
  const mediaArray = useFieldArray({
    control: form.control,
    name: 'media',
  })

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
                <Textarea rows={10} {...field} placeholder='Write your post here' />
              </FormControl>

              <FormMessage />
            </FormItem>
          )
        }}
      />

      <p className='text-sm font-medium'>Post Media</p>
      <div className='flex w-full'>
        {mediaArray.fields.length < 10 && (
          <ResourceButtonUpload
            maxFiles={10 - mediaArray.fields.length}
            onUploaded={(resources) => {
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
          <SortableContext items={mediaArray.fields} strategy={horizontalListSortingStrategy}>
            <div className='flex flex-row gap-4 flex-wrap w-full'>
              {mediaArray.fields.map((media, index) => {
                return (
                  <MediaItem
                    key={media.id}
                    onRemove={() => {
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.media.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className='relative group'>
      <div
        {...attributes}
        {...listeners}
        className='absolute w-full h-full z-10 p-1 flex items-center justify-center bg-black/50 rounded-lg  cursor-move opacity-0 group-hover:opacity-100 transition-opacity'
      >
        <PiDotsSixBold className='text-white' size={32} />
      </div>
      <ResourcePreview
        key={props.media.id}
        onRemove={props.onRemove}
        resource={props.media.resource}
        className={cn(isDragging && 'opacity-50')}
      />
    </div>
  )
}
export function StoryPostFields() {
  const form = useFormContext<Extract<Post, { type: 'story' }>>()

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
                  onUploaded={(resources) => {
                    field.onChange(resources[0]!)
                  }}
                />
              )}
              {!!field.value && (
                <div className='flex flex-row gap-4 flex-wrap w-full'>
                  <ResourcePreview
                    onRemove={() => {
                      field.onChange(null)
                    }}
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

export function ShortPostFields() {
  const form = useFormContext<Extract<Post, { type: 'short' }>>()

  return (
    <div className='flex flex-col gap-4 w-full px-4'>
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Short description</FormLabel>

              <FormControl>
                <Textarea rows={10} {...field} placeholder='Write your short description here' />
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
              <FormLabel>Story Media</FormLabel>
              <FormMessage />
              {!field.value && (
                <ResourceDropzone
                  maxFiles={1}
                  allowedTypes={['video/*']}
                  onUploaded={(resources) => {
                    field.onChange(resources[0]!)
                  }}
                />
              )}
              {!!field.value && (
                <div className='flex flex-row gap-4 flex-wrap w-full'>
                  <ResourcePreview
                    onRemove={() => {
                      field.onChange(null)
                    }}
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
    <div className='flex flex-col gap-6 w-full px-4'>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemsArray.fields} strategy={verticalListSortingStrategy}>
          {itemsArray.fields.map((item, index) => {
            return (
              <ThreadItem
                key={item.id}
                name={`items.${index}`}
                item={item}
                onRemove={
                  itemsArray.fields.length <= 0
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
          onClick={() =>
            itemsArray.append({ text: '', order: lastItemOrder + 1, media: [], id: nanoid() })
          }
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
    disabled: !props.canDrag,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const lastMediaOrder = mediaArray.fields[mediaArray.fields.length - 1]?.order ?? 1
  return (
    <Card ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'flex flex-row p-4 border-border border-b items-center  gap-4 text-sm font-bold justify-between rounded  mb-2',
          props.canDrag && 'cursor-move hover:bg-accent'
        )}
      >
        <span>Thread {props.item.order}</span> <PiDotsSixBold />
      </div>

      <div className='p-4 flex flex-col gap-4'>
        <FormField
          control={form.control}
          name={`${props.name}.text` as 'items.0.text'}
          render={({ field }) => {
            return (
              <FormItem>
                {/* <FormLabel>{props.item.order + 1}. Thread content</FormLabel> */}

                <FormControl>
                  <Textarea rows={10} {...field} placeholder='Write your thread here' />
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
              <FormItem className='w-full flex flex-col'>
                <FormMessage />

                <div className='flex w-full'>
                  {field.value.length < 4 && (
                    <ResourceButtonUpload
                      buttonProps={{ variant: 'outline', className: 'border-border' }}
                      maxFiles={4 - field.value.length}
                      onUploaded={(resources) => {
                        for (const resource of resources) {
                          mediaArray.append({
                            id: resource.id, // we can just set the resource id as this doesn't matter, it just needs to be unique
                            order: lastMediaOrder + 1,
                            resource,
                          })
                        }
                      }}
                    />
                  )}
                </div>

                {!!field.value.length && (
                  <div className='flex flex-row gap-4 flex-wrap w-full'>
                    {field.value.map((media, index) => {
                      return (
                        <ResourcePreview
                          key={media.id}
                          onRemove={() => {
                            mediaArray.remove(index)
                          }}
                          resource={media.resource}
                        />
                      )
                    })}
                  </div>
                )}
              </FormItem>
            )
          }}
        />

        <div className='flex justify-end pt-4'>
          {props.onRemove && (
            <Button variant='outline' onClick={props.onRemove}>
              <LuTrash2 /> Remove
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
