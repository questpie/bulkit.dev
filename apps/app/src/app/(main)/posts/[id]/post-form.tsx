'use client'

import type { Post } from '@bulkit/api/modules/posts/dal/posts.dal'
import { apiClient } from '@bulkit/app/api/api.client'
import { ResourcePreview } from '@bulkit/app/app/(main)/posts/[id]/resource-preview'
import { ResourceUploader } from '@bulkit/app/app/(main)/posts/[id]/resource-uploader'
import {
  getPostSchemaFromType,
  PostDetailsSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Textarea } from '@bulkit/ui/components/ui/textarea'
import { cn } from '@bulkit/ui/lib'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useFormContext } from 'react-hook-form'

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
    onSuccess: () => {
      router.refresh()
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    return updateMutation.mutateAsync(data)
  })

  // TODO: remove
  console.log(form.getValues())
  console.log(form.formState.errors)

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

  return (
    <div className='flex flex-col gap-4 w-full'>
      <FormField
        control={form.control}
        name='text'
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Post content</FormLabel>

              <FormControl>
                <Textarea {...field} placeholder='Write your post here' />
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
              {!field.value.length && (
                <ResourceUploader
                  onUploaded={(resources) => {
                    for (const resource of resources) {
                      mediaArray.append({
                        id: resource.id, // we can just set the resource id as this doesn't matter, it just needs to be unique
                        order: mediaArray.fields.length,
                        resource,
                      })
                    }
                  }}
                />
              )}
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

              <div className='flex w-full'>
                {!!field.value.length && (
                  <ResourceUploader
                    variant='button'
                    onUploaded={(resources) => {
                      for (const resource of resources) {
                        mediaArray.append({
                          id: resource.id, // we can just set the resource id as this doesn't matter, it just needs to be unique
                          order: mediaArray.fields.length,
                          resource,
                        })
                      }
                    }}
                  />
                )}
              </div>
            </FormItem>
          )
        }}
      />
    </div>
  )
}
