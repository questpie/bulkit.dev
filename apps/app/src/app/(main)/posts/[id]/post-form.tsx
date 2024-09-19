'use client'

import type { Post } from '@bulkit/api/modules/posts/dal/posts.dal'
import { apiClient } from '@bulkit/app/api/api.client'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/resource-preview'
import {
  ResourceButtonUpload,
  ResourceDropzone,
} from '@bulkit/app/app/(main)/posts/[id]/resource-uploader'
import {
  getPostSchemaFromType,
  PostDetailsSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { Button } from '@bulkit/ui/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Separator } from '@bulkit/ui/components/ui/separator'
import { toast } from '@bulkit/ui/components/ui/sonner'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { cn } from '@bulkit/ui/lib'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'
import { useFieldArray, useForm, useFormContext, type FieldPath } from 'react-hook-form'
import { LuPlus, LuTrash2 } from 'react-icons/lu'

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

      <FormField
        control={form.control}
        name='media'
        render={({ field }) => {
          return (
            <FormItem className='w-full flex flex-col'>
              <FormLabel>Post Media</FormLabel>
              <FormMessage />
              <div className='flex w-full'>
                {field.value.length < 10 && (
                  <ResourceButtonUpload
                    maxFiles={10 - field.value.length}
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
                        // onRemove={() => {
                        //   mediaArray.remove(index)
                        // }}
                      />
                    )
                  })}
                </div>
              )}
            </FormItem>
          )
        }}
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

  const lastItemOrder = itemsArray.fields[itemsArray.fields.length - 1]?.order ?? 1

  return (
    <div className='flex flex-col gap-6 w-full'>
      {itemsArray.fields.map((item, index) => {
        return (
          <Fragment key={item.id}>
            <div className='rounded-md p-4 '>
              <ThreadItem name={`items.${index}`} order={index} />
              <div className='flex justify-end pt-4'>
                <Button
                  variant='outline'
                  disabled={itemsArray.fields.length === 1}
                  onClick={() => itemsArray.remove(index)}
                >
                  <LuTrash2 /> Remove
                </Button>
              </div>
            </div>
            <Separator />
          </Fragment>
        )
      })}

      <div className='flex justify-end px-4'>
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

function ThreadItem(props: { order: number; name: FieldPath<Extract<Post, { type: 'thread' }>> }) {
  const form = useFormContext<Extract<Post, { type: 'thread' }>>()
  const mediaArray = useFieldArray({
    control: form.control,
    name: `${props.name}.media` as 'items.0.media',
  })

  const lastMediaOrder = mediaArray.fields[mediaArray.fields.length - 1]?.order ?? 1
  return (
    <div className='flex flex-col gap-4 w-full'>
      <FormField
        control={form.control}
        name={`${props.name}.text` as 'items.0.text'}
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>{props.order + 1}. Thread content</FormLabel>

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
                        // onRemove={() => {
                        //   mediaArray.remove(index)
                        // }}
                      />
                    )
                  })}
                </div>
              )}
            </FormItem>
          )
        }}
      />
    </div>
  )
}
