'use client'

import type { Post } from '@bulkit/api/modules/posts/dal/posts.dal'
import { apiClient } from '@bulkit/app/api/api.client'
import {
  getPostSchemaFromType,
  PostDetailsSchema,
} from '@bulkit/shared/modules/posts/posts.schemas'
import { Form } from '@bulkit/ui/components/ui/form'
import { cn } from '@bulkit/ui/lib'
import { typeboxResolver } from '@hookform/resolvers/typebox'
import { Type } from '@sinclair/typebox'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

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

  return (
    <Form {...form}>
      <form className={cn(props.className)} onSubmit={handleSubmit}>
        {props.children}
      </form>
    </Form>
  )
}
